/**
 * @module AudioPlayer
 * @author zevinDev
 * @description Modular Node.js Lossless Audio Player (PortAudio + FFmpeg)
 */

import { EventEmitter } from 'events';
import { DeviceManager } from './DeviceManager.js';
import { PlaylistManager } from './PlaylistManager.js';
import { AudioEffects } from './AudioEffects.js';
import { StreamManager } from './StreamManager.js';
import { locateFFmpeg, extractMetadata, getAudioInfo, buildFFmpegArgs, createFFmpegProcess, killFFmpegProcess } from '../utils/FFmpegUtils.js';
import { negotiateAudioFormat, scalePCMVolume } from '../utils/AudioUtils.js';
import { handleError, validateParams } from '../utils/ErrorHandler.js';

/**
 * AudioPlayer class provides the main API for playback control.
 * Modular design with separate managers for devices, playlists, effects, and streaming.
 * 
 * Emits events: 'play', 'pause', 'resume', 'stop', 'trackEnd', 'playlistEnd', 'error', 'currentTime', 'duration', etc.
 *
 * @event play - Fired when playback starts. Args: (track: string)
 * @event pause - Fired when playback is paused. Args: (track: string)
 * @event resume - Fired when playback resumes. Args: (track: string)
 * @event stop - Fired when playback stops. Args: (track: string)
 * @event trackEnd - Fired when a track finishes. Args: (track: string)
 * @event playlistEnd - Fired when playlist finishes. Args: (playlist: string[])
 * @event error - Fired on playback error. Args: (error: Error)
 * @event currentTime - Fired every 250ms with current playback time. Args: (seconds: number)
 * @event duration - Fired when track duration is available. Args: (duration: number)
 * @event deviceChange, deviceError, streamError, streamReconnect, streamBuffering, bitPerfectChange, volumeChange, crossfadeConfigChange
 *
 * @class
 * @extends EventEmitter
 * @author zevinDev
 * @example
 * import { AudioPlayer } from './src/AudioPlayer.js';
 * const player = new AudioPlayer();
 * player.on('duration', (duration) => console.log('Track duration:', duration));
 * await player.play('track.flac');
 */
export class AudioPlayer extends EventEmitter {
  /**
   * @constructor
   */
  constructor() {
    super();
    
    // Core state
    this._isPlaying = false;
    this._currentTrack = null;
    this._paused = false;
    this._volume = 1.0;
    this._bufferSize = null;
    
    // FFmpeg and PortAudio
    this._ffmpegPath = null;
    this._ffmpegProcess = null;
    this._audioStream = null;
    
    // Visualization and callbacks
    this._visualizationCallback = null;
    
    // Buffer state for async streaming
    this._audioBuffer = [];
    this._audioBufferSize = 0;
    this._ffmpegEnded = false;
    
    // Manager instances (composition pattern)
    this._deviceManager = new DeviceManager();
    this._playlistManager = new PlaylistManager();
    this._audioEffects = new AudioEffects();
    this._streamManager = new StreamManager();
    
    // Debug timing properties
    this._lastCallbackLog = 0;
    this._lastDataLog = 0;
    this._lastSilenceLog = 0;

    // Playback time tracking
    this._framesPlayed = 0;
    this._currentSampleRate = 44100; // default, will be set on play
    this._currentTimeInterval = null;

    // Track duration (in seconds)
    this._currentDuration = null;
    
    // Bind event handlers
    this._setupEventHandlers();
  }

  /**
   * Set up internal event handlers for manager coordination.
   * Forwards device and stream manager events to the AudioPlayer event emitter.
   *
   * @private
   * @author zevinDev
   */
  _setupEventHandlers() {
    // Forward device manager events
    this._deviceManager.on?.('deviceChange', (info) => this.emit('deviceChange', info));
    this._deviceManager.on?.('deviceError', (error) => this.emit('deviceError', error));
    
    // Forward stream manager events
    this._streamManager.on?.('streamError', (error) => this.emit('streamError', error));
    this._streamManager.on?.('streamReconnect', (info) => this.emit('streamReconnect', info));
    this._streamManager.on?.('streamBuffering', (isBuffering) => this.emit('streamBuffering', isBuffering));
  }

