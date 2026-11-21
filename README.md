# WaveformPlayer for Svelte

Svelte 5 components for [WaveformPlayer](https://waveformplayer.com): the player,
the persistent bottom bar, the playlist and the sound list. One package, one
sub-path per component.

**[Documentation](https://docs.waveformplayer.com/frameworks/svelte/)**

## Install only the cores you use

Each component lives at its own sub-path and loads its core library on mount.
The cores are optional peer dependencies, so install the ones for the
components you import and skip the rest:

| Import | Install alongside `svelte` (5.59+) |
| --- | --- |
| `@arraypress/waveform-svelte/player` | `@arraypress/waveform-player` |
| `@arraypress/waveform-svelte/bar` | `@arraypress/waveform-bar` `@arraypress/waveform-player` |
| `@arraypress/waveform-svelte/playlist` | `@arraypress/waveform-playlist` `@arraypress/waveform-player` |
| `@arraypress/waveform-svelte/sounds` | `@arraypress/waveform-sounds` `@arraypress/waveform-player` |

Every core must be 2.0 or later. Node 22.12+.

There is no root import: `import … from '@arraypress/waveform-svelte'` is an
error on purpose. A combined entry would make your bundler resolve every core,
including the ones you didn't install.

```bash
npm install @arraypress/waveform-svelte @arraypress/waveform-player svelte
```

## Player

```svelte
<script lang="ts">
  import { WaveformPlayer } from '@arraypress/waveform-svelte/player';
  import '@arraypress/waveform-player/dist/waveform-player.css';
</script>

<WaveformPlayer url="/track.mp3" title="My Song" artist="The Artist" />

<!-- Shows 3:07 and the waveform without fetching any audio until play;
     `waveform` takes an array, a .json URL or compact `wp1:` peaks. -->
<WaveformPlayer url="/track.mp3" preload="none" duration={187} waveform={peaks}
  showVolume showDownload onseek={({ currentTime }) => console.log(currentTime)} />
```

## Bar

```svelte
<script lang="ts">
  import { WaveformBar, WaveformBarTrigger } from '@arraypress/waveform-svelte/bar';
</script>

<!-- render ONCE in your root layout -->
<WaveformBar config={{ persist: true, continuous: true }} />

<!-- drop triggers anywhere -->
<WaveformBarTrigger url="/audio/track.mp3" title="My Track" artist="The Artist" />
```

## Playlist

```svelte
<script lang="ts">
  import { WaveformPlaylist } from '@arraypress/waveform-svelte/playlist';
</script>

<WaveformPlaylist tracks={[{ url: '/a.mp3', title: 'A', artist: 'Artist', duration: '3:45' }]} />
```

## Sounds

Once, in your app entry (e.g. `+layout.svelte`):

```js
import '@arraypress/waveform-player'; // registers window.WaveformPlayer, the audio engine
import '@arraypress/waveform-player/styles.css';
import '@arraypress/waveform-sounds/styles.css';
```

```svelte
<script lang="ts">
  import { WaveformSounds } from '@arraypress/waveform-svelte/sounds';
  import sounds from '$lib/sounds.json';
</script>

<WaveformSounds sounds={sounds.sounds} />
```

## Coming from the 1.x packages

Each sub-path exports what its old package did, with the same props,
callbacks and instance methods, plus the 2.0 additions (see the CHANGELOG).
The import changes, and the cores must be 2.0:

| Before | After |
| --- | --- |
| `@arraypress/waveform-player-svelte` | `@arraypress/waveform-svelte/player` |
| `@arraypress/waveform-bar-svelte` | `@arraypress/waveform-svelte/bar` |
| `@arraypress/waveform-playlist-svelte` | `@arraypress/waveform-svelte/playlist` |
| `@arraypress/waveform-sounds-svelte` | `@arraypress/waveform-svelte/sounds` |

## License

MIT © ArrayPress Limited
