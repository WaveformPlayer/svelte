/**
 * test/config-types.test.ts
 * -------------------------
 *
 * Type-level tests for `WaveformBarConfig`. This wrapper hand-writes the
 * type (bar 2.0 generates its own, but the four bar wrappers keep theirs
 * in step with each other), so it is the contract users see — and
 * `config` goes to `window.WaveformBar.init()` verbatim, so a key that's
 * wrong here is wrong for every user even though it works at runtime.
 *
 * `expectTypeOf` is a no-op under `vitest run`; these assertions are
 * enforced by the typecheck (`test/` is in tsconfig `include`).
 *
 * Kept identical across the four bar wrappers (astro / react / svelte /
 * vue) apart from the import path.
 */
import { describe, expectTypeOf, it } from 'vitest';
import type { WaveformBarConfig as CoreBarConfig } from '@arraypress/waveform-bar';
import type { WaveformBarConfig, WaveformBarTrackData } from '../../src/lib/bar/types';

describe('WaveformBarConfig — types match what the bar forwards to the player', () => {
	it('accepts waveformGradient with the core player\'s axis union', () => {
		// waveform-player WaveformPlayerOptions: 'vertical' | 'horizontal' | 'diagonal'.
		expectTypeOf<WaveformBarConfig['waveformGradient']>().toEqualTypeOf<
			'vertical' | 'horizontal' | 'diagonal' | undefined
		>();
	});

	it('accepts gradient stop arrays for waveformColor / progressColor', () => {
		// The bar forwards these verbatim; the player takes string | string[] | null.
		expectTypeOf<WaveformBarConfig['waveformColor']>().toEqualTypeOf<
			string | string[] | null | undefined
		>();
		expectTypeOf<WaveformBarConfig['progressColor']>().toEqualTypeOf<
			string | string[] | null | undefined
		>();
	});

	it('accepts barRadius as a number (0 = square) or null (player default)', () => {
		expectTypeOf<WaveformBarConfig['barRadius']>().toEqualTypeOf<number | null | undefined>();
	});

	it('still accepts showTime', () => {
		expectTypeOf<WaveformBarConfig['showTime']>().toEqualTypeOf<boolean | undefined>();
	});

	it('agrees with the bar core\'s own generated type on the shared keys', () => {
		expectTypeOf<WaveformBarConfig['waveformGradient']>().toEqualTypeOf<CoreBarConfig['waveformGradient']>();
		expectTypeOf<WaveformBarConfig['barRadius']>().toEqualTypeOf<CoreBarConfig['barRadius']>();
	});

	it('takes a track duration as seconds or a clock string, and string (wp1:) peaks', () => {
		expectTypeOf<WaveformBarTrackData['duration']>().toEqualTypeOf<string | number | undefined>();
		expectTypeOf<WaveformBarTrackData['waveform']>().toEqualTypeOf<number[] | string | undefined>();
	});
});
