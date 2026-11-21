/**
 * @module types
 * @description
 * Public TypeScript types for `@arraypress/waveform-svelte/playlist`.
 *
 * The shared option surface is owned by two core libraries and
 * re-exported / derived here rather than re-declared:
 *
 *   - `@arraypress/waveform-playlist` owns the playlist-level options
 *     ({@link WaveformPlaylistOptions}) and the parsed track / chapter /
 *     marker shapes ({@link WaveformPlaylistTrack},
 *     {@link WaveformPlaylistChapter}, {@link WaveformPlaylistMarker}).
 *   - `@arraypress/waveform-player` owns the per-player visualisation
 *     options ({@link WaveformPlayerOptions}) the playlist forwards to the
 *     embedded player (e.g. `height`, `waveformStyle`, `colorPreset`).
 *
 * Both cores generate their declarations from their TypeScript source, so
 * this wrapper can never drift out of sync with them.
 *
 * This module only adds the Svelte-specific surface:
 *
 *   - A declarative `tracks` array ({@link WaveformPlaylistTrackInput}) the
 *     component renders into the `[data-track]` markup the playlist
 *     constructor parses.
 *   - `WaveformPlaylistProps` — the option surface accepted as props.
 *   - `WaveformPlaylistCallbacks` — lowercase lifecycle callback props
 *     (`onload`, `onplay`, …) forwarded to the embedded player.
 *   - `WaveformPlaylistExpose` — the imperative navigation API exported by
 *     the component instance, reachable through `bind:this`.
 *
 * @see {@link https://github.com/WaveformPlayer/waveform-playlist} — core library
 */
import type {
	WaveformPlaylist,
	WaveformPlaylistOptions,
	WaveformPlaylistTrack,
	WaveformPlaylistMarker,
} from '@arraypress/waveform-playlist';
import type {
	WaveformPlayer,
	WaveformPlayerOptions,
} from '@arraypress/waveform-player';

/**
 * Playlist option / parsed-shape types re-exported from
 * `@arraypress/waveform-playlist` so consumers importing them from this
 * package keep working. These are the single-source-of-truth definitions
 * shipped by the core — not local copies.
 */
export type {
	WaveformPlaylistOptions,
	WaveformPlaylistTrack,
	WaveformPlaylistChapter,
	WaveformPlaylistMarker,
} from '@arraypress/waveform-playlist';

/**
 * Shared player option types re-exported from
 * `@arraypress/waveform-player` (these flow through to the embedded
 * player the playlist drives).
 */
export type {
	WaveformStyle,
	ColorPreset,
	AudioMode,
	AudioPreload,
	ButtonAlign,
	WaveformMarker,
	WaveformPeaks,
} from '@arraypress/waveform-player';

/**
 * A chapter on a {@link WaveformPlaylistTrackInput}. Rendered as a
 * `[data-chapter]` child of its track's `[data-track]` element.
 */
export interface WaveformPlaylistChapterInput {
	/**
	 * Chapter start time. A number of seconds (e.g. `90`) or a timestamp
	 * string (e.g. `'1:30'`). Both are stringified into `data-time`, which
	 * the playlist parses (`"M:SS"` / `"MM:SS"`, or a bare seconds count).
	 */
	time: number | string;
	/** Chapter label text. Rendered as the element's text content. */
	label: string;
	/** Optional marker colour for this chapter (`data-color`). */
	color?: string;
}

/**
 * A track supplied to `<WaveformPlaylist>` via the `tracks` prop.
 *
 * This is the *input* shape — distinct from the core's parsed
 * {@link WaveformPlaylistTrack} (which also carries the source
 * `element` and resolved `index`). The component renders each track into
 * the `[data-track]` markup the playlist constructor reads on mount.
 */