  /**
   * Play an audio file using FFmpeg for decoding and PortAudio for output.
   * Uses async streaming with buffer management and robust error handling.
   *
   * @param {string} filePath - Path to the audio file to play.
   * @param {number} [startPosition=0] - Position in seconds to start playback from.
   * @returns {Promise<void>} Resolves when playback starts.
   * @throws {TypeError} If filePath is not a string or startPosition is invalid.
   * @throws {Error} If playback fails or FFmpeg/PortAudio is not available.
   * @author zevinDev
   * @example
   * await player.play('track.flac', 10); // Start at 10 seconds
   */
  async play(filePath, startPosition = 0) {
    try {
      validateParams({ filePath });
      if (typeof startPosition !== 'number' || isNaN(startPosition) || startPosition < 0) startPosition = 0;
      if (this._isPlaying) {
        await this.stop();
      }
      if (!this._ffmpegPath) {
        this._ffmpegPath = await locateFFmpeg();
      }
      const portaudio = await this._deviceManager.getPortAudio();
      if (!portaudio || typeof portaudio.openStreamAsync !== 'function') {
        throw new Error('PortAudio binding or openStreamAsync() not available');
      }
      this._currentTrack = filePath;
      this._isPlaying = true;
      this._paused = false;
      this._audioBuffer = [];
      this._audioBufferSize = 0;
      this._ffmpegEnded = false;
      // Set _framesPlayed based on startPosition and sample rate (will be set below)
      this._framesPlayed = 0;
      this._currentDuration = null;
      const trackInfo = await getAudioInfo(filePath);
      if (trackInfo && typeof trackInfo.duration === 'number') {
        this._currentDuration = trackInfo.duration;
        this.emit('duration', this._currentDuration);
      }
      const currentDevice = this._deviceManager.getCurrentDevice();
      if (!currentDevice) {
        const defaultDevice = await this._deviceManager.getDefaultDevice();
        await this._deviceManager.setOutputDevice(defaultDevice.index);
      }
      const device = this._deviceManager.getCurrentDevice();
      const audioFormat = negotiateAudioFormat(trackInfo, device, portaudio);
      this._currentSampleRate = audioFormat.sampleRate;
      // Set _framesPlayed based on startPosition and sample rate
      this._framesPlayed = Math.floor(startPosition * this._currentSampleRate);
      
      // Create FFmpeg process with fast startup flags
      const ffmpegArgs = buildFFmpegArgs({
        input: filePath,
        sampleRate: audioFormat.sampleRate,
        channels: audioFormat.channels,
        seekPosition: startPosition,
        // Fast startup flags to reduce FFmpeg pre-scan time
        extra: [
          '-nostdin',
          '-hide_banner',
          '-analyzeduration', '32k',
          '-probesize', '32k',
          '-read_ahead_limit', '0'
        ]
      });
      
      const ffmpeg = createFFmpegProcess(this._ffmpegPath, ffmpegArgs);
      this._ffmpegProcess = ffmpeg;
      
      // Set up PCM streaming queue instead of prebuffering entire track
      let pcmQueue = [];
      let ffmpegEnded = false;

      ffmpeg.stdout.on('data', chunk => {
        pcmQueue.push(chunk);
        if (this._visualizationCallback) {
          try {
            this._visualizationCallback(chunk);
          } catch (error) {
            console.warn('[AudioPlayer] Visualization callback error:', error.message);
          }
        }
      });
      
      ffmpeg.stderr.on('data', data => {
        // Log FFmpeg errors if needed
        console.warn('[AudioPlayer] FFmpeg stderr:', data.toString());
      });
      
      ffmpeg.on('close', code => {
        ffmpegEnded = true;
        this._ffmpegEnded = true;
        if (code !== 0) {
          console.warn('[AudioPlayer] FFmpeg exited with code:', code);
        }
      });
      
      ffmpeg.on('error', err => {
        this._isPlaying = false;
        this.emit('error', err);
        handleError(err, 'play/ffmpeg', this);
      });
      
      // Set up PortAudio stream
      const framesPerBuffer = this._bufferSize ?? 2048;
      const streamOpts = {
        device: device.index,
        channels: audioFormat.channels,
        sampleRate: audioFormat.sampleRate,
        framesPerBuffer
      };
      
      // Audio callback for PortAudio (new pattern: return buffer)
      const audioCallback = () => {
        const buffer = new Float32Array(framesPerBuffer * audioFormat.channels);
        try {
          if (!this._isPlaying || this._paused) {
            buffer.fill(0);
            return buffer;
          }
          // Stream PCM data from queue to buffer
          let offset = 0;
          while (pcmQueue.length && offset < buffer.length) {
            const chunk = pcmQueue[0];
            let toCopy = 0;
            if (Buffer.isBuffer(chunk)) {
              toCopy = Math.min(chunk.length / 4, buffer.length - offset);
              for (let i = 0; i < toCopy; ++i) {
                buffer[offset + i] = chunk.readFloatLE(i * 4);
              }
            } else if (chunk instanceof Float32Array) {
              toCopy = Math.min(chunk.length, buffer.length - offset);
              buffer.set(chunk.subarray(0, toCopy), offset);
            } else {
              // Unknown chunk type, skip
              console.warn('[AudioPlayer] Unknown PCM chunk type:', typeof chunk);
              pcmQueue.shift();
              continue;
            }
            offset += toCopy;
            if (toCopy < (Buffer.isBuffer(chunk) ? chunk.length / 4 : chunk.length)) {
              if (Buffer.isBuffer(chunk)) {
                pcmQueue[0] = chunk.slice(toCopy * 4); // bytes
              } else {
                pcmQueue[0] = chunk.subarray(toCopy);
              }
            } else {
              pcmQueue.shift();
            }
          }
          if (offset < buffer.length) {
            buffer.fill(0, offset); // Zero-fill if underrun
          }
          // Apply volume if not in bit-perfect mode and volume is not 1.0
          if (!this._audioEffects.isBitPerfectMode() && this._volume !== 1.0) {
            const volumeBuffer = scalePCMVolume(buffer, this._volume);
            buffer.set(volumeBuffer);
          }
          // Track frames played for currentTime
          this._framesPlayed += framesPerBuffer;
        } catch (err) {
          // Robust: never throw from audio callback
          buffer.fill(0);
          console.error('[AudioPlayer] Exception in audioCallback:', err);
        }
        return buffer;
      };
      
      // Open audio stream
      const streamId = await portaudio.openStreamAsync(streamOpts, audioCallback);
      this._audioStream = streamId;
      
      this.emit('play', filePath);
      // Emit resampleInfo event with original and playback sample rate/channels
      this.emit('resampleInfo', {
        sampleRate: [trackInfo?.sampleRate, audioFormat?.sampleRate],
        bitDepth: [trackInfo?.bitDepth, audioFormat?.bitDepth],
        channels: [trackInfo?.channels, audioFormat?.channels]
      });
      
      // Start currentTime event interval
      if (this._currentTimeInterval) clearInterval(this._currentTimeInterval);
      this._currentTimeInterval = setInterval(() => {
        if (this._isPlaying && !this._paused) {
          this.emit('currentTime', this.getCurrentTime());
        }
      }, 250);
      
      // Monitor for track end
      const checkEnd = () => {
        if (ffmpegEnded && pcmQueue.length === 0) {
          this._isPlaying = false;
          if (this._currentTimeInterval) {
            clearInterval(this._currentTimeInterval);
            this._currentTimeInterval = null;
          }
          this.emit('trackEnd', filePath);
          
          // Handle playlist continuation
          if (this._playlistManager.isPlaylistActive()) {
            this._handlePlaylistNext();
          }
          
          portaudio.closeStream(streamId);
        } else if (this._isPlaying) {
          setTimeout(checkEnd, 100);
        }
      };
      
      checkEnd();
      
    } catch (error) {
      this._isPlaying = false;
      this.emit('error', error);
      handleError(error, 'play', this);
      throw error;
    }
  }

