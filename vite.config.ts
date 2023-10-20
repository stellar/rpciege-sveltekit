import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import inject from '@rollup/plugin-inject'
import path from 'path'

export default defineConfig({
	resolve: {
		alias: {
			'@': path.resolve('src')
		}
	},
	plugins: [
		sveltekit(),
	],
	optimizeDeps: {
		esbuildOptions: {
			define: {
				global: 'globalThis'
			},
			plugins: [
				NodeGlobalsPolyfillPlugin({
					process: true,
					buffer: true
				})
			]
		}
	},
	build: {
		minify: 'esbuild',
		sourcemap: true,
		rollupOptions: {
			plugins: [
				inject({
					window: path.resolve('src/lib/window.ts'),
				}),
			]
		}
	}
})