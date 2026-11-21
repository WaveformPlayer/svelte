# CLAUDE.md — @arraypress/waveform-svelte

Svelte 5 components for the WaveformPlayer family, one sub-path per core:
`./player`, `./bar`, `./playlist`, `./sounds` (merged in 2.0 from
`waveform-{player,bar,playlist,sounds}-svelte`). No root export, on purpose:
a combined entry would make bundlers resolve every core.

## Commands
- `npm test` — Vitest + jsdom, one project per component (`--project player`
  etc.). Run before committing.
- `npm run typecheck` — svelte-check (also checks `test/**/types.typecheck.ts`,
  which hold type-only assertions). Must be 0 errors.
- `npm run lint` — Biome (recommended preset, formatter off; see biome.jsonc).
- `npm run build` — svelte-package → `dist/` (gitignored). ESM only; there is
  no CommonJS to build.
- `npm run test:pack` — packs this package (and any temporary `file:` core),
  installs them with the cores into throwaway consumers: a Vite build of every sub-path, tsc over every
  sub-path's types, a player-only consumer. Run when touching `exports`,
  `files` or the build.

## Layout
`src/lib/<component>/` (component, `types.ts`, `index.ts`) and
`test/<component>/` (each with its own `setup.ts`, mocks and drift tests).

## Dependencies
The cores are **devDependencies at the published ranges** (`^2.1.0`; `-bar`
`^2.0.0`), resolved from
registry.npmjs.org (no `link: true` lock entries, real directories in
`node_modules`), so tests, typecheck and the drift tests run against what a
consumer installs. The peer-range tests check each is a `^2.x` range at
least the peer floor. For cross-repo work before a core release, a
devDependency can temporarily be `file:../waveform-<name>`: npm symlinks the
sibling checkout, which resolves outside this root, so add it to a
`server.fs.allow: ['.', '../waveform-<name>']` in `vitest.config.ts` while it
lasts (the peer-range tests fail meanwhile). Switch it back and re-resolve
the lock before publishing: `rm -rf node_modules/@arraypress/waveform-<name>`
then `npm install --save-dev @arraypress/waveform-<name>@^2.x.y` (a plain
`npm install` after editing package.json keeps the `link: true` entry). Peers: each core optional (`peerDependenciesMeta`), `^2.0.0` except
`-playlist` and `-sounds` at `^2.1.0` (the playlist's `/no-autoinit` entry;
`pickRenderOptions`, `destroy({ restore })`);
`svelte` `^5.59.0` — only the latest Svelte is supported. `engines.node`
`>=22.12`. Never edit the core repos from here.

## Toolchain
TypeScript stays on **6**: `@sveltejs/package` 3.0.3 peers `typescript
^6.0.0` and svelte-check 4.7.8 / svelte2tsx 0.7.63 cap at `^6` (rechecked
2026-11-21; React/Vue/Astro are on TS 7). Bump when both accept 7.

## The rule that matters: an undestructured prop vanishes (player, playlist, sounds)
Prop *types* derive from the cores (`Omit<WaveformPlayerOptions, …>` etc.),
so a new core option typechecks for free. Runtime forwarding does not: a new
option needs
1. the key in the component's `$props()` destructure, and
2. `set('<key>', <key>)` in its options builder.

Skip (1) and the prop falls into `...rest`, is spread onto the host `<div>`
as an attribute, and never reaches the core — no error, typechecks clean.
Every forwarded option is also a remount trigger (the builder runs inside the
mount `$effect`). Callback props are read through closures and never remount.

### Player (`src/lib/player/WaveformPlayer.svelte`)
- Forwards every `WaveformPlayerOptions` key except `style` (the host's CSS
  attribute; use `waveformStyle`). `src` is resolved to `url`. Callbacks are
  lowercase props (`onLoad` → `onload`, `onNextTrack` → `onnexttrack`); the
  track-nav ones are passed only when set (the core registers lock-screen
  buttons for any function), and adding/removing one remounts.
- Per-track options (`duration`, `downloadUrl`, `downloadName`, `waveform`,
  `markers`, …): a `url` change **remounts** (never `loadTrack()`), so they
  always arrive with their url; an unset one is simply absent.