  /**
   * Handle automatic playlist progression.
   * Advances to the next track or emits playlistEnd if finished.
   *
   * @private
   * @returns {Promise<void>}
   * @author zevinDev
   */
  async _handlePlaylistNext() {
    try {
      const result = this._playlistManager.navigateNext();
      if (result.hasNext) {
        await this.play(result.track);
      } else {
        this._playlistManager.stopPlaylist();
        this.emit('playlistEnd', this._playlistManager.getPlaylistCopy());
      }
    } catch (error) {
      handleError(error, 'playlistNext', this);
    }
  }

  /**
   * Pause playback.
   *
   * @returns {Promise<void>} Resolves when playback is paused.
   * @throws {Error} If pause fails.
   * @fires AudioPlayer#pause
   * @author zevinDev
   */
  async pause() {
    try {
      if (!this._isPlaying || this._paused) return;
      
      this._paused = true;
      
      if (this._audioStream && typeof this._audioStream.pause === 'function') {
        this._audioStream.pause();
      }
      if (this._currentTimeInterval) {
        clearInterval(this._currentTimeInterval);
        this._currentTimeInterval = null;
      }
      this.emit('pause', this._currentTrack);
    } catch (error) {
      this.emit('error', error);
      handleError(error, 'pause', this);
      throw error;
    }
  }

