# Changelog

## 2.2.0 — 2026-11-22

For `@arraypress/waveform-sounds` 2.2.0 (the other cores are unchanged).

### Added — sounds (`./sounds`)
- **`mergeEnharmonicKeys`** prop (default `true`, the core's): A#m and Bbm,
  C# and Db are one key-menu entry. It is forwarded to the runtime and
  shapes the server markup through the core's `pickRenderOptions()`, so
  `mergeEnharmonicKeys={false}` renders the spellings apart on the server
  and keeps them apart after hydration.

### Changed
- **The server-rendered markup is sounds 2.2's**: only the rows the list
  starts with are rendered, each carrying just `data-ws-index`; every
  sound rides once in an inert `<script type="application/json"
  data-ws-sounds>` inside the host's `{@html}`, which hydrates without a
  mismatch. Icons are one sprite per list. Read a row's sound from the
  instance (`instance.sounds[row.dataset.wsIndex]`), not from row
  attributes.
- **Peer**: `@arraypress/waveform-sounds` is `^2.2.0` (the markup this
  component renders must be the markup the runtime adopts). `-player`,
  `-bar` and `-playlist` are unchanged. All four remain optional.

## 2.1.0 — 2026-11-21

For the 2.1 cores (`@arraypress/waveform-player`, `-playlist` and `-sounds`
2.1.0; `-bar` stays 2.0).

### Fixed — sounds (`./sounds`)
- **`loop={false}` rendered the Loop toggle pressed on the server**, then
  flipped it on hydration: the server `renderSounds` call didn't pass
  `loop`. The render options now come from the core's
  `pickRenderOptions()` (`@arraypress/waveform-sounds/render`) over the
  forwarded options instead of a hand-kept list, so a render option the
  core adds reaches the server markup without an edit here.

### Changed
- **sounds**: a rebuild over unchanged markup hands the next instance clean
  rows with the core's `destroy({ restore: true })` instead of rewriting the
  host's `innerHTML`. Switching from `manifest` to `sounds` now has the
  runtime build the list from `sounds` (the same `renderSounds` output)
  rather than adopt Svelte's render.
- **playlist**: imports `@arraypress/waveform-playlist/no-autoinit`. The
  2.1 root scans the page for `[data-waveform-playlist]` and registers
  `<waveform-playlist>` on import, which a component that builds its own
  playlist must not trigger.
- **Peers**: `@arraypress/waveform-playlist` and `@arraypress/waveform-sounds`
  are `^2.1.0` (the APIs above are 2.1). `-player` and `-bar` stay
  `^2.0.0`. All four remain optional.
- `bind:instance` / `getInstance()`'s `engine` is now typed as the core's
  `WaveformPlayer | null` (was `unknown`), from the sounds core's types.

## 2.0.0 — 2026-11-21

The four Svelte wrappers are now one package, `@arraypress/waveform-svelte`,
with one sub-path per component, built for the 2.0 cores.

### One package, four sub-paths

Each sub-path exports what its old package did — the same components, props,
callbacks and instance methods. Only the import changes:

| Old package (last version) | New import |
| --- | --- |
| `@arraypress/waveform-player-svelte` (0.7.0) | `@arraypress/waveform-svelte/player` |
| `@arraypress/waveform-bar-svelte` (0.4.0) | `@arraypress/waveform-svelte/bar` |
| `@arraypress/waveform-playlist-svelte` (0.5.0) | `@arraypress/waveform-svelte/playlist` |
| `@arraypress/waveform-sounds-svelte` (0.2.1) | `@arraypress/waveform-svelte/sounds` |

There is no root import. The four cores are optional peer dependencies:
install the ones for the sub-paths you import (`./player` needs only
`@arraypress/waveform-player`; the others also need their own core).

### Requirements

- **The 2.0 cores**: `@arraypress/waveform-player`, `-bar`, `-playlist` and
  `-sounds` `^2.0.0` (TypeScript with generated types, ES2022: Chrome/Edge
  111+, Firefox 114+, Safari 16.4+).
- **Svelte 5.59+ only** (peer `^5.59.0`, was `^5.20.0`). Only the latest
  Svelte is supported.
- **Node 22.12+** (`engines`), like the cores.
- ES modules only, as before (built with `@sveltejs/package`; there never
  was a CommonJS build).

### Player (`./player`)

- **New props for the 2.0 core options**, each forwarded only when set:
  `duration` (seconds; the total time before the audio loads, so a
  `preload="none"` player shows its length with no audio request), `lazy`,
  `loop`, `showLoop`, `loopLabel`, `showVolume`, `volume`, `volumeLabel`,
  `muteLabel`, `showDownload`, `downloadUrl`, `downloadName` and
  `downloadLabel`. `duration`, `downloadUrl` and `downloadName` describe the
  track at `url`: a `url` change remounts the player with the new values
  (and without the old ones).
- **`waveform` accepts compact `wp1:` peaks** (`"wp1:"` + base64url, one byte
  per peak, as `@arraypress/waveform-gen` writes them) besides an array, a
  `.json` URL or a JSON string.
- **New event props** `onseek`, `onratechange`, `onvolumechange` and
  `onloop`, for the 2.0 core's `waveformplayer:seek` / `:ratechange` /
  `:volumechange` / `:loop` events. Each receives the event's detail
  (`WaveformSeekEventDetail`, `WaveformRateChangeEventDetail`,
  `WaveformVolumeChangeEventDetail`, `WaveformLoopEventDetail`, re-exported
  from `./player`). Self mode only, as in the core. Changing a handler never
  remounts the player.
- **Callback prop types replace the host `<div>`'s same-named DOM handler
  types** (`onplay`, `onload`, `onerror`, `onratechange`, …) instead of
  intersecting with them, so a handler's parameter is the player or the
  event detail.

### Playlist (`./playlist`)

- **Tracks**: `duration` takes seconds (`225`) or a clock string (`'3:45'`,
  `'1:02:03'`) — rendered as `data-duration`, which the 2.0 playlist shows and
  passes to the player as its `duration`. New `downloadUrl` / `downloadName`
  (rendered as `data-download-url` / `data-download-name`) set that track's
  download link. `waveform` accepts `wp1:` peaks.
- **New props forwarded to the player**: `showVolume`, `volume`,
  `showDownload`, `volumeLabel`, `muteLabel`, `downloadLabel`.
- **Not props**: `loop`, `showLoop`, `loopLabel` and `lazy` (the playlist
  never passes them to its player: a looping track never ends, which stops
  `continuous`), and the per-track `duration`, `downloadUrl`, `downloadName`
  (set them on each track). Like `audioMode`, a stray one is swallowed —
  never forwarded, never on the host element.

### Bar (`./bar`)

- A trigger's `duration` is documented as seconds or a clock string, which the
  2.0 bar passes to its player; `waveform` may be `wp1:` peaks. The config
  type's keys are unchanged.
- The component calls `init()` / `destroy()` on the singleton the bar module
  exports, instead of looking it up on `window.WaveformBar`.

### Sounds (`./sounds`)

- No API change. Built against `@arraypress/waveform-sounds` 2.0, whose
  server-rendered markup is byte-identical to 0.3.

### Removed

- Compatibility code for 1.x cores: the optional-method instance types and
  their `?.()` checks, the `default ?? named` constructor lookups, the bar's
  `window.WaveformBar` lookup, the playlist's fallback types for playlist
  cores before 1.8.0, and the ambient `@arraypress/waveform-bar` module shim
  (bar 2.0 ships its own types).
