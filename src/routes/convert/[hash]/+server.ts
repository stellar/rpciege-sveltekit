import { text } from "@sveltejs/kit";
import { StrKey } from "stellar-base"; 

/** @type {import('./$types').RequestHandler} */
export async function GET({ request, platform, params }) {
  let hash

  if (params.hash.length === 64)
    hash = StrKey.encodeContract(
      Buffer.from(params.hash, 'hex')
    )

  else if (params.hash.length === 56)
    hash = StrKey.decodeContract(params.hash).toString('hex')

  return text(hash)
}