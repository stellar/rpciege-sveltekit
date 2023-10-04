import { dev } from "$app/environment";
import { error, json } from "@sveltejs/kit";
import { Account, Asset, Keypair, Networks, Operation, Transaction, TransactionBuilder, type AuthFlag } from "stellar-base";
import jwt from '@tsndr/cloudflare-worker-jwt'
import { deriveNFTIssuer } from "$lib/utils";

const networkPassphrase = dev ? Networks.TESTNET : Networks.PUBLIC
const horizon_url = dev ? 'https://horizon-testnet.stellar.org' : 'https://horizon.stellar.org'

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, platform }) {
  const inToken = request.headers.get('authorization')?.replace('Bearer ', '')
  const { 
    tx,
    pubkey,
    records,
    codes
  }: any = await request.json()

  if (
    pubkey 
    && records?.length
  ) {
    const account: any = await fetch(`${horizon_url}/accounts/${pubkey}`).then((res) => res.json())
    const source = new Account(pubkey, account?.sequence)

    let transaction: Transaction|TransactionBuilder = new TransactionBuilder(source, { 
      fee: (1_000_000).toString(), 
      networkPassphrase: dev ? Networks.TESTNET : Networks.PUBLIC
    })
    .addOperation(Operation.beginSponsoringFutureReserves({
      sponsoredId: pubkey,
      source: platform?.env?.RPCIEGE_PK
    }))

    for (const record of records) {
      transaction
      .addOperation(Operation.changeTrust({
        asset: new Asset(record.code, record.issuer),
        // limit: '0.0000001', // NOTE maybe we don't limit this. If you trick the system GGs. It's not an auth required asset so the limit isn't enforcable
      }))
      .addOperation(Operation.claimClaimableBalance({
        balanceId: record.id
      }))
    }

    transaction = transaction
    .addOperation(Operation.endSponsoringFutureReserves({}))
    .setTimeout(30)
    .build()

    transaction.sign(Keypair.fromSecret(platform?.env?.RPCIEGE_SK))

    const outToken = await jwt.sign({ 
      hash: transaction.hash().toString('hex'),
      exp: Math.floor(Date.now() / 1000) + 60 // 1 minute
    }, platform?.env?.JWT_SECRET)

    return json({
      token: outToken,
      xdr: transaction.toXDR(),
    })
  }

  if ( // Fortress Cards
    pubkey 
    && codes?.length
  ) {
    const signers = []
    const account: any = await fetch(`${horizon_url}/accounts/${pubkey}`).then((res) => res.json())
    const source = new Account(pubkey, account?.sequence)

    let transaction: Transaction|TransactionBuilder = new TransactionBuilder(source, { 
      fee: (1_000_000).toString(), 
      networkPassphrase: dev ? Networks.TESTNET : Networks.PUBLIC
    })

    for (const code of codes) {
      const issuerKeypair = await deriveNFTIssuer(code, platform)
      const issuerPublicKey = issuerKeypair.publicKey()
      const asset = new Asset(code, issuerPublicKey)

      const account: any = await fetch(`${horizon_url}/accounts/${issuerPublicKey}`)
      .then((res) => res.json())
      .then((res: any) => !!res?.id)
      .catch(() => null)

      if (!account) {
        // Create account
        transaction
        .addOperation(Operation.beginSponsoringFutureReserves({
          sponsoredId: issuerPublicKey,
          source: platform?.env?.RPCIEGE_PK
        }))
        .addOperation(Operation.createAccount({
          destination: issuerPublicKey,
          startingBalance: '0',
          source: platform?.env?.RPCIEGE_PK
        }))
        .addOperation(Operation.setOptions({
          homeDomain: 'fastcheapandoutofcontrol.com',
          setFlags: 10 as AuthFlag,
          masterWeight: 0,
          signer: {
            ed25519PublicKey: platform?.env?.RPCIEGE_PK,
            weight: 1
          },
          source: issuerPublicKey
        }))
        .addOperation(Operation.manageData({
          name: 'dataurl',
          value: `assets.rpciege.com/${code}.json`,
          source: issuerPublicKey
        }))
        .addOperation(Operation.endSponsoringFutureReserves({
          source: issuerPublicKey
        }))

        signers.push(issuerKeypair)
      }

      // Issue NFTs
      transaction
      .addOperation(Operation.beginSponsoringFutureReserves({
        sponsoredId: pubkey,
        source: platform?.env?.RPCIEGE_PK
      }))
      .addOperation(Operation.changeTrust({
        asset,
        limit: '0.0000001',
      }))
      .addOperation(Operation.payment({
        destination: pubkey,
        asset,
        amount: '0.0000001',
        source: issuerPublicKey
      }))
      .addOperation(Operation.endSponsoringFutureReserves({}))
    }

    transaction = transaction
    .setTimeout(30)
    .build()

    for (const signer of signers) {
      transaction.sign(signer)
    }

    transaction.sign(Keypair.fromSecret(platform?.env?.RPCIEGE_SK))

    const outToken = await jwt.sign({ 
      hash: transaction.hash().toString('hex'),
      exp: Math.floor(Date.now() / 1000) + 60 // 1 minute
    }, platform?.env?.JWT_SECRET)

    return json({
      token: outToken,
      xdr: transaction.toXDR(),
    })
  }

  if (!inToken)
    throw error(400, { message: 'Missing token' })  

  if (!await jwt.verify(inToken, platform?.env?.JWT_SECRET))
    throw error(401, { message: 'Invalid token' })
  
  const { payload } = jwt.decode(inToken)

  if (tx && payload.hash) {
    const transaction = new Transaction(tx, networkPassphrase);

    if (payload.hash !== transaction.hash().toString('hex'))
      throw error(400, { message: 'Invalid hash' })

    const bumpedTransaction = TransactionBuilder.buildFeeBumpTransaction(
      platform?.env?.RPCIEGE_PK,
      (1_000_000).toString(),
      transaction, 
      networkPassphrase
    )

    bumpedTransaction.sign(Keypair.fromSecret(platform?.env?.RPCIEGE_SK));

    return json({
      xdr: bumpedTransaction.toXDR()
    })
  }

  else if ( // Community Card
    payload.code 
    && payload.issuer
  ) {
    const issuerKeypair = await deriveNFTIssuer(payload.code, platform)
    const issuerPublicKey = issuerKeypair.publicKey()
    const account: any = await fetch(`${horizon_url}/accounts/${pubkey}`).then((res) => res.json())
    const source = new Account(pubkey, account?.sequence)
    const asset = new Asset(payload.code, payload.issuer)

    let transaction: Transaction|TransactionBuilder = new TransactionBuilder(source, { 
      fee: (1_000_000).toString(), 
      networkPassphrase: dev ? Networks.TESTNET : Networks.PUBLIC
    })
  
    // Create account
    .addOperation(Operation.beginSponsoringFutureReserves({
      sponsoredId: issuerPublicKey,
      source: platform?.env?.RPCIEGE_PK
    }))
    .addOperation(Operation.createAccount({
      destination: issuerPublicKey,
      startingBalance: '0',
      source: platform?.env?.RPCIEGE_PK
    }))
    .addOperation(Operation.setOptions({
      homeDomain: 'fastcheapandoutofcontrol.com',
      setFlags: 10 as AuthFlag,
      masterWeight: 0,
      signer: {
        ed25519PublicKey: platform?.env?.RPCIEGE_PK,
        weight: 1
      },
      source: issuerPublicKey
    }))
    .addOperation(Operation.manageData({
      name: 'dataurl',
      value: `assets.rpciege.com/${payload.code}.json`,
      source: issuerPublicKey
    }))
    .addOperation(Operation.endSponsoringFutureReserves({
      source: issuerPublicKey
    }))

    // Issue NFTs
    .addOperation(Operation.beginSponsoringFutureReserves({
      sponsoredId: pubkey,
      source: platform?.env?.RPCIEGE_PK
    }))
    .addOperation(Operation.changeTrust({
      asset,
    }))
    .addOperation(Operation.payment({
      destination: pubkey,
      asset,
      amount: '0.0000005', // Issue 5 cards to the user
      source: payload.issuer
    }))
    .addOperation(Operation.endSponsoringFutureReserves({}))

    .setTimeout(30)
    .build()

    transaction.sign(
      issuerKeypair,
      Keypair.fromSecret(platform?.env?.RPCIEGE_SK)
    )

    const outToken = await jwt.sign({ 
      hash: transaction.hash().toString('hex'),
      exp: Math.floor(Date.now() / 1000) + 60 // 1 minute
    }, platform?.env?.JWT_SECRET)

    return json({
      token: outToken,
      xdr: transaction.toXDR(),
    })
  }
  
  else {
    throw error(404, { message: 'Not Found'})
  }
}
