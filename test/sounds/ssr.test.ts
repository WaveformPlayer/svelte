// @vitest-environment node
/**
 * ssr.test.ts
 * -----------
 *
 * Server rendering, in the node environment (no `window`, no `document`).
 * The component must render without touching the browser runtime — only
 * the DOM-free `@arraypress/waveform-sounds/render` runs on the server —
 * and must emit the core's own markup, which the runtime adopts on the
 * client.
 */
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { renderSounds } from '@arraypress/waveform-sounds/render';
import WaveformSounds from '../../src/lib/sounds/WaveformSounds.svelte';

const sounds = [
	{ url: '/kick.mp3', title: 'Kick', type: 'One-shots' },
	{ url: '/loop.mp3', title: 'Loop <04>', type: 'Drum loops', bpm: 128 },
];

describe('server rendering', () => {
	it('runs with no DOM globals', () => {
		expect(typeof window).toBe('undefined');
		expect(typeof document).toBe('undefined');
	});

	it('renders the Loop toggle from the loop prop (a 2.0 bug drew it pressed for loop={false})', () => {
		// A list that marks loops starts with the toggle on, unless `loop` says otherwise.
		const loops = [
			{ url: '/a.mp3', title: 'A', loop: true },
			{ url: '/b.mp3', title: 'B' },
		];
		const pressed = (props: Record<string, unknown>) =>
			/<button[^>]*data-ws-loop[\s>][^>]*aria-pressed="(\w+)"/.exec(render(WaveformSounds, { props }).body)?.[1];
		expect(pressed({ sounds: loops })).toBe('true');
		expect(pressed({ sounds: loops, loop: false })).toBe('false');
		expect(pressed({ sounds, loop: true })).toBe('true');
	});

	it("emits the host with the core's markup inside", () => {
		const { body } = render(WaveformSounds, {
			props: { sounds, player: 'strip', pageSize: 1, class: 'pack', id: 'p1' },
		});
		expect(body).toMatch(/<div[^>]*class="waveform-sounds waveform-sounds--strip wfs-host pack"/);
		expect(body).toContain('id="p1"');
		expect(body).not.toContain('data-waveform-sounds');
		// The host `id` is the dropdowns' id prefix (no `idPrefix` prop).
		expect(body).toContain(renderSounds(sounds, { player: 'strip', pageSize: 1, idPrefix: 'p1' }));
		// Escaped by the core renderer, not double-escaped by Svelte.
		expect(body).toContain('Loop &lt;04&gt;');
	});

	it('renders an empty host for a manifest (fetched in the browser)', () => {
		const { body } = render(WaveformSounds, { props: { manifest: '/sounds.json' } });
		expect(body).toMatch(/<div[^>]*class="waveform-sounds waveform-sounds--inline wfs-host"[^>]*>(<!--[^>]*-->)*<\/div>/);
		expect(body).not.toContain('data-ws-list');
	});

	it('never emits callback props or `instance` as attributes', () => {
		const { body } = render(WaveformSounds, {
			props: { sounds, onplay: () => {}, onfilter: () => {}, instance: null },
		});
		expect(body).not.toMatch(/\son(play|filter)=/);
		expect(body).not.toContain('instance=');
	});
});
