## Modules

<dl>
<dt><a href="#module_AudioEffects">AudioEffects</a></dt>
<dd><p>Advanced audio effects including gapless playback, crossfade, and bit-perfect mode</p>
</dd>
<dt><a href="#module_AudioPlayer">AudioPlayer</a></dt>
<dd><p>Modular Node.js Lossless Audio Player (PortAudio + FFmpeg)</p>
</dd>
<dt><a href="#module_DeviceManager">DeviceManager</a></dt>
<dd><p>Manages audio device selection and configuration</p>
</dd>
<dt><a href="#module_PlaylistManager">PlaylistManager</a></dt>
<dd><p>Manages playlist operations including shuffle, repeat, and navigation</p>
</dd>
<dt><a href="#module_StreamManager">StreamManager</a></dt>
<dd><p>Manages HTTP/HTTPS streaming with buffering, reconnection, and error handling</p>
</dd>
<dt><a href="#module_Zeaker">Zeaker</a></dt>
<dd><p>Node.js Lossless Audio Player (PortAudio + FFmpeg) - Modular Entry Point</p>
</dd>
<dt><a href="#module_AudioUtils">AudioUtils</a></dt>
<dd><p>Audio processing and format utilities</p>
</dd>
<dt><a href="#module_ErrorHandler">ErrorHandler</a></dt>
<dd><p>Centralized error handling utilities for the audio player</p>
</dd>
<dt><a href="#module_FFmpegUtils">FFmpegUtils</a></dt>
<dd><p>FFmpeg-related utilities for audio processing</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#getAudioStreamInfo">getAudioStreamInfo(ffprobePath, filePath)</a> ⇒ <code>Promise.&lt;{sample_rate: number, channels: number, duration: number}&gt;</code></dt>
<dd><p>Get audio stream info (sample rate, channels) from a file using ffprobe.</p>
</dd>
</dl>

<a name="module_AudioEffects"></a>

## AudioEffects
Advanced audio effects including gapless playback, crossfade, and bit-perfect mode

**Author**: zevinDev  

