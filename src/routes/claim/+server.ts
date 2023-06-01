import { dev } from "$app/environment";
import { error, text } from "@sveltejs/kit";
import { Account, Asset, Keypair, Networks, Operation, Transaction, TransactionBuilder } from "stellar-base";

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

    return text(transaction.toXDR())
  } 
  
  else if (tx) {
    const transaction = new Transaction(tx, networkPassphrase);
    const bumpedTransaction = TransactionBuilder.buildFeeBumpTransaction(
      platform?.env?.RPCIEGE_PK,
      (1_000_000).toString(),
      transaction, 
      networkPassphrase
    )

    bumpedTransaction.sign(Keypair.fromSecret(platform?.env?.RPCIEGE_SK));

    return text(bumpedTransaction.toXDR())
  } 
  
  else {
    throw error(404, { message: 'Not Found'})
  }
}