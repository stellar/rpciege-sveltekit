import { submitClaimableBalance } from "$lib/stellar";
import { error, fail, text } from "@sveltejs/kit";
import jwt from '@tsndr/cloudflare-worker-jwt'

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, platform, params }) {
  let token = request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token)
    fail(401, { message: 'Missing token' })

  if (!await jwt.verify(token, platform?.env?.JWT_SECRET))
    fail(401, { message: 'Invalid token' })

  const { payload } = jwt.decode(token)
  
  let codes = []
  let index = 0

  for (const code of payload.codes) {
    index++

    const storedReferralCode = await platform?.env?.REFERRAL_CODES.get(code)

    codes.push({
      index,
      code,
      status: storedReferralCode
    })
  }

  const codeObject = codes.find(({code}) => code === params.code)

  if (!codeObject?.status)
    throw error(400, { message: 'Invalid code' })

  const data: any = await request.json()
  await submitClaimableBalance(codeObject?.index, codeObject?.code, data?.pubkey, platform)

  return text('OK')
}