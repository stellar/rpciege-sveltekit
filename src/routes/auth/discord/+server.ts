import { error, fail } from '@sveltejs/kit'
import { fetcher } from 'itty-fetcher'
import jwt from '@tsndr/cloudflare-worker-jwt'
import packs from '$lib/packs.json'
import { deriveNFTIssuer } from '$lib/utils'

const api = fetcher({ 
    base: 'https://discord.com/api/v10',
    handleResponse: async (res) => {
      if (res.ok)
        return res.json()
      throw await res.json()
    }
})

/** @type {import('./$types').RequestHandler} */
export async function GET({ request, platform }) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')

    // RPCIEGE0001C

    let formData = new FormData();
        formData.append('client_id', platform?.env?.DISCORD_CLIENT_ID);
        formData.append('client_secret', platform?.env?.DISCORD_CLIENT_SECRET);
        formData.append('grant_type', 'authorization_code');
        formData.append('code', code);
        formData.append('redirect_uri', `${url.origin}${url.pathname}`);

    const tokenRes: any = await api.post('/oauth2/token', formData)

    if (tokenRes?.access_token) {
      const discordRes: any = await api.get('/users/@me', undefined, {
        headers: {
          Authorization: `Bearer ${tokenRes?.access_token}`
        }
      })

      if (discordRes?.id !== state)
        throw error(401, { message: 'Invalid state' })

      const token = await jwt.sign({ 
        sub: discordRes?.id,
        code: packs[state],
        issuer: (await deriveNFTIssuer(packs[state], platform)).publicKey(),
        exp: Math.floor(Date.now() / 1000) + 300 // 5 minutes
      }, platform?.env?.JWT_SECRET)

      if (discordRes?.id) {
        return new Response(null, {
          status: 307,
          headers: {
            Location: `${url.origin}/community/${state}?token=${token}`
          }
        })
      }

      else 
        throw error(401, { message: 'Missing id' })
    }

    else 
      throw error(401, { message: 'Missing token' })
}