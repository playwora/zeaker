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

See JSDoc comments in the source for full API details. Key classes:

- `AudioPlayer` — Main playback API
- `DeviceManager` — Device selection
- `PlaylistManager` — Playlist operations
- `AudioEffects` — Gapless, crossfade, bit-perfect
- `StreamManager` — HTTP/HTTPS streaming

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