  /**
   * Resume playback.
   *
   * @returns {Promise<void>} Resolves when playback resumes.
   * @throws {Error} If resume fails.
   * @fires AudioPlayer#resume
   * @author zevinDev
   */
  async resume() {
    try {
      if (!this._isPlaying || !this._paused) return;
      
      this._paused = false;
      
      if (this._audioStream && typeof this._audioStream.resume === 'function') {
        this._audioStream.resume();
      }
      // Restart currentTime event interval after resume
      if (this._currentTimeInterval) {
        clearInterval(this._currentTimeInterval);
        this._currentTimeInterval = null;
      }
      this._currentTimeInterval = setInterval(() => {
        if (this._isPlaying && !this._paused) {
          this.emit('currentTime', this.getCurrentTime());
        }
      }, 250);
      this.emit('resume', this._currentTrack);
    } catch (error) {
      this.emit('error', error);
      handleError(error, 'resume', this);
      throw error;
    }
  }

  /**
   * Stop playback and clean up resources.
   *
   * @returns {Promise<void>} Resolves when playback is stopped.
   * @throws {Error} If stop fails.
   * @fires AudioPlayer#stop
   * @author zevinDev
   */
  async stop() {
    try {
      this._isPlaying = false;
      this._paused = false;
      const prevTrack = this._currentTrack;
      this._currentTrack = null;
      
      // Clean up buffer state
      this._audioBuffer = [];
      this._audioBufferSize = 0;
      this._ffmpegEnded = false;
      this._framesPlayed = 0;
      if (this._currentTimeInterval) {
        clearInterval(this._currentTimeInterval);
        this._currentTimeInterval = null;
      }
      
      // Terminate ffmpeg process
      if (this._ffmpegProcess) {
        killFFmpegProcess(this._ffmpegProcess);
        this._ffmpegProcess = null;
      }
      
      // Close PortAudio stream
      if (this._audioStream) {
        try {
          const portaudio = await this._deviceManager.getPortAudio();
          if (portaudio && portaudio.closeStream) {
            portaudio.closeStream(this._audioStream);
          }
        } catch (error) {
          console.warn('[AudioPlayer] Error closing audio stream:', error.message);
        }
        this._audioStream = null;
      }
      
      // Clean up audio effects resources
      this._audioEffects.cleanupGapless();
      
      // Clean up streaming resources
      this._streamManager.cleanup();
      
      this.emit('stop', prevTrack);
    } catch (error) {
      this.emit('error', error);
      handleError(error, 'stop', this);
      throw error;
    }
  }

