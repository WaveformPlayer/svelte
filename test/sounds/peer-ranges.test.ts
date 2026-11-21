/**
 * test/peer-ranges.test.ts
 * ------------------------
 *
 * The peer floors are load-bearing, not cosmetic.
 * `@arraypress/waveform-sounds@2.0.0` is the release whose option types
 * live in `types/types.d.ts` (the drift test reads them) and which passes
 * each sound's `duration` to its engine; it in turn needs
 * `@arraypress/waveform-player@2.0.0`. (The `/render` + `/no-autoinit`
 * subpaths this wrapper imports date from 0.1.0.) Also guards the local-dev
 * devDependency: `file:../waveform-sounds` is fine in the repo but must
 * never reach `peerDependencies`.
 */
import { describe, it, expect } from 'vitest';
import pkg from '../../package.json';

/** The lowest version a `^x.y.z` range admits, as comparable numbers. */
/** The lowest version a range accepts: `^x.y.z`, or a `||` union of them. */
const floor = (range: string): number[] => {
	const parts = range.split('||').map((part) => {
		const m = /^\^(\d+)\.(\d+)\.(\d+)$/.exec(part.trim());
		if (!m) throw new Error(`expected ^x.y.z ranges, got ${range}`);
		return m.slice(1).map(Number);
	});
	return parts.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2])[0];
};
const atLeast = (range: string, min: string): boolean => {
	const [a, b] = [floor(range), floor(`^${min}`)];
	for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
	return true;
};

describe('peer dependency floors', () => {
	it('requires waveform-sounds >= 2.0.0 (generated types, per-sound duration)', () => {
		expect(atLeast(pkg.peerDependencies['@arraypress/waveform-sounds'], '2.0.0')).toBe(true);
	});

	it("requires waveform-player >= 2.0.0 (the sounds core's own floor)", () => {
		expect(atLeast(pkg.peerDependencies['@arraypress/waveform-player'], '2.0.0')).toBe(true);
	});

	it('requires Svelte >= 5.20.0 ($props.id(), the SSR-stable id prefix)', () => {
		// Verified against the published tarballs: 5.19.10 (the last 5.19)
		// has no `$props.id`; 5.20.0 introduces it.
		expect(atLeast(pkg.peerDependencies.svelte, '5.20.0')).toBe(true);
	});
});
