/**
 * vitest.config.ts
 * ----------------
 *
 * One Vitest project per component, so each keeps the exact setup its
 * old package ran with: the Svelte Vite plugin compiles the `.svelte`
 * components under test, `jsdom` provides the DOM, and each core is
 * mocked at the module boundary by its own suites (the sounds suites
 * `integration.test.ts` / `hydration.test.ts` run the REAL core, and
 * `ssr.test.ts` server-renders in the node environment).
 *
 * The player / bar / playlist configs passed `svelte({ hot: false })`;
 * the plugin had already dropped `hot` for Svelte 5 (deleted with a
 * warning in 5.x, gone in 7.x), so plain `svelte()` is the same setup.
 */
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const component = (name: string) => ({
	extends: true as const,
	test: {
		name,
		include: [`test/${name}/**/*.test.ts`],
		setupFiles: [`./test/${name}/setup.ts`],
	},
});

export default defineConfig({
	plugins: [svelte()],
	test: {
		environment: 'jsdom',
		globals: false,
		projects: [component('player'), component('bar'), component('playlist'), component('sounds')],
	},
	resolve: {
		conditions: ['browser'],
	},
	// The cores are `file:../waveform-*` devDependencies until 2.0 is on npm:
	// npm symlinks them, Vite follows the link to the sibling checkout, and
	// that lies outside this root, which Vite refuses to load from unless
	// allowed. Only the four sibling cores are.
	server: {
		fs: {
			allow: ['.', ...['player', 'bar', 'playlist', 'sounds'].map((c) => `../waveform-${c}`)],
		},
	},
});
