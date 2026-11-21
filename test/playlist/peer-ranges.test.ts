/**
 * test/peer-ranges.test.ts
 * ------------------------
 *
 * The peer floors are load-bearing, not cosmetic. Below
 * `@arraypress/waveform-playlist@2.0.0` the playlist neither strips
 * `loop` / `showLoop` / `lazy` nor reads a track's `data-duration` as
 * seconds or its `data-download-url` / `data-download-name` — all of which
 * this wrapper relies on. (Below 1.8.0 it also ignored the constructor
 * options this wrapper passes and wiped the rendered tracks in `destroy()`.)
 * 2.0.0 in turn needs `@arraypress/waveform-player@2.0.0`.
 */
import { describe, it, expect } from 'vitest';
import pkg from '../../package.json';

/** The lowest version a `^x.y.z` range admits, as comparable numbers. */
const floor = (range: string): number[] => {
	const m = /^\^(\d+)\.(\d+)\.(\d+)$/.exec(range);
	if (!m) throw new Error(`expected a ^x.y.z range, got ${range}`);
	return m.slice(1).map(Number);
};
const atLeast = (range: string, min: string): boolean => {
	const [a, b] = [floor(range), floor(`^${min}`)];
	for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
	return true;
};

describe('peer dependency floors', () => {
	it('requires waveform-playlist >= 2.0.0 (per-track duration / download, loop and lazy stripped)', () => {
		expect(atLeast(pkg.peerDependencies['@arraypress/waveform-playlist'], '2.0.0')).toBe(true);
	});

	it('requires waveform-player >= 2.0.0 (the playlist core\'s own floor)', () => {
		expect(atLeast(pkg.peerDependencies['@arraypress/waveform-player'], '2.0.0')).toBe(true);
	});
});
