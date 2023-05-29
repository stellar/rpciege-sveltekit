import { dev } from '$app/environment'

let context

const exposeCFGlobals = (globalObjects, ctx) => {
  Object
  .entries(globalObjects)
  .forEach(([key, val]) => {
    global[key] = val
  })

  context = ctx
}

const fn = (ctx) => {
  exposeCFGlobals({crypto, caches}, ctx)
  return
}

export const fallBackPlatformToMiniFlareInDev = async (_platform) => {
  if (!dev)
    return _platform

  if (_platform)
    return _platform

  const esbuild = await import('esbuild')
  const { code } = esbuild.transformSync(`
    const fn = ${fn.toString()};
    export default {
      fetch: async (request, env2, ctx2) => {
        fn(ctx2);
        return new Response('Hello Miniflare!');
      }
    };
    `, {
      loader: 'ts',
      sourcemap: 'inline'
    }
  )

  const { Miniflare } = await import('miniflare')
  const mf = new Miniflare({
    modules: true,
    envPath: true,
    packagePath: true,
    wranglerConfigPath: true,

    kvPersist: true,
    cachePersist: true,
    durableObjectsPersist: true,

    globalAsyncIO: true,
    globalTimers: true,
    globalRandom: true,
    
    script: code,
    globals: { exposeCFGlobals }, 
  })

  await mf.dispatchFetch('https://host.tld')

  const env = await mf.getBindings()
  const platform = { env, context }

  return platform
}