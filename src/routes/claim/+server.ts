import { dev } from "$app/environment";
import { error, json } from "@sveltejs/kit";
import { Account, Asset, Keypair, Networks, Operation, Transaction, TransactionBuilder } from "stellar-base";
import jwt from '@tsndr/cloudflare-worker-jwt'

const networkPassphrase = dev ? Networks.TESTNET : Networks.PUBLIC
const horizon_url = dev ? 'https://horizon-testnet.stellar.org' : 'https://horizon.stellar.org'

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, platform }) {
  const { 
    tx,
    pubkey,
    records
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

    const token = await jwt.sign({ 
      hash: transaction.hash().toString('hex'),
      exp: Math.floor(Date.now() / 1000) + 60 // 1 minute
    }, platform?.env?.JWT_SECRET)

    return json({
      token,
      xdr: transaction.toXDR(),
    })
  } 
  
  else if (tx) {
    let token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token)
      throw error(401, { message: 'Missing token' })

    if (!await jwt.verify(token, platform?.env?.JWT_SECRET))
      throw error(401, { message: 'Invalid token' })

    const { payload } = jwt.decode(token)
    const transaction = new Transaction(tx, networkPassphrase);

    if (payload.hash !== transaction.hash().toString('hex'))
      throw error(401, { message: 'Invalid hash' })

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
  
  else {
    throw error(404, { message: 'Not Found'})
  }
}