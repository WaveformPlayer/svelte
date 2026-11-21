/**
 * test/peer-ranges.test.ts
 * ------------------------
 *
 * The peer floors are load-bearing, not cosmetic.
 * `@arraypress/waveform-sounds@2.0.0` is the release whose option types
 * live in `types/types.d.ts` (the drift test reads them) and which passes
 * each sound's `duration` to its engine; it in turn needs
 * `@arraypress/waveform-player@2.0.0`. The server render takes the core's
 * `pickRenderOptions()` and a rebuild uses `destroy({ restore: true })`,
 * both new in 2.1.0. 2.2.0 changed the server-rendered markup (rows carry
 * only `data-ws-index`, the sounds ride in one JSON script) and added
 * `mergeEnharmonicKeys`: the markup this wrapper renders must be what the
 * runtime adopts, so 2.2.0 is the floor. The repo develops against
 * the published 2.0 packages: the devDependencies are `^2.x` ranges at least
 * the peer floor (a temporary `file:` link for cross-repo work fails here,
 * so it can't be published by accident).
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
	it('requires waveform-sounds >= 2.2.0 (the 2.2 markup, mergeEnharmonicKeys)', () => {
		expect(atLeast(pkg.peerDependencies['@arraypress/waveform-sounds'], '2.2.0')).toBe(true);
	});

	it("requires waveform-player >= 2.0.0 (the sounds core's own floor)", () => {
		expect(atLeast(pkg.peerDependencies['@arraypress/waveform-player'], '2.0.0')).toBe(true);
	});

	it('develops against the published 2.0 packages (a ^2.x devDependency at least the peer floor)', () => {
		for (const [name, min] of [
			['@arraypress/waveform-sounds', '2.2.0'],
			['@arraypress/waveform-player', '2.0.0'],
		] as const) {
			const range = pkg.devDependencies[name];
			expect(floor(range)[0], `${name}@${range} is not a ^2.x range`).toBe(2);
			expect(atLeast(range, min), `${name}@${range} < ${min}`).toBe(true);
		}
	});

	it('requires Svelte >= 5.59.0 (only the latest Svelte is supported)', () => {
		// 2.0 supports the current Svelte minor only, so it is tested against
		// what it claims. ($props.id(), the SSR-stable id prefix, needs 5.20.0;
		// the floor is well past it.)
		expect(atLeast(pkg.peerDependencies.svelte, '5.59.0')).toBe(true);
	});

	it('develops against the supported Svelte (devDependency >= the peer floor)', () => {
		expect(atLeast(pkg.devDependencies.svelte, '5.59.0')).toBe(true);
	});
});
