import { dev } from '$app/environment'

export const handle = async ({ event, resolve }) => {
	if (dev) {
		const { fallBackPlatformToMiniFlareInDev } = await import('../miniflare')
		event.platform = await fallBackPlatformToMiniFlareInDev(event.platform)
	}
	
	return resolve(event)
};