export interface WaveformPlaylistTrackInput {
	/** Audio file URL (required). Rendered as `data-url`. */
	url: string;
	/** Track title (`data-title`). Falls back to the filename if omitted. */
	title?: string;
	/** Artist or description shown below the title (`data-artist`). */
	artist?: string;
	/** Album artwork URL (`data-artwork`). */
	artwork?: string;
	/** Album name, forwarded to the Media Session API (`data-album`). */
	album?: string;
	/**
	 * The track's length (`data-duration`): a number of seconds (`225`) or a
	 * clock string (`'3:45'`, `'1:02:03'`). Shown in the list (seconds are
	 * formatted, so `225` displays as `3:45`), and passed to the player as its
	 * `duration` option, so the total time, markers and seeks have a length
	 * before the audio's metadata loads — with `preload: 'none'`, not until
	 * playback starts.
	 */
	duration?: number | string;
	/**
	 * Where this track's download link points (`data-download-url`), e.g. a
	 * full-quality file when `url` streams a preview. Defaults to the track's
	 * `url`. The link shows with `showDownload`.
	 */
	downloadUrl?: string;
	/** File name suggested for this track's download (`data-download-name`). Defaults to the url's file name. */
	downloadName?: string;
	/**
	 * Explicit waveform markers (separate from chapters). JSON-encoded into
	 * `data-markers`, which the playlist parses for this track.
	 */
	markers?: WaveformPlaylistMarker[];
	/**
	 * Pre-computed peaks, so the player skips decoding this track's audio.
	 * An array is JSON-encoded into `data-waveform`; a string — a `.json`
	 * peaks URL, or compact `wp1:` peaks (base64url, one byte per peak, as
	 * `@arraypress/waveform-gen` writes them) — is passed through for the
	 * player to resolve.
	 */
	waveform?: number[] | string;
	/** Chapters rendered as `[data-chapter]` children of this track. */
	chapters?: WaveformPlaylistChapterInput[];
}

/**
 * The playlist's layout options — `layout` and the hero / grid / density
 * options that ship with it, typed from the playlist core. `layout`
 * overrides the player's own `layout`.
 */
export interface WaveformPlaylistLayoutProps {
	/**
	 * Playlist layout. `'list'` shows the full track list; `'minimal'` a
	 * compact button switcher; `'hero'` a now-playing unit (cover +
	 * waveform) over a track queue; `'grid'` a cover-art grid with a
	 * now-playing bar.
	 * @default 'list'
	 */
	layout?: WaveformPlaylistOptions['layout'];
	/**
	 * Show the now-playing / per-row artist. Turn off for single-artist
	 * albums where it would only repeat.
	 * @default true
	 */
	showArtist?: WaveformPlaylistOptions['showArtist'];
	/**
	 * Hero cover size in px. Defaults to the waveform height plus the time
	 * row, so the cover sits flush with the waveform column.
	 */
	coverSize?: WaveformPlaylistOptions['coverSize'];
	/** Hero queue thumbnail / grid cover size in px. Defaults to the CSS value. */
	thumbnailSize?: WaveformPlaylistOptions['thumbnailSize'];
	/** Row density for every layout. @default 'comfortable' */
	density?: WaveformPlaylistOptions['density'];
	/** Hero / grid cover position relative to the waveform. @default 'left' */
	coverPosition?: WaveformPlaylistOptions['coverPosition'];
	/** Grid layout: now-playing bar above or below the covers. @default 'bottom' */
	barPosition?: WaveformPlaylistOptions['barPosition'];
}

/**
 * The option surface accepted by `<WaveformPlaylist>` as props.
 *
 * Combines two inherited groups so anything the cores add in future is
 * exposed here without a manual edit:
 *
 *   1. **Playlist options** — `continuous`, `expandChapters`,
 *      `showDuration`, `showChapterMarkers`, `chapterMarkerColor`,
 *      `showPlayState`, plus the layout options
 *      ({@link WaveformPlaylistLayoutProps}: `layout` — `'list' |
 *      'minimal' | 'hero' | 'grid'`, overriding the player's own `layout` —
 *      `showArtist`, `coverSize`, `thumbnailSize`, `density`,
 *      `coverPosition`, `barPosition`).
 *   2. **Pass-through player options** — every visualisation / colour /
 *      behaviour option from the core `WaveformPlayerOptions`, minus the
 *      per-track fields (`url`, `title`, `artist`, `artwork`, `album`,
 *      `markers`, `waveform`, `duration`, `downloadUrl`, `downloadName`)
 *      which come from `tracks`, the `style`/`src` aliases, the player's
 *      `layout` (overridden above), the options the playlist never passes
 *      to its player — `audioMode` (it always owns its audio), `loop` and
 *      `showLoop` (a looping track never ends, which stops `continuous`),
 *      `lazy` (the playlist loads its own player) — `loopLabel` (its
 *      button never shows) and the lifecycle
 *      callbacks (covered by {@link WaveformPlaylistCallbacks}).
 *
 * The Svelte component also accepts `class`, `id`, `style`, and any other
 * element attribute via `HTMLAttributes<HTMLDivElement>` fall-through —
 * those are declared on the component, not here.
 */
