import { fetcher } from 'itty-fetcher'
import { dev } from '$app/environment'

const api = fetcher({ base: 'https://api.sendgrid.com/v3' })

export function validateAddress(email: string, env: App.Platform["env"] | undefined) {
  return api.post(
    '/validations/email', 
    { email },
    { headers: { Authorization: `Bearer ${env?.SG_VALIDATION}` }}
  ).catch((err) => {
    // https://github.com/kwhitley/itty-fetcher/issues/32
    if (err.message.includes(`(reading 'includes')`))
      return
    else
      throw err
  })
}

export async function sendCode(email: string, id: string, referral: string | undefined, env: App.Platform["env"] | undefined) {
  const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')

  await env?.EMAILS.put(`code:${id}`, code, { metadata: { referral }, expirationTtl: 300 })

  if (!dev)
    return api.post(
      '/mail/send', 
      {
        personalizations: [{ to: [{ email }] }],
        subject: 'Your RPCiege enlistment code',
        content: [{
          type: 'text/plain',
          value: `Your RPCiege enlistment code is ${code}`
        }],
        from: { email: 'noreply@rpciege.com' }
      },
      { headers: { Authorization: `Bearer ${env?.SG_SECRET}` }}
    ).catch((err) => {
      // https://github.com/kwhitley/itty-fetcher/issues/32
      if (err.message.includes(`(reading 'includes')`))
        return
      else
        throw err
    })
}