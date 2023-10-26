import { dev } from "$app/environment";
import { Utils } from "$lib/stellar-sdk-utils";
import { error, text } from "@sveltejs/kit";
import { Networks, Transaction } from "stellar-base";

const min_awards = 15
const networkPassphrase = dev ? Networks.TESTNET : Networks.PUBLIC

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, platform }) {
    const body: any = await request.json()
    const tx = new Transaction(body.xdr, networkPassphrase)
    const verified = Utils.verifyTxSignedBy(tx, body.pubkey)

    if (!verified)
        throw error(400, 'Invalid signature')

    const { keys: nfts }: any = await platform?.env?.NFTS.list({prefix: `${body.pubkey}:`, limit: min_awards})

    if (!dev && (nfts.length < min_awards))
        throw error(400, 'Insufficient awards')

    let code = dev ? '001122' : await platform?.env?.GIVEAWAY_CODES.get(body.pubkey)

    if (!code) {
        const { keys: codes }: any = await platform?.env?.GIVEAWAY_CODES.list({limit: 1})

        if (!codes.length)
            throw error(400, 'No code')

        code = await platform?.env?.GIVEAWAY_CODES.get(codes[0].name)

        if (!code)
            throw error(400, 'No code')

        await platform?.env?.GIVEAWAY_CODES.put(body.pubkey, code)
        await platform?.env?.GIVEAWAY_CODES.delete(codes[0].name)
    }
    
    return text(code)
}