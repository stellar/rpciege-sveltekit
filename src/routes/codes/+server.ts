import { error, json } from "@sveltejs/kit";
import jwt from '@tsndr/cloudflare-worker-jwt'

/** @type {import('./$types').RequestHandler} */
export async function GET({ request, platform }) {
  let token = request.headers.get('authorization')?.replace('Bearer ', '')

  if (!token)
    throw error(401, { message: 'Missing token' })

  if (!await jwt.verify(token, platform?.env?.JWT_SECRET))
    throw error(401, { message: 'Invalid token' })

  const { payload } = jwt.decode(token)
  
  let codes = []

  for (const code of payload.codes) {
    codes.push({
      code,
      status: await platform?.env?.REFERRAL_CODES.get(code)
    })
  }

  // TODO maybe check if the user still exists and if not flush the localStorage token

  return json(codes)
}