  /**
   * Seek to a specific position in the current track.
   *
   * @param {number} positionSeconds - Position in seconds to seek to.
   * @returns {Promise<void>} Resolves when seek is complete.
   * @throws {Error} If seeking fails or no track loaded.
   * @fires AudioPlayer#seek
   * @author zevinDev
   */
  async seek(positionSeconds) {
    try {
      validateParams({ seekPosition: positionSeconds });
      if (!this._currentTrack) {
        throw new Error('No track loaded.');
      }
      await this.play(this._currentTrack, positionSeconds);
      this.emit('seek', { track: this._currentTrack, position: positionSeconds });
    } catch (error) {
      this.emit('error', error);
      handleError(error, 'seek', this);
      throw error;
    }
  }

  /**
   * Set playback volume.
   *
   * @param {number} level - Volume level between 0.0 and 1.0.
   * @returns {Promise<void>} Resolves when volume is set.
   * @throws {Error} If setting volume fails or in bit-perfect mode.
   * @author zevinDev
   */
  async setVolume(level) {
    try {
      this._audioEffects.validateEffectAvailability('volume');
      validateParams({ volume: level });
      
      this._volume = level;
      
      if (this._audioStream && typeof this._audioStream.setVolume === 'function') {
        this._audioStream.setVolume(level);
      }
      
      this.emit('volumeChange', level);
    } catch (error) {
      this.emit('error', error);
      handleError(error, 'setVolume', this);
      throw error;
    }
  }

  /**
   * Get current volume level.
   *
   * @returns {number} Current volume (0.0-1.0).
   * @author zevinDev
   */
  getVolume() {
    return this._volume;
  }

  /**
   * Extract metadata from the current track.
   *
   * @returns {Promise<Object>} Metadata object for the current track.
   * @throws {Error} If extraction fails or no track loaded.
   * @author zevinDev
   */
  async getMetadata() {
    try {
      if (!this._currentTrack) {
        throw new Error('No track loaded.');
      }
      
      if (!this._ffmpegPath) {
        this._ffmpegPath = await locateFFmpeg();
      }
      const metadata = await extractMetadata(this._currentTrack, this._ffmpegPath);
      if (metadata && typeof metadata.duration === 'number') {
        this._currentDuration = metadata.duration;
        this.emit('duration', this._currentDuration);
      } else if (this._currentDuration != null) {
        metadata.duration = this._currentDuration;
      }
      return metadata;
    } catch (error) {
      handleError(error, 'getMetadata', this);
      throw error;
    }
  }

  /**
   * Get current track duration in seconds.
   *
   * @returns {number|null} Duration in seconds, or null if unknown.
   * @author zevinDev
   */
  getDuration() {
    return this._currentDuration;
  }

  /**
   * Play a playlist of audio files sequentially.
   *
   * @param {string[]} playlist - Array of file paths to play.
   * @returns {Promise<void>} Resolves when playlist starts.
   * @throws {Error} If playlist is invalid or playback fails.
   * @fires AudioPlayer#playlistEnd
   * @author zevinDev
   */
  async playPlaylist(playlist) {
    try {
      this._playlistManager.loadPlaylist(playlist);
      
      // Start with first track
      const firstTrack = this._playlistManager.getCurrentTrack();
      if (firstTrack) {
        await this.play(firstTrack);
      }
    } catch (error) {
      this.emit('error', error);
      handleError(error, 'playPlaylist', this);
      throw error;
    }
  }

