/**
 * test/types.typecheck.ts
 * -----------------------
 *
 * Type-level assertions on the COMPONENT's props, checked by
 * `npm run typecheck` (svelte-check), not vitest. The lowercase callback
 * props share names with the host `<div>`'s DOM handlers (`onplay`,
 * `onratechange`, `onvolumechange`, …); they must replace those types, not
 * intersect with them, or a handler's parameter isn't the player / detail.
 */
import type { ComponentProps } from 'svelte';
import type {
	WaveformPlayer as Core,
	WaveformRateChangeEventDetail,
	WaveformSeekEventDetail,
	WaveformVolumeChangeEventDetail,
	WaveformLoopEventDetail,
} from '@arraypress/waveform-player';
import type WaveformPlayer from '../../src/lib/player/WaveformPlayer.svelte';

type Equal<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const assert = <T extends true>(): T => true as T;

type Props = ComponentProps<typeof WaveformPlayer>;
type Arg<K extends keyof Props> = Parameters<NonNullable<Props[K]>>[0];

assert<Equal<Arg<'onplay'>, Core>>();
assert<Equal<Arg<'onload'>, Core>>();
assert<Equal<Arg<'onseek'>, WaveformSeekEventDetail>>();
assert<Equal<Arg<'onratechange'>, WaveformRateChangeEventDetail>>();
assert<Equal<Arg<'onvolumechange'>, WaveformVolumeChangeEventDetail>>();
assert<Equal<Arg<'onloop'>, WaveformLoopEventDetail>>();

// The 2.0 options are props.
assert<Equal<Props['duration'], number | null | undefined>>();
assert<Equal<Props['volume'], number | null | undefined>>();
assert<Equal<Props['downloadUrl'], string | null | undefined>>();
