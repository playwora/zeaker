# Zeaker

> **Node.js Lossless Audio Player (PortAudio + FFmpeg)**

[![npm version](https://img.shields.io/npm/v/zeaker.svg)](https://www.npmjs.com/package/zeaker)
[![License](https://img.shields.io/github/license/playwora/zeaker)](LICENSE)

Zeaker is a high-fidelity, cross-platform audio player for Node.js, supporting gapless playback, bit-perfect output, advanced playlist management, and robust device selection. Powered by native PortAudio bindings and FFmpeg, Zeaker delivers uncompromising lossless audio playback for desktop and server environments.

---

## Features

- **Lossless audio playback** (WAV, FLAC, ALAC, AIFF, etc.)
- **Gapless playback** and crossfade transitions
- **Bit-perfect mode** for audiophile output
- **Advanced playlist management** (shuffle, repeat, navigation)
- **Device selection** (WASAPI, ASIO, CoreAudio, ALSA, etc.)
- **Streaming support** (HTTP/HTTPS)
- **Volume control, seeking, and metadata extraction**
- **Robust error handling** and event-driven API

---

## Installation

```sh
npm i zeaker
```

- Requires Node.js 16+
- FFmpeg and PortAudio are bundled for major platforms (Windows, macOS, Linux)

---

## Usage

### Basic Playback

```js
import { AudioPlayer } from "zeaker";

const player = new AudioPlayer();
player.on("play", (track) => console.log("Now playing:", track));
player.on("error", (err) => console.error("Playback error:", err));

await player.play("track.flac");
```

### Playlist Playback

```js
const playlist = ["song1.flac", "song2.wav", "song3.aac"];
await player.playPlaylist(playlist);
```

### Device Selection

```js
const devices = await AudioPlayer.listOutputDevices();
console.log(devices);
await player.setOutputDevice(devices[0].index); // Select first output device
```

### Streaming Audio

```js
await player.playStream("https://example.com/stream.mp3");
```

### Advanced: Gapless & Crossfade

```js
// Enable gapless playback for next track
await player.playGapless("nextTrack.flac");

// Crossfade to next track (3s duration)
await player.crossfadeTo("nextTrack.flac", 3);
```

### Effects & Bit-Perfect Mode

```js
player.getManagers().effects.setBitPerfect(true); // Enable bit-perfect output
player.getManagers().effects.setCrossfadeDuration(5); // 5s crossfade
```

### Volume, Pause, Resume, Seek

```js
await player.setVolume(0.5); // 50% volume
await player.pause();
await player.resume();
await player.seek(60); // Seek to 1:00
```

### Metadata Extraction

```js
const metadata = await player.getMetadata();
console.log(metadata); // { title, artist, album, duration, ... }
```

---

## Supported Formats

- WAV, FLAC, ALAC, AIFF, MP3, AAC, M4A, OGG, MP4, and more (via FFmpeg)

---

## Error Handling

Zeaker provides robust error handling and user-friendly messages. Listen for the `error` event on the player instance, or use the exported `handleError` utility for custom handling.

---

## API Reference

Zeaker exposes a modular, event-driven API. Below is a summary of the main modules and their key methods. For full details, see the source JSDoc or [DOCUMENTATION.md](DOCUMENTATION.md).

### Modules

- **AudioPlayer** — Main playback API (play, pause, resume, stop, seek, volume, metadata, playlist, gapless, crossfade, streaming, device selection)
- **DeviceManager** — Audio device discovery, selection, and validation
- **PlaylistManager** — Playlist operations (load, shuffle, repeat, navigation)
- **AudioEffects** — Advanced effects: gapless, crossfade, bit-perfect mode
- **StreamManager** — HTTP/HTTPS streaming with buffering and reconnection
- **AudioUtils** — Audio processing and format utilities
- **ErrorHandler** — Centralized error handling utilities
- **FFmpegUtils** — FFmpeg-related utilities for audio processing

### Key Classes & Methods

#### AudioPlayer
- `play(filePath, [startPosition])` — Play an audio file
- `pause()` / `resume()` / `stop()` — Playback controls
- `seek(positionSeconds)` — Seek within track
- `setVolume(level)` / `getVolume()` — Volume control
- `getMetadata()` — Extract metadata from current track
- `getDuration()` — Get track duration
- `playPlaylist(playlist)` — Play a playlist
- `skip()` / `previous()` — Playlist navigation
- `setPlaylistShuffle([enable])` — Shuffle mode
- `setPlaylistRepeat(mode)` — Repeat mode
- `playGapless(nextTrack)` — Enable gapless playback
- `crossfadeTo(nextTrack, [duration])` — Crossfade to next track
- `playStream(url, [options])` — Play from streaming source
- `setOutputDevice(deviceIndex)` — Select output device
- `setBitPerfect(options)` — Enable/disable bit-perfect mode
- `onVisualization(callback)` — PCM visualization
- `setBufferSize(frames)` — Set buffer size
- `setCrossfadeDuration(duration)` / `setCrossfadeCurve(curve)` — Crossfade config
- `getStatus()` — Playback status
- `getManagers()` — Access advanced managers
- `getCurrentTime()` — Elapsed playback time
- `listOutputDevices()` (static) — List output devices
- `testSineWave()` (static) — Test output with sine wave

#### DeviceManager
- `listOutputDevices()` — List available output devices
- `setOutputDevice(deviceIndex)` — Select output device
- `getCurrentDevice()` — Get current device
- `getDefaultDevice()` — Get default device
- `findDeviceByName(deviceName, [exactMatch])` — Find device by name
- `validateDeviceCapabilities(device, requirements)` — Validate device for playback

#### PlaylistManager
- `loadPlaylist(playlist)` — Load a new playlist
- `setPlaylistShuffle([enable])` — Shuffle mode
- `setPlaylistRepeat(mode)` — Repeat mode
- `getPlaylistCopy()` — Get a copy of the playlist

#### AudioEffects
- `setBitPerfect(options)` — Enable/disable bit-perfect mode
- `isBitPerfectMode()` — Check bit-perfect status
- `setCrossfadeDuration(duration)` / `setCrossfadeCurve(curve)` — Crossfade config
- `getCrossfadeConfig()` — Get crossfade config
- `prebufferNextTrack(nextTrack, ffmpegPath, [audioFormat])` — Pre-buffer for gapless
- `createCrossfade(currentBuffers, nextBuffers, sampleRate, channels, [duration])` — Create crossfade effect
- `waitForGaplessReady([timeoutMs])` — Wait for gapless ready
- `getGaplessBuffers()` — Get gapless buffers
- `cleanupGapless()` — Clean up gapless resources
- `getEffectAvailability()` — Check effect availability
- `validateEffectAvailability(effectName)` — Validate effect usage
- `getConfiguration()` — Get effects config

#### StreamManager, AudioUtils, ErrorHandler, FFmpegUtils
- See [DOCUMENTATION.md](DOCUMENTATION.md) for details on streaming, audio utilities, error handling, and FFmpeg helpers.

---

## Contributing

Pull requests and issues are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT © zevinDev

---

<meta name="description" content="Zeaker: Node.js Lossless Audio Player with PortAudio and FFmpeg. Gapless, bit-perfect, playlists, streaming, and more." />
<meta property="og:title" content="Zeaker Node.js Lossless Audio Player" />
<meta property="og:description" content="Audiophile-grade Node.js audio player with gapless, bit-perfect, and advanced features." />
<meta property="og:type" content="software" />
<meta property="og:url" content="https://github.com/playwora/zeaker" />
