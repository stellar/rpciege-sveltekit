import { text } from "@sveltejs/kit";
import { Address } from "stellar-base";

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  let hash

  if (params.hash.length === 64)
    hash = Address.contract(Buffer.from(params.hash, 'hex'))

  else if (params.hash.length === 56)
    hash = Address.fromString(params.hash)._key.toString('hex')

  return text(hash)
}