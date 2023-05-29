import { fail } from '@sveltejs/kit'
import { sendCode, validateAddress } from '$lib/email'
import { sha256 } from '$lib/utils'
import jwt from '@tsndr/cloudflare-worker-jwt'
import { dev } from '$app/environment'

export const actions = {
  enlist: async ({ request, platform }) => {
    const data = await request.formData()
    
    // const token = data.get('cf-turnstile-response')
    // const ip = request.headers.get('CF-Connecting-IP')

    // if (
    //   !dev
    //   && token
    //   && ip
    // ) {
    //   let formData = new FormData();
    //       formData.append('secret', platform?.env?.CF_SECRET);
    //       formData.append('response', token);
    //       formData.append('remoteip', ip);

    //   const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    //   const result = await fetch(url, {
    //     body: formData,
    //     method: 'POST',
    //   });

    //   const outcome = await result.json();

    //   console.log(outcome);

    //   if (!outcome.success)
    //     return fail(400, { missing: true })
    // }

    const referral = data.get('referral')?.toString()

    let email = data.get('email')?.toString()
        email = email?.toLowerCase().replace(/\s/g, '')

    if (!email)
      return fail(400, { missing: true })

    const id = await sha256(email)
    const emailExists = await platform?.env?.EMAILS.get(id)

    if (!emailExists) {
      const emailRegex = new RegExp(/^[A-Za-z0-9_!#$%&'*+\/=?`{|}~^.-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}$/, 'gmi')
      const isValidEmail = emailRegex.test(email)

      if (!isValidEmail)
        return fail(400, { invalid: true })

      const { result }: any = await validateAddress(email, platform?.env)

      if (result?.verdict === 'Invalid')
        return fail(400, { invalid: true })
    }

    await sendCode(email, id, referral, platform?.env)

    return { id, email, referral }
  },
  confirm: async ({ request, platform }) => {
    const data = await request.formData()

    let id = data.get('id')
    let email = data.get('email')
    let code = data.get('code')

    if (!id || !code)
      return fail(400, { id, email, missing: true })

    const storedEmail = await platform?.env?.EMAILS.getWithMetadata(id)
    const storedCode = dev ? {value: '0', metadata: null} : await platform?.env?.EMAILS.getWithMetadata(`code:${id}`)
    const referralCodes = storedEmail?.metadata?.codes || new Array(5).fill(0).map(() => Math.random().toString(36).slice(2))

    let referral = data.get('referral') || storedCode?.metadata?.referral

    if (storedCode?.value !== code)
      return fail(400, { id, email, invalid: true })

    if (!storedEmail?.value) {
      await platform?.env?.EMAILS.put(id, email, { metadata: { email, codes: referralCodes }})

      for (const code of referralCodes)
        await platform?.env?.REFERRAL_CODES.put(code, 'unused')

      if (
        referral
        && await platform?.env?.REFERRAL_CODES.get(referral)
      ) await platform?.env?.REFERRAL_CODES.put(referral, 'unclaimed')
    }

    const token = await jwt.sign({ id, email, codes: referralCodes,
      exp: Math.floor(Date.now() / 1000) + (4 * 7 * 24 * 60 * 60) // 4 weeks
    }, platform?.env?.JWT_SECRET)

    await platform?.env?.EMAILS.delete(`code:${id}`)

    return { token }
  }
}