import { StrKey, Account, Asset, Claimant, Keypair, Networks, Operation, TransactionBuilder } from "stellar-base";
import { fetcher } from 'itty-fetcher'
import { error } from "@sveltejs/kit";

export async function submitClaimableBalance(index: number, referral: string, pubkey: string, platform: App.Platform | undefined) {
  if (
    !pubkey
    || !StrKey.isValidEd25519PublicKey(pubkey)
  ) throw error(400, { message: 'Invalid pubkey' })

  const { STELLAR_NETWORK, HORIZON_URL, FCA00C_PK, FCA00C_SK } = platform?.env
  
  const api = fetcher({ 
    base: HORIZON_URL,
    handleResponse: async (res) => {
      if (res.ok)
        return res.json()

      throw await res.json()
    }
  })
  
  const rpciege_account_raw: any = await api.get(`/accounts/${FCA00C_PK}`)
  const rpciege_account = new Account(rpciege_account_raw?.account_id, rpciege_account_raw?.sequence)

  const issuer_public_key = platform?.env?.[`POSTER_${index}_PK`]
  const asset = new Asset(`FCA00C${index.toString().padStart(6, '0')}`, issuer_public_key)

  let transaction = new TransactionBuilder(rpciege_account, {
    fee: (1_000_000).toString(),
    networkPassphrase: Networks[STELLAR_NETWORK],
  })
  .addOperation(Operation.beginSponsoringFutureReserves({
    sponsoredId: issuer_public_key,
    source: FCA00C_PK
  }))
  .addOperation(Operation.createClaimableBalance({
    asset,
    amount: '0.0000001',
    claimants: [
      new Claimant(pubkey, Claimant.predicateUnconditional())
    ],
    source: issuer_public_key
  }))
  .addOperation(Operation.endSponsoringFutureReserves({
    source: issuer_public_key
  }))
  .setTimeout(0)
  .build()

  transaction.sign(Keypair.fromSecret(FCA00C_SK))

  const txBody = new FormData()
        txBody.append('tx', transaction.toXDR())

  await api
  .post(`/transactions`, txBody)
  .then(async (res: any) => {
    try {
      await platform?.env?.REFERRAL_CODES.delete(referral)
    } catch {}
  })
}