  /**
   * Skip to the next track in the playlist.
   *
   * @returns {Promise<void>} Resolves when next track starts.
   * @author zevinDev
   */
  async skip() {
    try {
      if (!this._playlistManager.isPlaylistActive()) return;
      
      const result = this._playlistManager.navigateNext();
      if (result.hasNext) {
        await this.stop();
        await this.play(result.track);
      }
    } catch (error) {
      handleError(error, 'skip', this);
    }
  }

  /**
   * Skip to the previous track in the playlist.
   *
   * @returns {Promise<void>} Resolves when previous track starts.
   * @author zevinDev
   */
  async previous() {
    try {
      if (!this._playlistManager.isPlaylistActive()) return;
      
      const result = this._playlistManager.navigatePrevious();
      if (result.hasPrevious) {
        await this.stop();
        await this.play(result.track);
      }
    } catch (error) {
      handleError(error, 'previous', this);
    }
  }

  /**
   * Stop playlist playback and current track.
   *
   * @returns {void}
   * @author zevinDev
   */
  stopPlaylist() {
    this._playlistManager.stopPlaylist();
    this.stop();
  }

  /**
   * Enable or disable shuffle mode for playlists.
   *
   * @param {boolean} [enable=true] - Enable shuffle if true.
   * @returns {void}
   * @author zevinDev
   */
  setPlaylistShuffle(enable = true) {
    this._playlistManager.setPlaylistShuffle(enable);
  }

  /**
   * Set repeat mode for playlists.
   *
   * @param {'off'|'one'|'all'} mode - Repeat mode.
   * @returns {void}
   * @throws {Error} If invalid repeat mode.
   * @author zevinDev
   */
  setPlaylistRepeat(mode = 'off') {
    this._playlistManager.setPlaylistRepeat(mode);
  }

  /**
   * Enable gapless playback for the next track.
   *
   * @param {string} nextTrack - Path to the next audio file.
   * @returns {Promise<void>} Resolves when gapless transition is set up.
   * @throws {Error} If bit-perfect mode is enabled or no active stream.
   * @author zevinDev
   */
  async playGapless(nextTrack) {
    try {
      this._audioEffects.validateEffectAvailability('gapless');
      
      if (!this._isPlaying || !this._currentTrack) {
        await this.play(nextTrack);
        return;
      }
      
      if (!this._audioStream) {
        throw new Error('No active audio stream for gapless playback.');
      }
      
      // Prebuffer the next track
      const result = await this._audioEffects.prebufferNextTrack(
        nextTrack, 
        this._ffmpegPath,
        { sampleRate: 44100, channels: 2 }
      );
      
      // Wait for the current track to end and seamlessly transition
      this._audioStream.once('finish', async () => {
        const isReady = await this._audioEffects.waitForGaplessReady(2000);
        
        if (!isReady) {
          handleError(new Error('Next track not ready for gapless playback.'), 'playGapless', this);
          return;
        }
        
        const buffers = this._audioEffects.getGaplessBuffers();
        if (buffers) {
          const portaudio = await this._deviceManager.getPortAudio();
          for (const buf of buffers) {
            if (this._visualizationCallback) {
              try {
                this._visualizationCallback(buf);
              } catch (error) {}
            }
            portaudio.writeStream(buf, this._audioStream);
          }
        }
        
        this._currentTrack = nextTrack;
        this.emit('play', nextTrack);
      });
      
    } catch (error) {
      handleError(error, 'playGapless', this);
      throw error;
    }
  }

  /**
   * Crossfade between the current and next track.
   *
   * @param {string} nextTrack - Path to the next audio file.
   * @param {number} [duration=3] - Crossfade duration in seconds.
   * @returns {Promise<void>} Resolves when crossfade is complete.
   * @throws {Error} If bit-perfect mode is enabled or no active stream.
   * @author zevinDev
   */
  async crossfadeTo(nextTrack, duration = 3) {
    try {
      this._audioEffects.validateEffectAvailability('crossfade');
      
      if (!this._isPlaying || !this._currentTrack) {
        await this.play(nextTrack);
        return;
      }
      
      if (!this._audioStream) {
        throw new Error('No active audio stream for crossfade.');
      }
      
      // This is a simplified version - full implementation would require
      // more complex PCM buffer management and mixing
      console.warn('[AudioPlayer] Crossfade implementation simplified in modular version');
      
      // For now, just stop current and play next
      await this.stop();
      await this.play(nextTrack);
      
    } catch (error) {
      handleError(error, 'crossfadeTo', this);
      throw error;
    }
  }