* [AudioEffects](#module_AudioEffects)
    * [.AudioEffects](#module_AudioEffects.AudioEffects)
        * [.setBitPerfect(options)](#module_AudioEffects.AudioEffects+setBitPerfect) ⇒ <code>object</code>
        * [.isBitPerfectMode()](#module_AudioEffects.AudioEffects+isBitPerfectMode) ⇒ <code>boolean</code>
        * [.setCrossfadeDuration(duration)](#module_AudioEffects.AudioEffects+setCrossfadeDuration)
        * [.setCrossfadeCurve(curve)](#module_AudioEffects.AudioEffects+setCrossfadeCurve)
        * [.getCrossfadeConfig()](#module_AudioEffects.AudioEffects+getCrossfadeConfig) ⇒ <code>object</code>
        * [.prebufferNextTrack(nextTrack, ffmpegPath, [audioFormat])](#module_AudioEffects.AudioEffects+prebufferNextTrack) ⇒ <code>Promise.&lt;object&gt;</code>
        * [.createCrossfade(currentBuffers, nextBuffers, sampleRate, channels, [duration])](#module_AudioEffects.AudioEffects+createCrossfade) ⇒ <code>Array.&lt;Buffer&gt;</code>
        * [.waitForGaplessReady([timeoutMs])](#module_AudioEffects.AudioEffects+waitForGaplessReady) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [.getGaplessBuffers()](#module_AudioEffects.AudioEffects+getGaplessBuffers) ⇒ <code>Array.&lt;Buffer&gt;</code> \| <code>null</code>
        * [.cleanupGapless()](#module_AudioEffects.AudioEffects+cleanupGapless)
        * [.getEffectAvailability()](#module_AudioEffects.AudioEffects+getEffectAvailability) ⇒ <code>object</code>
        * [.validateEffectAvailability(effectName)](#module_AudioEffects.AudioEffects+validateEffectAvailability)
        * [.getConfiguration()](#module_AudioEffects.AudioEffects+getConfiguration) ⇒ <code>object</code>

<a name="module_AudioEffects.AudioEffects"></a>

### AudioEffects.AudioEffects
AudioEffects handles advanced audio processing features.Manages gapless playback, crossfade transitions, and bit-perfect mode.

**Kind**: static class of [<code>AudioEffects</code>](#module_AudioEffects)  
**Author**: zevinDev  

* [.AudioEffects](#module_AudioEffects.AudioEffects)
    * [.setBitPerfect(options)](#module_AudioEffects.AudioEffects+setBitPerfect) ⇒ <code>object</code>
    * [.isBitPerfectMode()](#module_AudioEffects.AudioEffects+isBitPerfectMode) ⇒ <code>boolean</code>
    * [.setCrossfadeDuration(duration)](#module_AudioEffects.AudioEffects+setCrossfadeDuration)
    * [.setCrossfadeCurve(curve)](#module_AudioEffects.AudioEffects+setCrossfadeCurve)
    * [.getCrossfadeConfig()](#module_AudioEffects.AudioEffects+getCrossfadeConfig) ⇒ <code>object</code>
    * [.prebufferNextTrack(nextTrack, ffmpegPath, [audioFormat])](#module_AudioEffects.AudioEffects+prebufferNextTrack) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.createCrossfade(currentBuffers, nextBuffers, sampleRate, channels, [duration])](#module_AudioEffects.AudioEffects+createCrossfade) ⇒ <code>Array.&lt;Buffer&gt;</code>
    * [.waitForGaplessReady([timeoutMs])](#module_AudioEffects.AudioEffects+waitForGaplessReady) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.getGaplessBuffers()](#module_AudioEffects.AudioEffects+getGaplessBuffers) ⇒ <code>Array.&lt;Buffer&gt;</code> \| <code>null</code>
    * [.cleanupGapless()](#module_AudioEffects.AudioEffects+cleanupGapless)
    * [.getEffectAvailability()](#module_AudioEffects.AudioEffects+getEffectAvailability) ⇒ <code>object</code>
    * [.validateEffectAvailability(effectName)](#module_AudioEffects.AudioEffects+validateEffectAvailability)
    * [.getConfiguration()](#module_AudioEffects.AudioEffects+getConfiguration) ⇒ <code>object</code>

<a name="module_AudioEffects.AudioEffects+setBitPerfect"></a>

#### audioEffects.setBitPerfect(options) ⇒ <code>object</code>
Enable or disable bit-perfect output mode.When enabled, disables all PCM manipulation (volume, crossfade, gapless, visualization, etc.).

**Kind**: instance method of [<code>AudioEffects</code>](#module_AudioEffects.AudioEffects)  
**Returns**: <code>object</code> - Configuration result  
**Throws**:

- <code>Error</code> If configuration fails

**Author**: zevinDev  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>boolean</code> \| <code>object</code> | <code>true</code> | Pass `true` to enable, `false` to disable, or an object:   { enable: boolean, sampleRate?: number, bitDepth?: number } |

<a name="module_AudioEffects.AudioEffects+isBitPerfectMode"></a>

#### audioEffects.isBitPerfectMode() ⇒ <code>boolean</code>
Check if bit-perfect mode is enabled.

**Kind**: instance method of [<code>AudioEffects</code>](#module_AudioEffects.AudioEffects)  
**Returns**: <code>boolean</code> - True if bit-perfect mode is enabled  
**Author**: zevinDev  
<a name="module_AudioEffects.AudioEffects+setCrossfadeDuration"></a>

#### audioEffects.setCrossfadeDuration(duration)
Set the crossfade duration for crossfade transitions.

**Kind**: instance method of [<code>AudioEffects</code>](#module_AudioEffects.AudioEffects)  
**Throws**:

- <code>Error</code> If duration is invalid or in bit-perfect mode

**Author**: zevinDev  

| Param | Type | Description |
| --- | --- | --- |
| duration | <code>number</code> | Crossfade duration in seconds (must be >= 0) |

<a name="module_AudioEffects.AudioEffects+setCrossfadeCurve"></a>

#### audioEffects.setCrossfadeCurve(curve)
Set the crossfade curve for crossfade transitions.

**Kind**: instance method of [<code>AudioEffects</code>](#module_AudioEffects.AudioEffects)  
**Throws**:

- <code>Error</code> If curve is invalid or in bit-perfect mode

**Author**: zevinDev  

| Param | Type | Description |
| --- | --- | --- |
| curve | <code>string</code> | Crossfade curve name |

<a name="module_AudioEffects.AudioEffects+getCrossfadeConfig"></a>

#### audioEffects.getCrossfadeConfig() ⇒ <code>object</code>
Get current crossfade configuration.

**Kind**: instance method of [<code>AudioEffects</code>](#module_AudioEffects.AudioEffects)  
**Returns**: <code>object</code> - Crossfade configuration  
**Author**: zevinDev  
<a name="module_AudioEffects.AudioEffects+prebufferNextTrack"></a>

#### audioEffects.prebufferNextTrack(nextTrack, ffmpegPath, [audioFormat]) ⇒ <code>Promise.&lt;object&gt;</code>
Pre-buffer the next track's PCM data for gapless playback.

**Kind**: instance method of [<code>AudioEffects</code>](#module_AudioEffects.AudioEffects)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Prebuffering result with buffers and control functions  
**Throws**:

- <code>Error</code> If prebuffering fails

**Author**: zevinDev  

| Param | Type | Description |
| --- | --- | --- |
| nextTrack | <code>string</code> | Path to the next audio file |
| ffmpegPath | <code>string</code> | Path to ffmpeg binary |
| [audioFormat] | <code>object</code> | Audio format settings |

<a name="module_AudioEffects.AudioEffects+createCrossfade"></a>

#### audioEffects.createCrossfade(currentBuffers, nextBuffers, sampleRate, channels, [duration]) ⇒ <code>Array.&lt;Buffer&gt;</code>
Create crossfade effect between two tracks.

**Kind**: instance method of [<code>AudioEffects</code>](#module_AudioEffects.AudioEffects)  
**Returns**: <code>Array.&lt;Buffer&gt;</code> - Mixed PCM buffers for crossfade  
**Throws**:

- <code>Error</code> If crossfade creation fails or bit-perfect mode is enabled

**Author**: zevinDev  

| Param | Type | Description |
| --- | --- | --- |
| currentBuffers | <code>Array.&lt;Buffer&gt;</code> | PCM buffers from current track |
| nextBuffers | <code>Array.&lt;Buffer&gt;</code> | PCM buffers from next track |
| sampleRate | <code>number</code> | Audio sample rate |
| channels | <code>number</code> | Number of audio channels |
| [duration] | <code>number</code> | Crossfade duration (uses configured duration if not specified) |

<a name="module_AudioEffects.AudioEffects+waitForGaplessReady"></a>

#### audioEffects.waitForGaplessReady([timeoutMs]) ⇒ <code>Promise.&lt;boolean&gt;</code>
Wait for gapless track to be ready with timeout.

**Kind**: instance method of [<code>AudioEffects</code>](#module_AudioEffects.AudioEffects)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - True if ready, false if timeout  
**Author**: zevinDev  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [timeoutMs] | <code>number</code> | <code>2000</code> | Timeout in milliseconds |

<a name="module_AudioEffects.AudioEffects+getGaplessBuffers"></a>

#### audioEffects.getGaplessBuffers() ⇒ <code>Array.&lt;Buffer&gt;</code> \| <code>null</code>
Get gapless playback buffers if ready.

**Kind**: instance method of [<code>AudioEffects</code>](#module_AudioEffects.AudioEffects)  
**Returns**: <code>Array.&lt;Buffer&gt;</code> \| <code>null</code> - PCM buffers or null if not ready  
**Author**: zevinDev  
<a name="module_AudioEffects.AudioEffects+cleanupGapless"></a>

#### audioEffects.cleanupGapless()
Clean up gapless playback resources.

**Kind**: instance method of [<code>AudioEffects</code>](#module_AudioEffects.AudioEffects)  
**Author**: zevinDev  
<a name="module_AudioEffects.AudioEffects+getEffectAvailability"></a>

#### audioEffects.getEffectAvailability() ⇒ <code>object</code>
Check if advanced effects are available (not in bit-perfect mode).

**Kind**: instance method of [<code>AudioEffects</code>](#module_AudioEffects.AudioEffects)  
**Returns**: <code>object</code> - Availability status for each effect  
**Author**: zevinDev  
<a name="module_AudioEffects.AudioEffects+validateEffectAvailability"></a>

#### audioEffects.validateEffectAvailability(effectName)
Validate if an effect can be used in current mode.

**Kind**: instance method of [<code>AudioEffects</code>](#module_AudioEffects.AudioEffects)  
**Throws**:

- <code>Error</code> If effect is not available in current mode

**Author**: zevinDev  

| Param | Type | Description |
| --- | --- | --- |
| effectName | <code>string</code> | Name of the effect to validate |

<a name="module_AudioEffects.AudioEffects+getConfiguration"></a>

#### audioEffects.getConfiguration() ⇒ <code>object</code>
Get current audio effects configuration.

**Kind**: instance method of [<code>AudioEffects</code>](#module_AudioEffects.AudioEffects)  
**Returns**: <code>object</code> - Complete effects configuration  
**Author**: zevinDev  
<a name="module_AudioPlayer"></a>

## AudioPlayer
Modular Node.js Lossless Audio Player (PortAudio + FFmpeg)

**Author**: zevinDev  

* [AudioPlayer](#module_AudioPlayer)
    * [.AudioPlayer](#module_AudioPlayer.AudioPlayer)
        * _instance_
            * [.play(filePath, [startPosition])](#module_AudioPlayer.AudioPlayer+play) ⇒ <code>Promise.&lt;void&gt;</code>
            * [.pause()](#module_AudioPlayer.AudioPlayer+pause) ⇒ <code>Promise.&lt;void&gt;</code>
            * [.resume()](#module_AudioPlayer.AudioPlayer+resume) ⇒ <code>Promise.&lt;void&gt;</code>
            * [.stop()](#module_AudioPlayer.AudioPlayer+stop) ⇒ <code>Promise.&lt;void&gt;</code>
            * [.seek(positionSeconds)](#module_AudioPlayer.AudioPlayer+seek) ⇒ <code>Promise.&lt;void&gt;</code>
            * [.setVolume(level)](#module_AudioPlayer.AudioPlayer+setVolume) ⇒ <code>Promise.&lt;void&gt;</code>
            * [.getVolume()](#module_AudioPlayer.AudioPlayer+getVolume) ⇒ <code>number</code>
            * [.getMetadata()](#module_AudioPlayer.AudioPlayer+getMetadata) ⇒ <code>Promise.&lt;Object&gt;</code>
            * [.getDuration()](#module_AudioPlayer.AudioPlayer+getDuration) ⇒ <code>number</code> \| <code>null</code>
            * [.playPlaylist(playlist)](#module_AudioPlayer.AudioPlayer+playPlaylist) ⇒ <code>Promise.&lt;void&gt;</code>
            * [.skip()](#module_AudioPlayer.AudioPlayer+skip) ⇒ <code>Promise.&lt;void&gt;</code>
            * [.previous()](#module_AudioPlayer.AudioPlayer+previous) ⇒ <code>Promise.&lt;void&gt;</code>
            * [.stopPlaylist()](#module_AudioPlayer.AudioPlayer+stopPlaylist)
            * [.setPlaylistShuffle([enable])](#module_AudioPlayer.AudioPlayer+setPlaylistShuffle)
            * [.setPlaylistRepeat(mode)](#module_AudioPlayer.AudioPlayer+setPlaylistRepeat)
            * [.playGapless(nextTrack)](#module_AudioPlayer.AudioPlayer+playGapless) ⇒ <code>Promise.&lt;void&gt;</code>
            * [.crossfadeTo(nextTrack, [duration])](#module_AudioPlayer.AudioPlayer+crossfadeTo) ⇒ <code>Promise.&lt;void&gt;</code>
            * [.playStream(url, [options])](#module_AudioPlayer.AudioPlayer+playStream) ⇒ <code>Promise.&lt;void&gt;</code>
            * [.setOutputDevice(deviceIndex)](#module_AudioPlayer.AudioPlayer+setOutputDevice) ⇒ <code>Promise.&lt;void&gt;</code>
            * [.setBitPerfect(options)](#module_AudioPlayer.AudioPlayer+setBitPerfect) ⇒ <code>Promise.&lt;void&gt;</code>
            * [.onVisualization(callback)](#module_AudioPlayer.AudioPlayer+onVisualization)
            * [.setBufferSize(frames)](#module_AudioPlayer.AudioPlayer+setBufferSize)
            * [.setCrossfadeDuration(duration)](#module_AudioPlayer.AudioPlayer+setCrossfadeDuration)
            * [.setCrossfadeCurve(curve)](#module_AudioPlayer.AudioPlayer+setCrossfadeCurve)
            * [.getStatus()](#module_AudioPlayer.AudioPlayer+getStatus) ⇒ <code>object</code>
            * [.getManagers()](#module_AudioPlayer.AudioPlayer+getManagers) ⇒ <code>object</code>
            * [.getCurrentTime()](#module_AudioPlayer.AudioPlayer+getCurrentTime) ⇒ <code>number</code>
        * _static_
            * [.listOutputDevices()](#module_AudioPlayer.AudioPlayer.listOutputDevices) ⇒ <code>Promise.&lt;Array&gt;</code>
            * [.testSineWave()](#module_AudioPlayer.AudioPlayer.testSineWave) ⇒ <code>Promise.&lt;void&gt;</code>

<a name="module_AudioPlayer.AudioPlayer"></a>

### AudioPlayer.AudioPlayer
**Kind**: static class of [<code>AudioPlayer</code>](#module_AudioPlayer)  

* [.AudioPlayer](#module_AudioPlayer.AudioPlayer)
    * _instance_
        * [.play(filePath, [startPosition])](#module_AudioPlayer.AudioPlayer+play) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.pause()](#module_AudioPlayer.AudioPlayer+pause) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.resume()](#module_AudioPlayer.AudioPlayer+resume) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.stop()](#module_AudioPlayer.AudioPlayer+stop) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.seek(positionSeconds)](#module_AudioPlayer.AudioPlayer+seek) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.setVolume(level)](#module_AudioPlayer.AudioPlayer+setVolume) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.getVolume()](#module_AudioPlayer.AudioPlayer+getVolume) ⇒ <code>number</code>
        * [.getMetadata()](#module_AudioPlayer.AudioPlayer+getMetadata) ⇒ <code>Promise.&lt;Object&gt;</code>
        * [.getDuration()](#module_AudioPlayer.AudioPlayer+getDuration) ⇒ <code>number</code> \| <code>null</code>
        * [.playPlaylist(playlist)](#module_AudioPlayer.AudioPlayer+playPlaylist) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.skip()](#module_AudioPlayer.AudioPlayer+skip) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.previous()](#module_AudioPlayer.AudioPlayer+previous) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.stopPlaylist()](#module_AudioPlayer.AudioPlayer+stopPlaylist)
        * [.setPlaylistShuffle([enable])](#module_AudioPlayer.AudioPlayer+setPlaylistShuffle)
        * [.setPlaylistRepeat(mode)](#module_AudioPlayer.AudioPlayer+setPlaylistRepeat)
        * [.playGapless(nextTrack)](#module_AudioPlayer.AudioPlayer+playGapless) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.crossfadeTo(nextTrack, [duration])](#module_AudioPlayer.AudioPlayer+crossfadeTo) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.playStream(url, [options])](#module_AudioPlayer.AudioPlayer+playStream) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.setOutputDevice(deviceIndex)](#module_AudioPlayer.AudioPlayer+setOutputDevice) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.setBitPerfect(options)](#module_AudioPlayer.AudioPlayer+setBitPerfect) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.onVisualization(callback)](#module_AudioPlayer.AudioPlayer+onVisualization)
        * [.setBufferSize(frames)](#module_AudioPlayer.AudioPlayer+setBufferSize)
        * [.setCrossfadeDuration(duration)](#module_AudioPlayer.AudioPlayer+setCrossfadeDuration)
        * [.setCrossfadeCurve(curve)](#module_AudioPlayer.AudioPlayer+setCrossfadeCurve)
        * [.getStatus()](#module_AudioPlayer.AudioPlayer+getStatus) ⇒ <code>object</code>
        * [.getManagers()](#module_AudioPlayer.AudioPlayer+getManagers) ⇒ <code>object</code>
        * [.getCurrentTime()](#module_AudioPlayer.AudioPlayer+getCurrentTime) ⇒ <code>number</code>
    * _static_
        * [.listOutputDevices()](#module_AudioPlayer.AudioPlayer.listOutputDevices) ⇒ <code>Promise.&lt;Array&gt;</code>
        * [.testSineWave()](#module_AudioPlayer.AudioPlayer.testSineWave) ⇒ <code>Promise.&lt;void&gt;</code>

<a name="module_AudioPlayer.AudioPlayer+play"></a>

#### audioPlayer.play(filePath, [startPosition]) ⇒ <code>Promise.&lt;void&gt;</code>
Play an audio file using ffmpeg for decoding and PortAudio for output.Uses async streaming with buffer management and error handling.

**Kind**: instance method of [<code>AudioPlayer</code>](#module_AudioPlayer.AudioPlayer)  
**Throws**:

- <code>Error</code> If playback fails or ffmpeg/PortAudio is not available

**Author**: zevinDev  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| filePath | <code>string</code> |  | Path to the audio file |
| [startPosition] | <code>number</code> | <code>0</code> | Position in seconds to start playback |

<a name="module_AudioPlayer.AudioPlayer+pause"></a>

#### audioPlayer.pause() ⇒ <code>Promise.&lt;void&gt;</code>
Pause playback.

**Kind**: instance method of [<code>AudioPlayer</code>](#module_AudioPlayer.AudioPlayer)  
**Throws**:

- <code>Error</code> If pause fails

**Emits**: <code>AudioPlayer#event:pause</code>  
**Author**: zevinDev  
<a name="module_AudioPlayer.AudioPlayer+resume"></a>

#### audioPlayer.resume() ⇒ <code>Promise.&lt;void&gt;</code>
Resume playback.

**Kind**: instance method of [<code>AudioPlayer</code>](#module_AudioPlayer.AudioPlayer)  
**Throws**:

- <code>Error</code> If resume fails

**Emits**: <code>AudioPlayer#event:resume</code>  
**Author**: zevinDev  
<a name="module_AudioPlayer.AudioPlayer+stop"></a>

#### audioPlayer.stop() ⇒ <code>Promise.&lt;void&gt;</code>
Stop playback and clean up resources.

**Kind**: instance method of [<code>AudioPlayer</code>](#module_AudioPlayer.AudioPlayer)  
**Throws**:

- <code>Error</code> If stop fails

**Emits**: <code>AudioPlayer#event:stop</code>  
**Author**: zevinDev  
<a name="module_AudioPlayer.AudioPlayer+seek"></a>

#### audioPlayer.seek(positionSeconds) ⇒ <code>Promise.&lt;void&gt;</code>
Seek to a specific position in the current track.

**Kind**: instance method of [<code>AudioPlayer</code>](#module_AudioPlayer.AudioPlayer)  
**Throws**:

- <code>Error</code> If seeking fails

**Emits**: <code>AudioPlayer#event:seek</code>  
**Author**: zevinDev  

| Param | Type | Description |
| --- | --- | --- |
| positionSeconds | <code>number</code> | Position in seconds |

<a name="module_AudioPlayer.AudioPlayer+setVolume"></a>

#### audioPlayer.setVolume(level) ⇒ <code>Promise.&lt;void&gt;</code>
Set playback volume.

**Kind**: instance method of [<code>AudioPlayer</code>](#module_AudioPlayer.AudioPlayer)  
**Throws**:

- <code>Error</code> If setting volume fails or in bit-perfect mode

**Author**: zevinDev  

| Param | Type | Description |
| --- | --- | --- |
| level | <code>number</code> | Volume level between 0.0 and 1.0 |

<a name="module_AudioPlayer.AudioPlayer+getVolume"></a>

#### audioPlayer.getVolume() ⇒ <code>number</code>
Get current volume level.

**Kind**: instance method of [<code>AudioPlayer</code>](#module_AudioPlayer.AudioPlayer)  
**Returns**: <code>number</code> - Current volume (0.0-1.0)  
**Author**: zevinDev  
<a name="module_AudioPlayer.AudioPlayer+getMetadata"></a>

#### audioPlayer.getMetadata() ⇒ <code>Promise.&lt;Object&gt;</code>
Extract metadata from the current track.

**Kind**: instance method of [<code>AudioPlayer</code>](#module_AudioPlayer.AudioPlayer)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - Metadata object  
**Throws**:

- <code>Error</code> If extraction fails or no track loaded

**Author**: zevinDev  
<a name="module_AudioPlayer.AudioPlayer+getDuration"></a>

#### audioPlayer.getDuration() ⇒ <code>number</code> \| <code>null</code>
Get current track duration in seconds.

**Kind**: instance method of [<code>AudioPlayer</code>](#module_AudioPlayer.AudioPlayer)  
**Returns**: <code>number</code> \| <code>null</code> - Duration in seconds, or null if unknown  
**Author**: zevinDev  
<a name="module_AudioPlayer.AudioPlayer+playPlaylist"></a>

#### audioPlayer.playPlaylist(playlist) ⇒ <code>Promise.&lt;void&gt;</code>
Play a playlist of audio files sequentially.

**Kind**: instance method of [<code>AudioPlayer</code>](#module_AudioPlayer.AudioPlayer)  
**Throws**:

- <code>Error</code> If playlist is invalid or playback fails

**Emits**: <code>AudioPlayer#event:playlistEnd</code>  
**Author**: zevinDev  

| Param | Type | Description |
| --- | --- | --- |
| playlist | <code>Array.&lt;string&gt;</code> | Array of file paths |

<a name="module_AudioPlayer.AudioPlayer+skip"></a>

#### audioPlayer.skip() ⇒ <code>Promise.&lt;void&gt;</code>
Skip to the next track in the playlist.

**Kind**: instance method of [<code>AudioPlayer</code>](#module_AudioPlayer.AudioPlayer)  
**Author**: zevinDev  
<a name="module_AudioPlayer.AudioPlayer+previous"></a>

#### audioPlayer.previous() ⇒ <code>Promise.&lt;void&gt;</code>
Skip to the previous track in the playlist.

**Kind**: instance method of [<code>AudioPlayer</code>](#module_AudioPlayer.AudioPlayer)  
**Author**: zevinDev  
<a name="module_AudioPlayer.AudioPlayer+stopPlaylist"></a>

#### audioPlayer.stopPlaylist()
Stop playlist playback.

**Kind**: instance method of [<code>AudioPlayer</code>](#module_AudioPlayer.AudioPlayer)  
**Author**: zevinDev  
<a name="module_AudioPlayer.AudioPlayer+setPlaylistShuffle"></a>

#### audioPlayer.setPlaylistShuffle([enable])
Enable or disable shuffle mode for playlists.

**Kind**: instance method of [<code>AudioPlayer</code>](#module_AudioPlayer.AudioPlayer)  
**Author**: zevinDev  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [enable] | <code>boolean</code> | <code>true</code> | Enable shuffle if true |

<a name="module_AudioPlayer.AudioPlayer+setPlaylistRepeat"></a>

#### audioPlayer.setPlaylistRepeat(mode)
Set repeat mode for playlists.

**Kind**: instance method of [<code>AudioPlayer</code>](#module_AudioPlayer.AudioPlayer)  
**Throws**:

- <code>Error</code> If invalid repeat mode

**Author**: zevinDev  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| mode | <code>&#x27;off&#x27;</code> \| <code>&#x27;one&#x27;</code> \| <code>&#x27;all&#x27;</code> | <code>off</code> | Repeat mode |

<a name="module_AudioPlayer.AudioPlayer+playGapless"></a>

#### audioPlayer.playGapless(nextTrack) ⇒ <code>Promise.&lt;void&gt;</code>
Enable gapless playback for the next track.

**Kind**: instance method of [<code>AudioPlayer</code>](#module_AudioPlayer.AudioPlayer)  
**Throws**:

- <code>Error</code> If bit-perfect mode is enabled

**Author**: zevinDev  

| Param | Type | Description |
| --- | --- | --- |
| nextTrack | <code>string</code> | Path to the next audio file |

<a name="module_AudioPlayer.AudioPlayer+crossfadeTo"></a>

#### audioPlayer.crossfadeTo(nextTrack, [duration]) ⇒ <code>Promise.&lt;void&gt;</code>
Crossfade between the current and next track.

**Kind**: instance method of [<code>AudioPlayer</code>](#module_AudioPlayer.AudioPlayer)  
**Throws**:

- <code>Error</code> If bit-perfect mode is enabled

**Author**: zevinDev  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| nextTrack | <code>string</code> |  | Path to the next audio file |
| [duration] | <code>number</code> | <code>3</code> | Crossfade duration in seconds |

<a name="module_AudioPlayer.AudioPlayer+playStream"></a>

#### audioPlayer.playStream(url, [options]) ⇒ <code>Promise.&lt;void&gt;</code>
Play from a streaming source.

**Kind**: instance method of [<code>AudioPlayer</code>](#module_AudioPlayer.AudioPlayer)  
**Throws**:

- <code>Error</code> If streaming fails

**Author**: zevinDev  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | Streaming source URL |
| [options] | <code>object</code> | Streaming options |

<a name="module_AudioPlayer.AudioPlayer+setOutputDevice"></a>

#### audioPlayer.setOutputDevice(deviceIndex) ⇒ <code>Promise.&lt;void&gt;</code>
Set the output device for playback.

**Kind**: instance method of [<code>AudioPlayer</code>](#module_AudioPlayer.AudioPlayer)  
**Throws**:

- <code>Error</code> If device is not found or not output-capable

**Emits**: <code>AudioPlayer#event:deviceChange</code>  
**Author**: zevinDev  

| Param | Type | Description |
| --- | --- | --- |
| deviceIndex | <code>number</code> | Device index |

<a name="module_AudioPlayer.AudioPlayer+setBitPerfect"></a>

#### audioPlayer.setBitPerfect(options) ⇒ <code>Promise.&lt;void&gt;</code>
Enable or disable bit-perfect output mode.

**Kind**: instance method of [<code>AudioPlayer</code>](#module_AudioPlayer.AudioPlayer)  
**Throws**:

- <code>Error</code> If currently playing and unable to restart

**Author**: zevinDev  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>boolean</code> \| <code>object</code> | <code>true</code> | Bit-perfect options |

<a name="module_AudioPlayer.AudioPlayer+onVisualization"></a>

#### audioPlayer.onVisualization(callback)
Attach a visualization callback for PCM data.

**Kind**: instance method of [<code>AudioPlayer</code>](#module_AudioPlayer.AudioPlayer)  
**Author**: zevinDev  

| Param | Type | Description |
| --- | --- | --- |
| callback | <code>function</code> | Function to receive PCM data |

<a name="module_AudioPlayer.AudioPlayer+setBufferSize"></a>

#### audioPlayer.setBufferSize(frames)
Set buffer size/latency for playback.

**Kind**: instance method of [<code>AudioPlayer</code>](#module_AudioPlayer.AudioPlayer)  
**Author**: zevinDev  

| Param | Type | Description |
| --- | --- | --- |
| frames | <code>number</code> | Buffer size in frames |

<a name="module_AudioPlayer.AudioPlayer+setCrossfadeDuration"></a>

#### audioPlayer.setCrossfadeDuration(duration)
Set the crossfade duration.

**Kind**: instance method of [<code>AudioPlayer</code>](#module_AudioPlayer.AudioPlayer)  
**Emits**: <code>AudioPlayer#event:crossfadeConfigChange</code>  
**Author**: zevinDev  

| Param | Type | Description |
| --- | --- | --- |
| duration | <code>number</code> | Duration in seconds |

<a name="module_AudioPlayer.AudioPlayer+setCrossfadeCurve"></a>

#### audioPlayer.setCrossfadeCurve(curve)
Set the crossfade curve.

**Kind**: instance method of [<code>AudioPlayer</code>](#module_AudioPlayer.AudioPlayer)  
**Emits**: <code>AudioPlayer#event:crossfadeConfigChange</code>  
**Author**: zevinDev  

| Param | Type | Description |
| --- | --- | --- |
| curve | <code>string</code> | Curve type |

<a name="module_AudioPlayer.AudioPlayer+getStatus"></a>

#### audioPlayer.getStatus() ⇒ <code>object</code>
Get current playback status.

**Kind**: instance method of [<code>AudioPlayer</code>](#module_AudioPlayer.AudioPlayer)  
**Returns**: <code>object</code> - Playback status  
**Author**: zevinDev  
<a name="module_AudioPlayer.AudioPlayer+getManagers"></a>

#### audioPlayer.getManagers() ⇒ <code>object</code>
Get manager instances for advanced usage.

**Kind**: instance method of [<code>AudioPlayer</code>](#module_AudioPlayer.AudioPlayer)  
**Returns**: <code>object</code> - Manager instances  
**Author**: zevinDev  
<a name="module_AudioPlayer.AudioPlayer+getCurrentTime"></a>

#### audioPlayer.getCurrentTime() ⇒ <code>number</code>
Get current playback time in seconds.

**Kind**: instance method of [<code>AudioPlayer</code>](#module_AudioPlayer.AudioPlayer)  
**Returns**: <code>number</code> - Elapsed playback time in seconds  
**Author**: zevinDev  
<a name="module_AudioPlayer.AudioPlayer.listOutputDevices"></a>

#### AudioPlayer.listOutputDevices() ⇒ <code>Promise.&lt;Array&gt;</code>
List available PortAudio output devices.

**Kind**: static method of [<code>AudioPlayer</code>](#module_AudioPlayer.AudioPlayer)  
**Returns**: <code>Promise.&lt;Array&gt;</code> - Array of device objects  
**Author**: zevinDev  
<a name="module_AudioPlayer.AudioPlayer.testSineWave"></a>

#### AudioPlayer.testSineWave() ⇒ <code>Promise.&lt;void&gt;</code>
Test PortAudio output with a synchronous 440Hz sine wave (2 seconds).Useful for debugging C++/Electron buffer issues.

**Kind**: static method of [<code>AudioPlayer</code>](#module_AudioPlayer.AudioPlayer)  
**Author**: zevinDev  
<a name="module_DeviceManager"></a>

## DeviceManager
Manages audio device selection and configuration

**Author**: zevinDev  

* [DeviceManager](#module_DeviceManager)
    * [.DeviceManager](#module_DeviceManager.DeviceManager)
        * [._initPortAudio()](#module_DeviceManager.DeviceManager+_initPortAudio) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.listOutputDevices()](#module_DeviceManager.DeviceManager+listOutputDevices) ⇒ <code>Promise.&lt;Array.&lt;{index: number, name: string, maxOutputChannels: number, defaultSampleRate: number}&gt;&gt;</code>
        * [.setOutputDevice(deviceIndex)](#module_DeviceManager.DeviceManager+setOutputDevice) ⇒ <code>Promise.&lt;object&gt;</code>
        * [.getCurrentDevice()](#module_DeviceManager.DeviceManager+getCurrentDevice) ⇒ <code>object</code> \| <code>null</code>
        * [.getDefaultDevice()](#module_DeviceManager.DeviceManager+getDefaultDevice) ⇒ <code>Promise.&lt;object&gt;</code>
        * [.findDeviceByName(deviceName, [exactMatch])](#module_DeviceManager.DeviceManager+findDeviceByName) ⇒ <code>Promise.&lt;(object\|null)&gt;</code>
        * [.validateDeviceCapabilities(device, requirements)](#module_DeviceManager.DeviceManager+validateDeviceCapabilities) ⇒ <code>object</code>
        * [.getPortAudio()](#module_DeviceManager.DeviceManager+getPortAudio) ⇒ <code>Promise.&lt;object&gt;</code>

<a name="module_DeviceManager.DeviceManager"></a>

### DeviceManager.DeviceManager
DeviceManager handles audio device discovery and selection.Supports robust device selection across all PortAudio device types.

**Kind**: static class of [<code>DeviceManager</code>](#module_DeviceManager)  
**Author**: zevinDev  

* [.DeviceManager](#module_DeviceManager.DeviceManager)
    * [._initPortAudio()](#module_DeviceManager.DeviceManager+_initPortAudio) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.listOutputDevices()](#module_DeviceManager.DeviceManager+listOutputDevices) ⇒ <code>Promise.&lt;Array.&lt;{index: number, name: string, maxOutputChannels: number, defaultSampleRate: number}&gt;&gt;</code>
    * [.setOutputDevice(deviceIndex)](#module_DeviceManager.DeviceManager+setOutputDevice) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.getCurrentDevice()](#module_DeviceManager.DeviceManager+getCurrentDevice) ⇒ <code>object</code> \| <code>null</code>
    * [.getDefaultDevice()](#module_DeviceManager.DeviceManager+getDefaultDevice) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.findDeviceByName(deviceName, [exactMatch])](#module_DeviceManager.DeviceManager+findDeviceByName) ⇒ <code>Promise.&lt;(object\|null)&gt;</code>
    * [.validateDeviceCapabilities(device, requirements)](#module_DeviceManager.DeviceManager+validateDeviceCapabilities) ⇒ <code>object</code>
    * [.getPortAudio()](#module_DeviceManager.DeviceManager+getPortAudio) ⇒ <code>Promise.&lt;object&gt;</code>

<a name="module_DeviceManager.DeviceManager+_initPortAudio"></a>

#### deviceManager.\_initPortAudio() ⇒ <code>Promise.&lt;void&gt;</code>
Initialize PortAudio and cache reference.

**Kind**: instance method of [<code>DeviceManager</code>](#module_DeviceManager.DeviceManager)  
**Throws**:

- <code>Error</code> If PortAudio is not available

**Author**: zevinDev  
<a name="module_DeviceManager.DeviceManager+listOutputDevices"></a>

#### deviceManager.listOutputDevices() ⇒ <code>Promise.&lt;Array.&lt;{index: number, name: string, maxOutputChannels: number, defaultSampleRate: number}&gt;&gt;</code>
List available PortAudio output devices.

**Kind**: instance method of [<code>DeviceManager</code>](#module_DeviceManager.DeviceManager)  
**Throws**:

- <code>Error</code> If device listing fails

**Author**: zevinDev  
<a name="module_DeviceManager.DeviceManager+setOutputDevice"></a>

#### deviceManager.setOutputDevice(deviceIndex) ⇒ <code>Promise.&lt;object&gt;</code>
Set the output device for playback.Device selection is robust across all PortAudio device types (WASAPI, ASIO, CoreAudio, ALSA, etc.).Throws if device is not found or not output-capable (maxOutputChannels > 0).

**Kind**: instance method of [<code>DeviceManager</code>](#module_DeviceManager.DeviceManager)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Selected device info  
**Throws**:

- <code>Error</code> If device is not found or not output-capable

**Emits**: <code>DeviceManager#event:deviceChange</code>, <code>DeviceManager#event:deviceError</code>  
**Platform**: Windows: WASAPI/ASIO/DirectSound; macOS: CoreAudio; Linux: ALSA/PulseAudio/JACK  
**Author**: zevinDev  

| Param | Type | Description |
| --- | --- | --- |
| deviceIndex | <code>number</code> | Device index |

<a name="module_DeviceManager.DeviceManager+getCurrentDevice"></a>

#### deviceManager.getCurrentDevice() ⇒ <code>object</code> \| <code>null</code>
Get the currently selected output device.

**Kind**: instance method of [<code>DeviceManager</code>](#module_DeviceManager.DeviceManager)  
**Returns**: <code>object</code> \| <code>null</code> - Current output device info  
**Author**: zevinDev  
<a name="module_DeviceManager.DeviceManager+getDefaultDevice"></a>

#### deviceManager.getDefaultDevice() ⇒ <code>Promise.&lt;object&gt;</code>
Get the default output device.

**Kind**: instance method of [<code>DeviceManager</code>](#module_DeviceManager.DeviceManager)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Default output device info  
**Throws**:

- <code>Error</code> If no default device found

**Author**: zevinDev  
<a name="module_DeviceManager.DeviceManager+findDeviceByName"></a>

#### deviceManager.findDeviceByName(deviceName, [exactMatch]) ⇒ <code>Promise.&lt;(object\|null)&gt;</code>
Find device by name (partial or exact match).

**Kind**: instance method of [<code>DeviceManager</code>](#module_DeviceManager.DeviceManager)  
**Returns**: <code>Promise.&lt;(object\|null)&gt;</code> - Found device or null  
**Author**: zevinDev  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| deviceName | <code>string</code> |  | Device name to search for |
| [exactMatch] | <code>boolean</code> | <code>false</code> | Whether to require exact match |

<a name="module_DeviceManager.DeviceManager+validateDeviceCapabilities"></a>

#### deviceManager.validateDeviceCapabilities(device, requirements) ⇒ <code>object</code>
Validate device capabilities for playback requirements.

**Kind**: instance method of [<code>DeviceManager</code>](#module_DeviceManager.DeviceManager)  
**Returns**: <code>object</code> - Validation result with capabilities and warnings  
**Author**: zevinDev  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| device | <code>object</code> |  | Device to validate |
| requirements | <code>object</code> |  | Playback requirements |
| [requirements.minChannels] | <code>number</code> | <code>2</code> | Minimum required channels |
| [requirements.preferredSampleRate] | <code>number</code> |  | Preferred sample rate |

<a name="module_DeviceManager.DeviceManager+getPortAudio"></a>

#### deviceManager.getPortAudio() ⇒ <code>Promise.&lt;object&gt;</code>
Get PortAudio instance for use by other components.

**Kind**: instance method of [<code>DeviceManager</code>](#module_DeviceManager.DeviceManager)  
**Returns**: <code>Promise.&lt;object&gt;</code> - PortAudio instance  
**Author**: zevinDev  
<a name="module_PlaylistManager"></a>

## PlaylistManager
Manages playlist operations including shuffle, repeat, and navigation

**Author**: zevinDev  

* [PlaylistManager](#module_PlaylistManager)
    * [.PlaylistManager](#module_PlaylistManager.PlaylistManager)
        * [.loadPlaylist(playlist)](#module_PlaylistManager.PlaylistManager+loadPlaylist)
        * [.setPlaylistShuffle([enable])](#module_PlaylistManager.PlaylistManager+setPlaylistShuffle)
        * [.setPlaylistRepeat(mode)](#module_PlaylistManager.PlaylistManager+setPlaylistRepeat)
        * [.getCurrentTrack()](#module_PlaylistManager.PlaylistManager+getCurrentTrack) ⇒ <code>string</code> \| <code>null</code>
        * [.navigateNext()](#module_PlaylistManager.PlaylistManager+navigateNext) ⇒ <code>object</code>
        * [.navigatePrevious()](#module_PlaylistManager.PlaylistManager+navigatePrevious) ⇒ <code>object</code>
        * [.jumpToTrack(index)](#module_PlaylistManager.PlaylistManager+jumpToTrack) ⇒ <code>string</code> \| <code>null</code>
        * [.getPlaylistStatus()](#module_PlaylistManager.PlaylistManager+getPlaylistStatus) ⇒ <code>object</code>
        * [.stopPlaylist()](#module_PlaylistManager.PlaylistManager+stopPlaylist)
        * [.clearPlaylist()](#module_PlaylistManager.PlaylistManager+clearPlaylist)
        * [.addTracks(tracks, [insertIndex])](#module_PlaylistManager.PlaylistManager+addTracks)
        * [.removeTracks(indices)](#module_PlaylistManager.PlaylistManager+removeTracks)
        * [.isPlaylistActive()](#module_PlaylistManager.PlaylistManager+isPlaylistActive) ⇒ <code>boolean</code>
        * [.getPlaylistCopy()](#module_PlaylistManager.PlaylistManager+getPlaylistCopy) ⇒ <code>Array.&lt;string&gt;</code>

<a name="module_PlaylistManager.PlaylistManager"></a>

### PlaylistManager.PlaylistManager
PlaylistManager handles playlist state, navigation, and playback modes.Supports shuffle, repeat modes, and efficient playlist operations.

**Kind**: static class of [<code>PlaylistManager</code>](#module_PlaylistManager)  
**Author**: zevinDev  

* [.PlaylistManager](#module_PlaylistManager.PlaylistManager)
    * [.loadPlaylist(playlist)](#module_PlaylistManager.PlaylistManager+loadPlaylist)
    * [.setPlaylistShuffle([enable])](#module_PlaylistManager.PlaylistManager+setPlaylistShuffle)
    * [.setPlaylistRepeat(mode)](#module_PlaylistManager.PlaylistManager+setPlaylistRepeat)
    * [.getCurrentTrack()](#module_PlaylistManager.PlaylistManager+getCurrentTrack) ⇒ <code>string</code> \| <code>null</code>
    * [.navigateNext()](#module_PlaylistManager.PlaylistManager+navigateNext) ⇒ <code>object</code>
    * [.navigatePrevious()](#module_PlaylistManager.PlaylistManager+navigatePrevious) ⇒ <code>object</code>
    * [.jumpToTrack(index)](#module_PlaylistManager.PlaylistManager+jumpToTrack) ⇒ <code>string</code> \| <code>null</code>
    * [.getPlaylistStatus()](#module_PlaylistManager.PlaylistManager+getPlaylistStatus) ⇒ <code>object</code>
    * [.stopPlaylist()](#module_PlaylistManager.PlaylistManager+stopPlaylist)
    * [.clearPlaylist()](#module_PlaylistManager.PlaylistManager+clearPlaylist)
    * [.addTracks(tracks, [insertIndex])](#module_PlaylistManager.PlaylistManager+addTracks)
    * [.removeTracks(indices)](#module_PlaylistManager.PlaylistManager+removeTracks)
    * [.isPlaylistActive()](#module_PlaylistManager.PlaylistManager+isPlaylistActive) ⇒ <code>boolean</code>
    * [.getPlaylistCopy()](#module_PlaylistManager.PlaylistManager+getPlaylistCopy) ⇒ <code>Array.&lt;string&gt;</code>

<a name="module_PlaylistManager.PlaylistManager+loadPlaylist"></a>

#### playlistManager.loadPlaylist(playlist)
Load a new playlist.

**Kind**: instance method of [<code>PlaylistManager</code>](#module_PlaylistManager.PlaylistManager)  
**Throws**:

- <code>Error</code> If playlist is invalid

**Author**: zevinDev  

| Param | Type | Description |
| --- | --- | --- |
| playlist | <code>Array.&lt;string&gt;</code> | Array of file paths |

<a name="module_PlaylistManager.PlaylistManager+setPlaylistShuffle"></a>

#### playlistManager.setPlaylistShuffle([enable])
Enable or disable shuffle mode for playlists.

**Kind**: instance method of [<code>PlaylistManager</code>](#module_PlaylistManager.PlaylistManager)  
**Author**: zevinDev  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [enable] | <code>boolean</code> | <code>true</code> | Enable shuffle if true |

<a name="module_PlaylistManager.PlaylistManager+setPlaylistRepeat"></a>

#### playlistManager.setPlaylistRepeat(mode)
Set repeat mode for playlists.

**Kind**: instance method of [<code>PlaylistManager</code>](#module_PlaylistManager.PlaylistManager)  
**Throws**:

- <code>Error</code> If invalid repeat mode

**Author**: zevinDev  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| mode | <code>&#x27;off&#x27;</code> \| <code>&#x27;one&#x27;</code> \| <code>&#x27;all&#x27;</code> | <code>off</code> | Repeat mode |

<a name="module_PlaylistManager.PlaylistManager+getCurrentTrack"></a>

#### playlistManager.getCurrentTrack() ⇒ <code>string</code> \| <code>null</code>
Get the current track from the playlist.

**Kind**: instance method of [<code>PlaylistManager</code>](#module_PlaylistManager.PlaylistManager)  
**Returns**: <code>string</code> \| <code>null</code> - Current track path or null if no playlist active  
**Author**: zevinDev  
<a name="module_PlaylistManager.PlaylistManager+navigateNext"></a>

#### playlistManager.navigateNext() ⇒ <code>object</code>
Navigate to the next track in the playlist.Respects shuffle and repeat settings.

**Kind**: instance method of [<code>PlaylistManager</code>](#module_PlaylistManager.PlaylistManager)  
**Returns**: <code>object</code> - Navigation result  
**Author**: zevinDev  
<a name="module_PlaylistManager.PlaylistManager+navigatePrevious"></a>

#### playlistManager.navigatePrevious() ⇒ <code>object</code>
Navigate to the previous track in the playlist.

**Kind**: instance method of [<code>PlaylistManager</code>](#module_PlaylistManager.PlaylistManager)  
**Returns**: <code>object</code> - Navigation result  
**Author**: zevinDev  
<a name="module_PlaylistManager.PlaylistManager+jumpToTrack"></a>

#### playlistManager.jumpToTrack(index) ⇒ <code>string</code> \| <code>null</code>
Jump to a specific track index in the playlist.

**Kind**: instance method of [<code>PlaylistManager</code>](#module_PlaylistManager.PlaylistManager)  
**Returns**: <code>string</code> \| <code>null</code> - Track at the specified index  
**Throws**:

- <code>Error</code> If index is invalid

**Author**: zevinDev  

| Param | Type | Description |
| --- | --- | --- |
| index | <code>number</code> | Track index to jump to |

<a name="module_PlaylistManager.PlaylistManager+getPlaylistStatus"></a>

#### playlistManager.getPlaylistStatus() ⇒ <code>object</code>
Get playlist status and information.

**Kind**: instance method of [<code>PlaylistManager</code>](#module_PlaylistManager.PlaylistManager)  
**Returns**: <code>object</code> - Playlist status  
**Author**: zevinDev  
<a name="module_PlaylistManager.PlaylistManager+stopPlaylist"></a>

#### playlistManager.stopPlaylist()
Stop playlist playback and clear state.

**Kind**: instance method of [<code>PlaylistManager</code>](#module_PlaylistManager.PlaylistManager)  
**Author**: zevinDev  
<a name="module_PlaylistManager.PlaylistManager+clearPlaylist"></a>

#### playlistManager.clearPlaylist()
Clear playlist without affecting current playback state.

**Kind**: instance method of [<code>PlaylistManager</code>](#module_PlaylistManager.PlaylistManager)  
**Author**: zevinDev  
<a name="module_PlaylistManager.PlaylistManager+addTracks"></a>

#### playlistManager.addTracks(tracks, [insertIndex])
Add tracks to the current playlist.

**Kind**: instance method of [<code>PlaylistManager</code>](#module_PlaylistManager.PlaylistManager)  
**Author**: zevinDev  

| Param | Type | Description |
| --- | --- | --- |
| tracks | <code>Array.&lt;string&gt;</code> | Array of track paths to add |
| [insertIndex] | <code>number</code> | Index to insert at (appends if not specified) |

<a name="module_PlaylistManager.PlaylistManager+removeTracks"></a>

#### playlistManager.removeTracks(indices)
Remove tracks from the playlist.

**Kind**: instance method of [<code>PlaylistManager</code>](#module_PlaylistManager.PlaylistManager)  
**Author**: zevinDev  

| Param | Type | Description |
| --- | --- | --- |
| indices | <code>Array.&lt;number&gt;</code> | Array of indices to remove |

<a name="module_PlaylistManager.PlaylistManager+isPlaylistActive"></a>

#### playlistManager.isPlaylistActive() ⇒ <code>boolean</code>
Check if the playlist is currently active.

**Kind**: instance method of [<code>PlaylistManager</code>](#module_PlaylistManager.PlaylistManager)  
**Returns**: <code>boolean</code> - True if playlist is active  
**Author**: zevinDev  
<a name="module_PlaylistManager.PlaylistManager+getPlaylistCopy"></a>

#### playlistManager.getPlaylistCopy() ⇒ <code>Array.&lt;string&gt;</code>
Get a copy of the current playlist.

**Kind**: instance method of [<code>PlaylistManager</code>](#module_PlaylistManager.PlaylistManager)  
**Returns**: <code>Array.&lt;string&gt;</code> - Copy of the playlist  
**Author**: zevinDev  
<a name="module_StreamManager"></a>

## StreamManager
Manages HTTP/HTTPS streaming with buffering, reconnection, and error handling

**Author**: zevinDev  

* [StreamManager](#module_StreamManager)
    * [.StreamManager](#module_StreamManager.StreamManager)
        * [.playStream(url, options)](#module_StreamManager.StreamManager+playStream) ⇒ <code>Promise.&lt;void&gt;</code>
        * [.stopStream()](#module_StreamManager.StreamManager+stopStream)
        * [.isStreaming()](#module_StreamManager.StreamManager+isStreaming) ⇒ <code>boolean</code>
        * [.cleanup()](#module_StreamManager.StreamManager+cleanup)

<a name="module_StreamManager.StreamManager"></a>

### StreamManager.StreamManager
StreamManager handles streaming audio from HTTP/HTTPS URLs.Provides robust buffering, error handling, reconnection, and partial playback support.

**Kind**: static class of [<code>StreamManager</code>](#module_StreamManager)  
**Author**: zevinDev  

* [.StreamManager](#module_StreamManager.StreamManager)
    * [.playStream(url, options)](#module_StreamManager.StreamManager+playStream) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.stopStream()](#module_StreamManager.StreamManager+stopStream)
    * [.isStreaming()](#module_StreamManager.StreamManager+isStreaming) ⇒ <code>boolean</code>
    * [.cleanup()](#module_StreamManager.StreamManager+cleanup)

<a name="module_StreamManager.StreamManager+playStream"></a>

#### streamManager.playStream(url, options) ⇒ <code>Promise.&lt;void&gt;</code>
Play from a streaming source with robust error handling and reconnection.

**Kind**: instance method of [<code>StreamManager</code>](#module_StreamManager.StreamManager)  
**Throws**:

- <code>Error</code> If streaming fails after all retries

**Author**: zevinDev  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| url | <code>string</code> |  | Streaming source URL (http(s) or file) |
| options | <code>object</code> |  | Streaming options |
| options.ffmpegPath | <code>string</code> |  | Path to ffmpeg binary |
| options.portaudio | <code>object</code> |  | PortAudio instance |
| options.audioStream | <code>object</code> |  | Audio stream for output |
| options.outputDevice | <code>object</code> |  | Output device info |
| [options.bufferSize] | <code>number</code> |  | Buffer size for audio |
| [options.maxRetries] | <code>number</code> | <code>5</code> | Maximum retry attempts |
| [options.backoffBaseMs] | <code>number</code> | <code>500</code> | Base backoff time in ms |
| [options.bufferSizeBytes] | <code>number</code> | <code>128*1024</code> | Stream buffer size in bytes |
| [options.visualizationCallback] | <code>function</code> |  | Callback for PCM data |
| [options.emitter] | <code>function</code> |  | Event emitter for events |

<a name="module_StreamManager.StreamManager+stopStream"></a>

#### streamManager.stopStream()
Stop the current stream.

**Kind**: instance method of [<code>StreamManager</code>](#module_StreamManager.StreamManager)  
**Author**: zevinDev  
<a name="module_StreamManager.StreamManager+isStreaming"></a>

#### streamManager.isStreaming() ⇒ <code>boolean</code>
Check if currently streaming.

**Kind**: instance method of [<code>StreamManager</code>](#module_StreamManager.StreamManager)  
**Returns**: <code>boolean</code> - True if streaming is active  
**Author**: zevinDev  
<a name="module_StreamManager.StreamManager+cleanup"></a>

#### streamManager.cleanup()
Clean up all streaming resources.

**Kind**: instance method of [<code>StreamManager</code>](#module_StreamManager.StreamManager)  
**Author**: zevinDev  
<a name="module_Zeaker"></a>

## Zeaker
Node.js Lossless Audio Player (PortAudio + FFmpeg) - Modular Entry Point

**Author**: zevinDev  
<a name="module_AudioUtils"></a>

## AudioUtils
Audio processing and format utilities

**Author**: zevinDev  

* [AudioUtils](#module_AudioUtils)
    * [.negotiateAudioFormat(trackInfo, deviceInfo, [portaudio])](#module_AudioUtils.negotiateAudioFormat) ⇒ <code>object</code>
    * [.scalePCMVolume(buffer, volume)](#module_AudioUtils.scalePCMVolume) ⇒ <code>Buffer</code>
    * [.mixCrossfade(currentBuffers, nextBuffers, crossfadeFrames, channels, [curve])](#module_AudioUtils.mixCrossfade) ⇒ <code>Array.&lt;Buffer&gt;</code>
    * [.shuffleArray(arr)](#module_AudioUtils.shuffleArray) ⇒ <code>Array</code>
    * [.validateCrossfadeCurve(curve)](#module_AudioUtils.validateCrossfadeCurve) ⇒ <code>string</code>
    * [.durationToFrames(durationSeconds, sampleRate)](#module_AudioUtils.durationToFrames) ⇒ <code>number</code>
    * [.getFrameSize(channels, [format])](#module_AudioUtils.getFrameSize) ⇒ <code>number</code>

<a name="module_AudioUtils.negotiateAudioFormat"></a>

### AudioUtils.negotiateAudioFormat(trackInfo, deviceInfo, [portaudio]) ⇒ <code>object</code>
Negotiate the optimal output format between track and device capabilities, using PortAudio's format support check.

**Kind**: static method of [<code>AudioUtils</code>](#module_AudioUtils)  
**Returns**: <code>object</code> - Negotiated format and required conversions  
**Author**: zevinDev  

| Param | Type | Description |
| --- | --- | --- |
| trackInfo | <code>object</code> | Track information |
| trackInfo.sampleRate | <code>number</code> | Track sample rate |
| trackInfo.channels | <code>number</code> | Track channel count |
| deviceInfo | <code>object</code> | Device information |
| deviceInfo.defaultSampleRate | <code>number</code> | Device default sample rate |
| deviceInfo.maxOutputChannels | <code>number</code> | Device max output channels |
| [portaudio] | <code>object</code> | PortAudio binding instance (must provide isOutputFormatSupported) |

**Example**  
```js
// Returns { sampleRate, channels, needsResampling, needsRemixing, originalSampleRate, originalChannels, supported }negotiateAudioFormat({ sampleRate: 44100, channels: 2 }, device, portaudio)
```
<a name="module_AudioUtils.scalePCMVolume"></a>

### AudioUtils.scalePCMVolume(buffer, volume) ⇒ <code>Buffer</code>
Scale PCM float32le buffer by volume (software gain).

**Kind**: static method of [<code>AudioUtils</code>](#module_AudioUtils)  
**Returns**: <code>Buffer</code> - Scaled PCM buffer  
**Author**: zevinDev  

| Param | Type | Description |
| --- | --- | --- |
| buffer | <code>Buffer</code> | PCM buffer (float32le format) |
| volume | <code>number</code> | Volume multiplier (0.0-1.0) |

<a name="module_AudioUtils.mixCrossfade"></a>

### AudioUtils.mixCrossfade(currentBuffers, nextBuffers, crossfadeFrames, channels, [curve]) ⇒ <code>Array.&lt;Buffer&gt;</code>
Mix two PCM buffer arrays for crossfade effects.Supports multiple crossfade curves: linear, logarithmic, exponential.

**Kind**: static method of [<code>AudioUtils</code>](#module_AudioUtils)  
**Returns**: <code>Array.&lt;Buffer&gt;</code> - Mixed PCM buffers  
**Author**: zevinDev  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| currentBuffers | <code>Array.&lt;Buffer&gt;</code> |  | PCM buffers from current track |
| nextBuffers | <code>Array.&lt;Buffer&gt;</code> |  | PCM buffers from next track |
| crossfadeFrames | <code>number</code> |  | Number of frames to crossfade |
| channels | <code>number</code> |  | Number of audio channels |
| [curve] | <code>string</code> | <code>&quot;&#x27;linear&#x27;&quot;</code> | Crossfade curve type |

<a name="module_AudioUtils.shuffleArray"></a>

### AudioUtils.shuffleArray(arr) ⇒ <code>Array</code>
Fisher-Yates shuffle algorithm for arrays.

**Kind**: static method of [<code>AudioUtils</code>](#module_AudioUtils)  
**Returns**: <code>Array</code> - Shuffled array (new copy)  
**Author**: zevinDev  

| Param | Type | Description |
| --- | --- | --- |
| arr | <code>Array</code> | Array to shuffle |

<a name="module_AudioUtils.validateCrossfadeCurve"></a>

### AudioUtils.validateCrossfadeCurve(curve) ⇒ <code>string</code>
Validate crossfade curve parameter.

**Kind**: static method of [<code>AudioUtils</code>](#module_AudioUtils)  
**Returns**: <code>string</code> - Normalized curve name  
**Throws**:

- <code>Error</code> If curve is invalid

**Author**: zevinDev  

| Param | Type | Description |
| --- | --- | --- |
| curve | <code>string</code> | Curve name to validate |

<a name="module_AudioUtils.durationToFrames"></a>

### AudioUtils.durationToFrames(durationSeconds, sampleRate) ⇒ <code>number</code>
Calculate the number of frames for a given duration and sample rate.

**Kind**: static method of [<code>AudioUtils</code>](#module_AudioUtils)  
**Returns**: <code>number</code> - Number of frames  
**Author**: zevinDev  

| Param | Type | Description |
| --- | --- | --- |
| durationSeconds | <code>number</code> | Duration in seconds |
| sampleRate | <code>number</code> | Sample rate in Hz |

<a name="module_AudioUtils.getFrameSize"></a>

### AudioUtils.getFrameSize(channels, [format]) ⇒ <code>number</code>
Get frame size in bytes for given format.

**Kind**: static method of [<code>AudioUtils</code>](#module_AudioUtils)  
**Returns**: <code>number</code> - Frame size in bytes  
**Author**: zevinDev  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| channels | <code>number</code> |  | Number of channels |
| [format] | <code>string</code> | <code>&quot;&#x27;f32le&#x27;&quot;</code> | Audio format |

<a name="module_ErrorHandler"></a>

## ErrorHandler
Centralized error handling utilities for the audio player

**Author**: zevinDev  

* [ErrorHandler](#module_ErrorHandler)
    * [.handleError(error, [context], [emitter])](#module_ErrorHandler.handleError)
    * [.createUserFriendlyMessage(error, context)](#module_ErrorHandler.createUserFriendlyMessage) ⇒ <code>string</code>
    * [.validateParams(params)](#module_ErrorHandler.validateParams)

<a name="module_ErrorHandler.handleError"></a>

### ErrorHandler.handleError(error, [context], [emitter])
Centralized error handler for the module.Provides user-friendly error messages and logging capabilities.

**Kind**: static method of [<code>ErrorHandler</code>](#module_ErrorHandler)  
**Throws**:

- <code>Error</code> Only rethrows if configured to do so

**Author**: zevinDev  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| error | <code>Error</code> |  | The error to handle |
| [context] | <code>string</code> | <code>&quot;&#x27;Unknown&#x27;&quot;</code> | Context where the error occurred |
| [emitter] | <code>function</code> |  | Optional event emitter to emit error events |

<a name="module_ErrorHandler.createUserFriendlyMessage"></a>

### ErrorHandler.createUserFriendlyMessage(error, context) ⇒ <code>string</code>
Creates user-friendly error messages for common audio player errors.

**Kind**: static method of [<code>ErrorHandler</code>](#module_ErrorHandler)  
**Returns**: <code>string</code> - User-friendly error message  
**Author**: zevinDev  

| Param | Type | Description |
| --- | --- | --- |
| error | <code>Error</code> | The original error |
| context | <code>string</code> | Context where the error occurred |

<a name="module_ErrorHandler.validateParams"></a>

### ErrorHandler.validateParams(params)
Validates common audio player parameters and throws appropriate errors.

**Kind**: static method of [<code>ErrorHandler</code>](#module_ErrorHandler)  
**Throws**:

- <code>Error</code> If validation fails

**Author**: zevinDev  

| Param | Type | Description |
| --- | --- | --- |
| params | <code>object</code> | Parameters to validate |
| params.filePath | <code>string</code> | Audio file path |
| params.volume | <code>number</code> | Volume level (0.0-1.0) |
| params.seekPosition | <code>number</code> | Seek position in seconds |
| params.repeatMode | <code>string</code> | Repeat mode ('off', 'one', 'all') |

<a name="module_FFmpegUtils"></a>

## FFmpegUtils
FFmpeg-related utilities for audio processing

**Author**: zevinDev  

* [FFmpegUtils](#module_FFmpegUtils)
    * [.locateFFmpeg()](#module_FFmpegUtils.locateFFmpeg) ⇒ <code>Promise.&lt;string&gt;</code>
    * [.locateFFprobe()](#module_FFmpegUtils.locateFFprobe) ⇒ <code>Promise.&lt;string&gt;</code>
    * [.buildFFmpegArgs(options)](#module_FFmpegUtils.buildFFmpegArgs) ⇒ <code>Array.&lt;string&gt;</code>
    * [.extractMetadata(filePath, [ffmpegPath])](#module_FFmpegUtils.extractMetadata) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.getAudioInfo(filePath, [ffprobePath])](#module_FFmpegUtils.getAudioInfo) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.createFFmpegProcess(ffmpegPath, args, [options])](#module_FFmpegUtils.createFFmpegProcess) ⇒ <code>ChildProcess</code>
    * [.killFFmpegProcess(process, [signal])](#module_FFmpegUtils.killFFmpegProcess)

<a name="module_FFmpegUtils.locateFFmpeg"></a>

### FFmpegUtils.locateFFmpeg() ⇒ <code>Promise.&lt;string&gt;</code>
Locate the ffmpeg binary for the current platform.

**Kind**: static method of [<code>FFmpegUtils</code>](#module_FFmpegUtils)  
**Returns**: <code>Promise.&lt;string&gt;</code> - Path to ffmpeg binary  
**Throws**:

- <code>Error</code> If ffmpeg binary is not found

**Author**: zevinDev  
<a name="module_FFmpegUtils.locateFFprobe"></a>

### FFmpegUtils.locateFFprobe() ⇒ <code>Promise.&lt;string&gt;</code>
Locate the ffprobe binary for the current platform.

**Kind**: static method of [<code>FFmpegUtils</code>](#module_FFmpegUtils)  
**Returns**: <code>Promise.&lt;string&gt;</code> - Path to ffprobe binary  
**Throws**:

- <code>Error</code> If ffprobe binary is not found

**Author**: zevinDev  
<a name="module_FFmpegUtils.buildFFmpegArgs"></a>

### FFmpegUtils.buildFFmpegArgs(options) ⇒ <code>Array.&lt;string&gt;</code>
Build FFmpeg arguments for audio conversion.

**Kind**: static method of [<code>FFmpegUtils</code>](#module_FFmpegUtils)  
**Returns**: <code>Array.&lt;string&gt;</code> - FFmpeg arguments array  
**Author**: zevinDev  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> |  | Conversion options |
| options.input | <code>string</code> |  | Input file path or 'pipe:0' for stdin |
| options.output | <code>string</code> |  | Output destination or 'pipe:1' for stdout |
| [options.sampleRate] | <code>number</code> | <code>44100</code> | Target sample rate |
| [options.channels] | <code>number</code> | <code>2</code> | Target number of channels |
| [options.format] | <code>string</code> | <code>&quot;&#x27;f32le&#x27;&quot;</code> | Output format |
| [options.codec] | <code>string</code> | <code>&quot;&#x27;pcm_f32le&#x27;&quot;</code> | Audio codec |
| [options.seekPosition] | <code>number</code> |  | Seek position in seconds |

<a name="module_FFmpegUtils.extractMetadata"></a>

### FFmpegUtils.extractMetadata(filePath, [ffmpegPath]) ⇒ <code>Promise.&lt;Object&gt;</code>
Extract metadata from an audio file using ffmpeg.

**Kind**: static method of [<code>FFmpegUtils</code>](#module_FFmpegUtils)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - Metadata object (title, artist, album, duration, etc.)  
**Throws**:

- <code>Error</code> If extraction fails

**Author**: zevinDev  

| Param | Type | Description |
| --- | --- | --- |
| filePath | <code>string</code> | Path to the audio file |
| [ffmpegPath] | <code>string</code> | Path to ffmpeg binary (auto-detected if not provided) |

<a name="module_FFmpegUtils.getAudioInfo"></a>

### FFmpegUtils.getAudioInfo(filePath, [ffprobePath]) ⇒ <code>Promise.&lt;Object&gt;</code>
Get detailed audio stream information from a file.

**Kind**: static method of [<code>FFmpegUtils</code>](#module_FFmpegUtils)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - Audio stream info (sample_rate, channels, etc.)  
**Throws**:

- <code>Error</code> If analysis fails

**Author**: zevinDev  

| Param | Type | Description |
| --- | --- | --- |
| filePath | <code>string</code> | Path to the audio file |
| [ffprobePath] | <code>string</code> | Path to ffprobe binary (auto-detected if not provided) |

<a name="module_FFmpegUtils.createFFmpegProcess"></a>

### FFmpegUtils.createFFmpegProcess(ffmpegPath, args, [options]) ⇒ <code>ChildProcess</code>
Create and configure an FFmpeg process for audio conversion.

**Kind**: static method of [<code>FFmpegUtils</code>](#module_FFmpegUtils)  
**Returns**: <code>ChildProcess</code> - Configured FFmpeg process  
**Author**: zevinDev  

| Param | Type | Description |
| --- | --- | --- |
| ffmpegPath | <code>string</code> | Path to ffmpeg binary |
| args | <code>Array.&lt;string&gt;</code> | FFmpeg arguments |
| [options] | <code>object</code> | Spawn options |

<a name="module_FFmpegUtils.killFFmpegProcess"></a>

### FFmpegUtils.killFFmpegProcess(process, [signal])
Kill an FFmpeg process safely.

**Kind**: static method of [<code>FFmpegUtils</code>](#module_FFmpegUtils)  
**Author**: zevinDev  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| process | <code>ChildProcess</code> |  | FFmpeg process to kill |
| [signal] | <code>string</code> | <code>&quot;&#x27;SIGKILL&#x27;&quot;</code> | Signal to send |

<a name="getAudioStreamInfo"></a>

## getAudioStreamInfo(ffprobePath, filePath) ⇒ <code>Promise.&lt;{sample\_rate: number, channels: number, duration: number}&gt;</code>
Get audio stream info (sample rate, channels) from a file using ffprobe.

**Kind**: global function  
**Returns**: <code>Promise.&lt;{sample\_rate: number, channels: number, duration: number}&gt;</code> - - Audio stream info.  

| Param | Type | Description |
| --- | --- | --- |
| ffprobePath | <code>string</code> | Path to ffprobe executable. |
| filePath | <code>string</code> | Path to audio file. |

