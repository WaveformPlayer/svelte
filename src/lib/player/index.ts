/**
 * @module @arraypress/waveform-svelte/player
 * @description
 * Public entry point for the Svelte 5 wrapper around
 * `@arraypress/waveform-player`.
 *
 * ```svelte
 * <script lang="ts">
 *   import { WaveformPlayer } from '@arraypress/waveform-svelte/player';
 * </script>
 *
 * <WaveformPlayer url="/audio/track.mp3" title="My Track" />
 * ```
 *
 * ## Types
 *
 * ```ts
 * import type {
 *   WaveformPlayerProps,
 *   WaveformPlayerCallbacks,
 *   WaveformPlayerExpose,
 *   WaveformStyle,
 *   WaveformMarker,
 *   WaveformPeaks,
 *   ColorPreset,
 *   AudioMode,
 *   AudioPreload,
 *   ButtonAlign,
 *   WaveformSeekEventDetail,
 *   WaveformRateChangeEventDetail,
 *   WaveformVolumeChangeEventDetail,
 *   WaveformLoopEventDetail,
 * } from '@arraypress/waveform-svelte/player';
 * ```
 */
export { default as WaveformPlayer } from './WaveformPlayer.svelte';

export type {
	WaveformPlayerProps,
	WaveformPlayerCallbacks,
	WaveformPlayerExpose,
	WaveformStyle,
	WaveformMarker,
	WaveformPeaks,
	ColorPreset,
	AudioMode,
	AudioPreload,
	ButtonAlign,
	WaveformSeekEventDetail,
	WaveformRateChangeEventDetail,
	WaveformVolumeChangeEventDetail,
	WaveformLoopEventDetail,
} from './types.js';