- Events with no option callback (`seek`, `ratechange`, `volumechange`,
  `loop`) are `onseek` / `onratechange` / `onvolumechange` / `onloop` props:
  the component listens once for `waveformplayer:<name>` on the host (the
  core's container) and calls the prop with the event's `detail` (one
  argument, typed from the core). Existing callbacks keep their signatures.
- Imports `@arraypress/waveform-player/no-autoinit` (never the root, which
  scans the page); the tests mock the root with a factory that throws.
- Host `class` is frozen at init and later changes go through `classList`,
  because the core rewrites the host's class list.

### Playlist (`src/lib/playlist/WaveformPlaylist.svelte`)
Follows the player pattern, not the bar's. Imports
`@arraypress/waveform-playlist/no-autoinit`, never the root (since 2.1 it
scans the page and registers `<waveform-playlist>`); the tests mock the root
to throw. Tracks render as `[data-track]`
markup the playlist parses (`data-duration` — seconds or a clock string —,
`data-download-url`, `data-download-name`, `data-waveform`: arrays
JSON-encoded, strings such as `wp1:` peaks verbatim). **Not forwarded**, and
typed `never` + swallowed in the destructure so they can't land on the host:
- `audioMode`, `loop`, `showLoop`, `lazy` — the playlist core strips them
  (it owns its audio; a looping track never fires `ended`, which ends
  `continuous`; `showLoop`'s button turns that loop on; `lazy` would only
  defer its own player);
- `loopLabel` — names the `showLoop` button, which a playlist never shows;
- per-track `url`/`src`, `title`, `artist`, `artwork`, `album`, `markers`,
  `waveform`, `duration`, `downloadUrl`, `downloadName` — set per track
  (the core's `PER_TRACK_OPTIONS`);
- `style` — the host's CSS.
Forward a new *player* option here only if the playlist passes it to its
player (usually yes: `showVolume`, `volume`, `showDownload`, `volumeLabel`,
`muteLabel`, `downloadLabel` do).

### Sounds (`src/lib/sounds/WaveformSounds.svelte`)
Renders the core's own markup into the host with `{@html}` (the host's ONLY
child) and constructs `WaveformSounds` over it; the runtime adopts it. A new
core option: destructure + `set()`; the markup is
`renderSounds(sounds, pickRenderOptions(buildOptions()))`, so a
render-shaping option needs nothing more. The rebuild `$effect` destroys
the old instance in its body (`teardown(html)`), not its cleanup — a
cleanup still reads the OLD `markup` — with `{ restore: true }` when the
markup is unchanged; a separate dependency-free `$effect` tears down on
unmount. `ssr.test.ts` checks the server render is byte-identical to
`renderSounds`; `hydration.test.ts` / `integration.test.ts` use the real core.
`NOT_FORWARDED` is empty: the whole surface is forwarded. In the mocked suites
render lists one at a time (concurrent dynamic imports of a `vi.mock`ed core
can hand the second component the real module).

### Bar (`src/lib/bar/`)
`config` passes **verbatim** to the singleton's `init()` (the module's default
export), so there is no destructure trap; the hand-written
`WaveformBarConfig` in `src/lib/bar/types.ts` is the contract and must match
the other three bar wrappers. Callbacks are not props (use the
`waveformbar:*` events). Bar 2.0 generates its own types and `declare global`
(`Window.WaveformBar`, `waveformbar:*`); this package declares no globals and
no module shims — don't add any.

## Drift tests (a missed forward is a red test, not a silent drop)
- **Player** `test/player/forwarding-drift.test.ts`: option keys = the core's
  `DEFAULT_OPTIONS` (`src/js/themes.ts`) ∪ `WaveformPlayerOptions` keys in
  `types/types.d.ts`, read via the `node_modules` path (`test/player/core-options.ts`).
  Each must reach the constructor and remount on change, or be in
  `NOT_FORWARDED` (`style`). A new option with a `null` default needs a
  sample in `SAMPLE_OVERRIDES`. Events: every key of
  `WaveformPlayerInstanceEventMap` must be behind an option callback
  (`EVENT_VIA_CALLBACK`) or be an `on<name>` prop that receives the detail.
  Remount checks go through `test/player/Harness.svelte` (testing-library's
  `rerender()` invalidates every prop).
- **Playlist** `test/playlist/forwarding-drift.test.ts`: `WaveformPlaylistOptions`
  ∪ `WaveformPlayerOptions` from both cores' `types/types.d.ts`
  (`?raw` imports by node_modules path); `NOT_FORWARDED` as listed above.
- **Sounds** `test/sounds/forwarding-drift.test.ts`: `WaveformSoundsOptions`
  from `types/types.d.ts`.
- **Bar** `test/bar/config-drift.test.ts`: `DEFAULTS` parsed from the bar's
  `src/js/core.ts` (its `exports` map hides `src/`, hence the node_modules
  path) vs `WaveformBarConfig`; `NOT_TYPED` (the `on*` callbacks),
  `NOT_IN_DEFAULTS` (`mode`), and `SHARED_CONFIG_KEYS` (identical in all four
  bar wrappers).
- Proven red by deleting one forward (player `loopLabel`, playlist `volume`,
  player `onloop`) on 2026-11-21.

## Conventions
- Logging prefixes `[WaveformPlayerSvelte]`, `[WaveformBarSvelte]`,
  `[WaveformPlaylistSvelte]`, `[WaveformSoundsSvelte]`.
- Every user-visible change gets a `CHANGELOG.md` entry.

## Cross-repo
An option change is a family-wide batch — load the `waveform-release` skill.