  /**
   * Play from a streaming source (e.g., internet radio).
   *
   * @param {string} url - Streaming source URL.
   * @param {object} [options] - Streaming options.
   * @returns {Promise<void>} Resolves when streaming starts.
   * @throws {Error} If streaming fails.
   * @author zevinDev
   */
  async playStream(url, options = {}) {
    try {
      if (this._isPlaying) {
        await this.stop();
      }
      
      if (!this._ffmpegPath) {
        this._ffmpegPath = await locateFFmpeg();
      }
      
      const portaudio = await this._deviceManager.getPortAudio();
      const outputDevice = this._deviceManager.getCurrentDevice();
      
      const streamOptions = {
        ffmpegPath: this._ffmpegPath,
        portaudio,
        audioStream: this._audioStream,
        outputDevice,
        bufferSize: this._bufferSize,
        visualizationCallback: this._visualizationCallback,
        emitter: this,
        ...options
      };
      
      this._currentTrack = url;
      await this._streamManager.playStream(url, streamOptions);
      
    } catch (error) {
      this.emit('error', error);
      handleError(error, 'playStream', this);
      throw error;
    }
  }

  /**
   * List available PortAudio output devices.
   *
   * @static
   * @returns {Promise<Array>} Array of device objects.
   * @author zevinDev
   */
  static async listOutputDevices() {
    const deviceManager = new DeviceManager();
    return await deviceManager.listOutputDevices();
  }

  /**
   * Set the output device for playback.
   *
   * @param {number} deviceIndex - Device index to use for output.
   * @returns {Promise<void>} Resolves when device is set.
   * @throws {Error} If device is not found or not output-capable.
   * @fires AudioPlayer#deviceChange
   * @author zevinDev
   */
  async setOutputDevice(deviceIndex) {
    try {
      const result = await this._deviceManager.setOutputDevice(deviceIndex);
      
      if (result.changed) {
        this.emit('deviceChange', {
          index: result.device.index,
          name: result.device.name,
          info: result.device
        });
        
        // If currently playing, restart with new device
        if (this._isPlaying) {
          const track = this._currentTrack;
          await this.stop();
          await this.play(track);
        }
      }
    } catch (error) {
      this.emit('deviceError', error);
      handleError(error, 'setOutputDevice', this);
      throw error;
    }
  }

  /**
   * Enable or disable bit-perfect output mode.
   *
   * @param {boolean|object} options - Bit-perfect options or true to enable.
   * @returns {Promise<void>} Resolves when bit-perfect mode is set.
   * @throws {Error} If currently playing and unable to restart.
   * @author zevinDev
   */
  async setBitPerfect(options = true) {
    try {
      const config = this._audioEffects.setBitPerfect(options);
      
      if (config.requiresRestart && this._isPlaying) {
        const track = this._currentTrack;
        await this.stop();
        await this.play(track);
      }
      
      this.emit('bitPerfectChange', config);
    } catch (error) {
      this.emit('error', error);
      handleError(error, 'setBitPerfect', this);
      throw error;
    }
  }

  /**
   * Attach a visualization callback for PCM data.
   *
   * @param {Function} callback - Function to receive PCM data.
   * @returns {void}
   * @author zevinDev
   */
  onVisualization(callback) {
    this._visualizationCallback = callback;
  }

  /**
   * Set buffer size/latency for playback.
   *
   * @param {number} frames - Buffer size in frames.
   * @returns {void}
   * @author zevinDev
   */
  setBufferSize(frames) {
    this._bufferSize = frames;
  }