export interface WaveformPlaylistProps
	extends WaveformPlaylistLayoutProps,
		Pick<
			WaveformPlaylistOptions,
			| 'continuous'
			| 'expandChapters'
			| 'showDuration'
			| 'showChapterMarkers'
			| 'chapterMarkerColor'
			| 'showPlayState'
		>,
		Omit<
			WaveformPlayerOptions,
			| 'url'
			| 'src'
			| 'style'
			| 'layout'
			| 'title'
			| 'artist'
			| 'artwork'
			| 'album'
			| 'markers'
			| 'waveform'
			| 'duration'
			| 'downloadUrl'
			| 'downloadName'
			| 'audioMode'
			| 'loop'
			| 'showLoop'
			| 'loopLabel'
			| 'lazy'
			| 'onLoad'
			| 'onPlay'
			| 'onPause'
			| 'onEnd'
			| 'onError'
			| 'onTimeUpdate'
			| 'onNextTrack'
			| 'onPreviousTrack'
		> {
	/**
	 * The playlist's tracks. Each is rendered into the `[data-track]`
	 * markup the playlist constructor parses on mount. At least one track
	 * is expected; an empty array renders an empty playlist (the core
	 * skips init when there are no tracks).
	 */
	tracks: WaveformPlaylistTrackInput[];
}

/**
 * Lifecycle callback props, forwarded to the embedded `WaveformPlayer`
 * the playlist drives. Each maps to the core player's same-named option
 * callback, which the playlist runs after its own handling. Lowercase to
 * match Svelte's native event-attribute convention (`onclick`, `oninput`,
 * …).
 *
 * ```svelte
 * <WaveformPlaylist {tracks} onplay={(i) => …} ontimeupdate={(t, d) => …} />
 * ```
 *
 * Callback props **don't trigger re-mounts** — they reach the live
 * instance through reactive closures, so changing a handler never tears
 * the playlist down.
 */
export interface WaveformPlaylistCallbacks {
	/** Fired once after the active track's `onLoad`. */
	onload?: (instance: WaveformPlayer) => void;
	/** Fired when playback starts. */
	onplay?: (instance: WaveformPlayer) => void;
	/** Fired when playback pauses. */
	onpause?: (instance: WaveformPlayer) => void;
	/** Fired when the active track ends. */
	onend?: (instance: WaveformPlayer) => void;
	/** Fired on each progress frame. */
	ontimeupdate?: (currentTime: number, duration: number, instance: WaveformPlayer) => void;
	/** Fired on audio load / playback error. */
	onerror?: (error: Error, instance: WaveformPlayer) => void;
	/** Fired when the Media Session "next track" control is used (the playlist then advances). */
	onnexttrack?: (instance: WaveformPlayer) => void;
	/** Fired when the Media Session "previous track" control is used (the playlist then goes back). */
	onprevioustrack?: (instance: WaveformPlayer) => void;
}

/**
 * Imperative navigation API exported by the component instance. Reach it
 * with `bind:this`:
 *
 * ```svelte
 * <script lang="ts">
 *   import { WaveformPlaylist } from '@arraypress/waveform-svelte/playlist';
 *   let playlist: WaveformPlaylist;
 * </script>
 *
 * <WaveformPlaylist bind:this={playlist} {tracks} />
 * <button onclick={() => playlist.nextTrack()}>Next</button>
 * ```
 *
 * Each method is a thin pass-through to the underlying
 * `WaveformPlaylist` instance; calls before the async instance mounts
 * are safe no-ops (getters fall back to sensible defaults).
 */
export interface WaveformPlaylistExpose {
	/** Select and load a track by index. */
	selectTrack(index: number): void;
	/**
	 * Seek to a chapter within a track. If the chapter lives on a different
	 * track, that track is loaded first and the seek runs once it is ready.
	 */
	seekToChapter(trackIndex: number, time: number): void;
	/** Navigate to the next track (if any). */
	nextTrack(): void;
	/** Navigate to the previous track (if any). */
	previousTrack(): void;
	/**
	 * The embedded `WaveformPlayer` instance, or `null` before init. Exposes
	 * the full player API (`play`, `pause`, `seekTo`, …) for the rare cases
	 * the playlist API doesn't surface.
	 */
	getPlayer(): unknown | null;
	/** The index of the currently selected track. */
	getCurrentTrackIndex(): number;
	/** All parsed tracks (the core's resolved shape, with `element`/`index`). */
	getTracks(): WaveformPlaylistTrack[];
	/**
	 * Underlying `WaveformPlaylist` instance, or `null` before it mounts.
	 * Escape hatch for anything the methods above don't cover.
	 */
	getInstance(): WaveformPlaylist | null;
}
