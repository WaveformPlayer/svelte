/**
 * test/types.typecheck.ts
 * -----------------------
 *
 * Type-level assertions, checked by `npm run typecheck` (svelte-check), not
 * vitest.
 *
 * The playlist's layout options are typed straight from the installed
 * playlist core; these pin that they never silently degrade to the core's
 * `unknown` index signature (or narrow back to `'list' | 'minimal'`). The
 * track input takes the 2.0 per-track fields, and the options the playlist
 * strips (or takes per track) are not props.
 */
import type { WaveformPlaylistProps, WaveformPlaylistTrackInput } from '../../src/lib/playlist/types';

type Equal<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const assert = <T extends true>(): T => true as T;

assert<Equal<WaveformPlaylistProps['layout'], 'list' | 'minimal' | 'hero' | 'grid' | undefined>>();
assert<Equal<WaveformPlaylistProps['showArtist'], boolean | undefined>>();
assert<Equal<WaveformPlaylistProps['coverSize'], number | undefined>>();
assert<Equal<WaveformPlaylistProps['thumbnailSize'], number | undefined>>();
assert<Equal<WaveformPlaylistProps['density'], 'comfortable' | 'compact' | undefined>>();
assert<Equal<WaveformPlaylistProps['coverPosition'], 'left' | 'top' | undefined>>();
assert<Equal<WaveformPlaylistProps['barPosition'], 'top' | 'bottom' | undefined>>();

// 2.0 player options the playlist passes to its player.
assert<Equal<WaveformPlaylistProps['showVolume'], boolean | undefined>>();
assert<Equal<WaveformPlaylistProps['volume'], number | null | undefined>>();
assert<Equal<WaveformPlaylistProps['showDownload'], boolean | undefined>>();

// Stripped by the playlist, or per-track: not playlist props.
type NotProps =
	| 'audioMode'
	| 'loop'
	| 'showLoop'
	| 'loopLabel'
	| 'lazy'
	| 'duration'
	| 'downloadUrl'
	| 'downloadName';
assert<Equal<Extract<keyof WaveformPlaylistProps, NotProps>, never>>();

// Per-track input: seconds or a clock string; the download target; wp1: peaks are strings.
assert<Equal<WaveformPlaylistTrackInput['duration'], number | string | undefined>>();
assert<Equal<WaveformPlaylistTrackInput['downloadUrl'], string | undefined>>();
assert<Equal<WaveformPlaylistTrackInput['downloadName'], string | undefined>>();
assert<Equal<WaveformPlaylistTrackInput['waveform'], number[] | string | undefined>>();
