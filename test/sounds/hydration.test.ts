/// <reference types="node" />
/**
 * hydration.test.ts
 * -----------------
 *
 * The server-render → hydrate → adopt path end to end, against the real
 * runtime: the server's markup is hydrated (not re-created) and the
 * runtime adopts those very nodes rather than rendering its own.
 *
 * Vitest compiles `.svelte` for one target per environment, so the server
 * build of the component is produced here with `svelte/compiler` (Svelte 5
 * strips the `lang="ts"` annotations itself) and written next to the source
 * under `test/` (gitignored), where its package imports resolve the same way.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { compile } from 'svelte/compiler';
import { render as renderServer } from 'svelte/server';
import { hydrate, unmount, type Component } from 'svelte';
import Core from '@arraypress/waveform-sounds/no-autoinit';
import WaveformSounds from '../../src/lib/sounds/WaveformSounds.svelte';

const source = resolve(process.cwd(), 'src/lib/sounds/WaveformSounds.svelte');
const serverBuild = resolve(process.cwd(), 'test/sounds/.WaveformSounds.server.js');

let ServerComponent: Component<Record<string, unknown>>;

beforeAll(async () => {
	const { js } = compile(readFileSync(source, 'utf8'), { generate: 'server', filename: source });
	writeFileSync(serverBuild, js.code);
	ServerComponent = (await import(/* @vite-ignore */ serverBuild)).default;
});

afterAll(() => rmSync(serverBuild, { force: true }));

const sounds = [
	{ url: '/kick.mp3', title: 'Kick', type: 'One-shots', download: '/free/kick.wav' },
	{ url: '/loop.mp3', title: 'Loop', type: 'Drum loops', bpm: 128 },
];

describe('hydration', () => {
	it('hydrates the server markup and the runtime adopts it', async () => {
		const props = { sounds, player: 'inline' as const, class: 'pack' };
		const { body } = renderServer(ServerComponent, { props });
		const target = document.createElement('main');
		target.innerHTML = body;
		document.body.appendChild(target);
		const serverList = target.querySelector('[data-ws-list]');
		const serverRow = target.querySelector('[data-ws-index="1"]');
		const serverData = target.querySelector('script[type="application/json"][data-ws-sounds]');
		expect(serverList).not.toBeNull();
		expect(serverData).not.toBeNull();

		const warn = vi.spyOn(console, 'warn');
		const onready = vi.fn();
		const app = hydrate(WaveformSounds, { target, props: { ...props, onready } });
		await vi.waitFor(() => expect(onready).toHaveBeenCalledTimes(1));

		const el = target.querySelector('div.wfs-host') as HTMLDivElement;
		// The very nodes the server sent: neither Svelte nor the runtime re-created them.
		expect(el.querySelector('[data-ws-list]')).toBe(serverList);
		expect(el.querySelector('[data-ws-index="1"]')).toBe(serverRow);
		// The inert JSON script inside `{@html}` is hydrated as-is too (no
		// mismatch: the warning check below covers it).
		expect(el.querySelector('script[data-ws-sounds]')).toBe(serverData);
		expect(Core.getInstance(el)!.sounds.map((s) => s.url)).toEqual(['/kick.mp3', '/loop.mp3']);
		// Read back from the server's `[data-ws-sounds]` JSON.
		expect(Core.getInstance(el)!.sounds[0].download).toBe('/free/kick.wav');
		expect(el.querySelector('a.ws-download')!.getAttribute('href')).toBe('/free/kick.wav');
		expect(el.classList.contains('pack')).toBe(true);
		// The client computed the same markup — incl. the `$props.id()`
		// dropdown ids — or Svelte warns `hydration_html_changed` (dev).
		expect(el.querySelector('[data-ws-menu="sort"] [role=listbox]')!.id).toMatch(/-sort-list$/);
		expect(warn.mock.calls.flat().join(' ')).not.toMatch(/hydration/i);
		warn.mockRestore();

		unmount(app);
		expect(Core.getInstance(el)).toBeNull();
		target.remove();
	});

	/** Server-render `props`, hydrate with `client`, and return the host + any hydration warning. */
	async function hydrateWith(props: Record<string, unknown>, client: Record<string, unknown> = props) {
		const { body } = renderServer(ServerComponent, { props });
		const target = document.createElement('main');
		target.innerHTML = body;
		document.body.appendChild(target);
		const serverList = target.querySelector('[data-ws-list]');
		const warn = vi.spyOn(console, 'warn');
		const onready = vi.fn();
		const app = hydrate(WaveformSounds, { target, props: { ...client, onready } });
		await vi.waitFor(() => expect(onready).toHaveBeenCalledTimes(1));
		await Core.getInstance(target.querySelector('div.wfs-host') as HTMLElement)!.ready;
		const warnings = warn.mock.calls.flat().join(' ');
		warn.mockRestore();
		const el = target.querySelector('div.wfs-host') as HTMLDivElement;
		const keys = () =>
			Array.from(el.querySelectorAll<HTMLElement>('[data-ws-menu="key"] [role=option]'))
				.map((o) => o.dataset.value)
				.filter(Boolean);
		const done = () => {
			unmount(app);
			target.remove();
		};
		return { el, serverList, warnings, keys, done };
	}

	const keyed = [
		{ url: '/a.mp3', title: 'A', key: 'A#m' },
		{ url: '/b.mp3', title: 'B', key: 'Bbm' },
		{ url: '/c.mp3', title: 'C', key: 'C' },
	];

	it('mergeEnharmonicKeys={false} renders unmerged on the server and stays unmerged after hydration', async () => {
		const { el, serverList, warnings, keys, done } = await hydrateWith({ sounds: keyed, mergeEnharmonicKeys: false });
		expect(warnings).not.toMatch(/hydration/i);
		expect(el.querySelector('[data-ws-list]')).toBe(serverList);
		expect(keys()).toEqual(['C', 'A#m', 'Bbm']);
		const inst = Core.getInstance(el)!;
		expect(inst.options.mergeEnharmonicKeys).toBe(false);
		// The runtime keeps the spellings apart too: a filter on one finds only it.
		inst.setFilter({ key: 'A#m' });
		const shown = Array.from(el.querySelectorAll('[data-ws-list] > [data-ws-index]')).map(
			(r) => r.querySelector('.ws-title-text')!.textContent,
		);
		expect(shown).toEqual(['A']);
		expect(keys()).toEqual(['C', 'A#m', 'Bbm']);
		done();
	});

	it('by default the key menu merges the spellings, server and client alike', async () => {
		const { el, warnings, keys, done } = await hydrateWith({ sounds: keyed });
		expect(warnings).not.toMatch(/hydration/i);
		expect(keys()).toEqual(['C', 'Bbm']);
		Core.getInstance(el)!.setFilter({ key: 'Bbm' });
		const shown = Array.from(el.querySelectorAll('[data-ws-list] > [data-ws-index]')).map(
			(r) => r.querySelector('.ws-title-text')!.textContent,
		);
		expect(shown.sort()).toEqual(['A', 'B']);
		done();
	});

	it('the hydration check is live: server and client markup that differ do warn', async () => {
		// Proves the "no hydration warning" assertions above can fail.
		const { warnings, done } = await hydrateWith({ sounds: keyed, mergeEnharmonicKeys: false }, { sounds: keyed });
		expect(warnings).toMatch(/hydration_html_changed/);
		done();
	});
});
