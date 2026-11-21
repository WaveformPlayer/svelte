/**
 * @module @arraypress/waveform-svelte/playlist
 * @description
 * Public entry point for the Svelte 5 wrapper around
 * `@arraypress/waveform-playlist`.
 *
 * ```svelte
 * <script lang="ts">
 *   import { WaveformPlaylist } from '@arraypress/waveform-svelte/playlist';
 * </script>
 *
 * <WaveformPlaylist
 *   tracks={[
 *     { url: '/audio/a.mp3', title: 'Track A' },
 *     { url: '/audio/b.mp3', title: 'Track B' },
 *   ]}
 * />
 * ```
 *
 * ## Types
 *
 * ```ts
 * import type {
 *   WaveformPlaylistProps,
 *   WaveformPlaylistLayoutProps,
 *   WaveformPlaylistCallbacks,
 *   WaveformPlaylistExpose,
 *   WaveformPlaylistTrackInput,
 *   WaveformPlaylistChapterInput,
 *   WaveformPlaylistOptions,
 *   WaveformPlaylistTrack,
 *   WaveformPlaylistChapter,
 *   WaveformPlaylistMarker,
 *   WaveformStyle,
 *   ColorPreset,
 *   AudioMode,
 *   AudioPreload,
 *   ButtonAlign,
 * } from '@arraypress/waveform-svelte/playlist';
 * ```
 */
export { default as WaveformPlaylist } from './WaveformPlaylist.svelte';

export type {
	WaveformPlaylistProps,
	WaveformPlaylistLayoutProps,
	WaveformPlaylistCallbacks,
	WaveformPlaylistExpose,
	WaveformPlaylistTrackInput,
	WaveformPlaylistChapterInput,
	WaveformPlaylistOptions,
	WaveformPlaylistTrack,
	WaveformPlaylistChapter,
	WaveformPlaylistMarker,
	WaveformStyle,
	WaveformMarker,
	WaveformPeaks,
	ColorPreset,
	AudioMode,
	AudioPreload,
	ButtonAlign,
} from './types.js';