  /**
   * Set the crossfade duration.
   *
   * @param {number} duration - Duration in seconds.
   * @returns {void}
   * @fires AudioPlayer#crossfadeConfigChange
   * @author zevinDev
   */
  setCrossfadeDuration(duration) {
    this._audioEffects.setCrossfadeDuration(duration);
    const config = this._audioEffects.getCrossfadeConfig();
    this.emit('crossfadeConfigChange', config);
  }

  /**
   * Set the crossfade curve.
   *
   * @param {string} curve - Curve type.
   * @returns {void}
   * @fires AudioPlayer#crossfadeConfigChange
   * @author zevinDev
   */
  setCrossfadeCurve(curve) {
    this._audioEffects.setCrossfadeCurve(curve);
    const config = this._audioEffects.getCrossfadeConfig();
    this.emit('crossfadeConfigChange', config);
  }

  /**
   * Get current playback status.
   *
   * @returns {object} Playback status object with isPlaying, isPaused, currentTrack, etc.
   * @author zevinDev
   */
  getStatus() {
    return {
      isPlaying: this._isPlaying,
      isPaused: this._paused,
      currentTrack: this._currentTrack,
      volume: this._volume,
      bufferSize: this._bufferSize,
      playlist: this._playlistManager.getPlaylistStatus(),
      effects: this._audioEffects.getConfiguration(),
      device: this._deviceManager.getCurrentDevice(),
      streaming: this._streamManager.isStreaming()
    };
  }

  /**
   * Get manager instances for advanced usage.
   *
   * @returns {object} Object containing device, playlist, effects, and stream managers.
   * @author zevinDev
   */
  getManagers() {
    return {
      device: this._deviceManager,
      playlist: this._playlistManager,
      effects: this._audioEffects,
      stream: this._streamManager
    };
  }

  /**
   * Test PortAudio output with a synchronous 440Hz sine wave (2 seconds).
   * Useful for debugging C++/Electron buffer issues.
   *
   * @static
   * @returns {Promise<void>} Resolves when test is complete.
   * @author zevinDev
   */
  static async testSineWave() {
    const deviceManager = new DeviceManager();
    const portaudio = await deviceManager.getPortAudio();
    if (!portaudio || typeof portaudio.openStreamAsync !== 'function') {
      throw new Error('PortAudio binding or openStreamAsync() not available');
    }
    let device = await deviceManager.getCurrentDevice();
    if (!device) {
      device = await deviceManager.getDefaultDevice()
      await deviceManager.setOutputDevice(device.index);
      device = await deviceManager.getCurrentDevice();
    }
    const sampleRate = 44100;
    const channels = 2;
    const durationSec = 2;
    const freq = 440;
    const framesPerBuffer = 256;
    let t = 0;
    const dt = 1 / sampleRate;
    const totalFrames = sampleRate * durationSec;
    let framesPlayed = 0;
    // New pattern: return a new buffer for each callback
    const audioCallback = () => {
      const buffer = new Float32Array(framesPerBuffer * channels);
      for (let i = 0; i < buffer.length; i += channels) {
        const sample = Math.sin(2 * Math.PI * freq * t);
        for (let c = 0; c < channels; ++c) {
          buffer[i + c] = sample;
        }
        t += dt;
      }
      framesPlayed += framesPerBuffer;
      if (framesPlayed >= totalFrames) {
        buffer.fill(0);
      }
      return buffer;
    };
    const streamOpts = {
      device: device.index,
      channels,
      sampleRate,
      framesPerBuffer
    };
    const streamId = await portaudio.openStreamAsync(streamOpts, audioCallback);
    await new Promise(resolve => setTimeout(resolve, durationSec * 1000 + 200));
    portaudio.closeStream(streamId);
  }

  /**
   * Get current playback time in seconds.
   *
   * @returns {number} Elapsed playback time in seconds.
   * @author zevinDev
   */
  getCurrentTime() {
    if (!this._isPlaying) return 0;
    return this._framesPlayed / this._currentSampleRate;
  }
}
