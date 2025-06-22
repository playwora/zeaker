/**
 * @module AudioEffects
 * @author zevinDev
 * @description Advanced audio effects including gapless playback, crossfade, and bit-perfect mode
 */

import { spawn } from 'node:child_process';
import { buildFFmpegArgs, createFFmpegProcess, killFFmpegProcess } from '../utils/FFmpegUtils.js';
import { mixCrossfade, validateCrossfadeCurve, durationToFrames } from '../utils/AudioUtils.js';
import { handleError } from '../utils/ErrorHandler.js';

/**
 * AudioEffects handles advanced audio processing features.
 * Manages gapless playback, crossfade transitions, and bit-perfect mode.
 * 
 * @class
 * @author zevinDev
 */
export class AudioEffects {
  constructor() {
    this._bitPerfect = false;
    this._bitPerfectSampleRate = undefined;
    this._bitPerfectBitDepth = undefined;
    this._crossfadeDuration = 3; // Default crossfade duration in seconds
    this._crossfadeCurve = 'linear'; // Default crossfade curve
    
    // Gapless playback state
    this._gaplessNextFfmpeg = null;
    this._gaplessNextPcmBuffers = null;
    this._gaplessNextTrackReady = false;
  }

  /**
   * Enable or disable bit-perfect output mode.
   * When enabled, disables all PCM manipulation (volume, crossfade, gapless, visualization, etc.).
   * 
   * @param {boolean|object} options - Pass `true` to enable, `false` to disable, or an object:
   *   { enable: boolean, sampleRate?: number, bitDepth?: number }
   * @returns {object} Configuration result
   * @throws {Error} If configuration fails
   * @author zevinDev
   */
  setBitPerfect(options = true) {
    try {
      let enable, sampleRate, bitDepth;
      
      if (typeof options === 'object') {
        enable = !!options.enable;
        sampleRate = options.sampleRate;
        bitDepth = options.bitDepth;
      } else {
        enable = !!options;
      }
      
      this._bitPerfect = enable;
      
      if (enable) {
        if (sampleRate) this._bitPerfectSampleRate = sampleRate;
        if (bitDepth) this._bitPerfectBitDepth = bitDepth;
      } else {
        this._bitPerfectSampleRate = undefined;
        this._bitPerfectBitDepth = undefined;
      }
      
      return {
        enabled: this._bitPerfect,
        sampleRate: this._bitPerfectSampleRate,
        bitDepth: this._bitPerfectBitDepth,
        requiresRestart: true
      };
    } catch (error) {
      handleError(error, 'setBitPerfect');
      throw error;
    }
  }

  /**
   * Check if bit-perfect mode is enabled.
   * 
   * @returns {boolean} True if bit-perfect mode is enabled
   * @author zevinDev
   */
  isBitPerfectMode() {
    return this._bitPerfect;
  }

  /**
   * Set the crossfade duration for crossfade transitions.
   * 
   * @param {number} duration - Crossfade duration in seconds (must be >= 0)
   * @throws {Error} If duration is invalid or in bit-perfect mode
   * @author zevinDev
   */
  setCrossfadeDuration(duration) {
    if (this._bitPerfect) {
      throw new Error('Crossfade is not supported in bit-perfect mode.');
    }
    
    if (typeof duration !== 'number' || !Number.isFinite(duration) || duration < 0) {
      throw new Error('Crossfade duration must be a non-negative number.');
    }
    
    this._crossfadeDuration = duration;
  }

  /**
   * Set the crossfade curve for crossfade transitions.
   * 
   * @param {string} curve - Crossfade curve name
   * @throws {Error} If curve is invalid or in bit-perfect mode
   * @author zevinDev
   */
  setCrossfadeCurve(curve) {
    if (this._bitPerfect) {
      throw new Error('Crossfade is not supported in bit-perfect mode.');
    }
    
    this._crossfadeCurve = validateCrossfadeCurve(curve);
  }

  /**
   * Get current crossfade configuration.
   * 
   * @returns {object} Crossfade configuration
   * @author zevinDev
   */
  getCrossfadeConfig() {
    return {
      duration: this._crossfadeDuration,
      curve: this._crossfadeCurve,
      enabled: !this._bitPerfect
    };
  }

  /**
   * Pre-buffer the next track's PCM data for gapless playback.
   * 
   * @param {string} nextTrack - Path to the next audio file
   * @param {string} ffmpegPath - Path to ffmpeg binary
   * @param {object} [audioFormat] - Audio format settings
   * @returns {Promise<object>} Prebuffering result with buffers and control functions
   * @throws {Error} If prebuffering fails
   * @author zevinDev
   */
  async prebufferNextTrack(nextTrack, ffmpegPath, audioFormat = {}) {
    if (this._bitPerfect) {
      throw new Error('Gapless playback is not supported in bit-perfect mode.');
    }
    
    try {
      const { sampleRate = 44100, channels = 2 } = audioFormat;
      
      const ffmpegArgs = buildFFmpegArgs({
        input: nextTrack,
        sampleRate,
        channels
      });
      
      const nextFfmpeg = createFFmpegProcess(ffmpegPath, ffmpegArgs);
      const nextPcmBuffers = [];
      let nextTrackReady = false;
      let error = null;
      
      nextFfmpeg.stdout.on('data', chunk => {
        nextPcmBuffers.push(chunk);
      });
      
      nextFfmpeg.stderr.on('data', data => {
        console.warn('[AudioEffects] FFmpeg stderr:', data.toString());
      });
      
      nextFfmpeg.on('close', code => {
        nextTrackReady = true;
        if (code !== 0) {
          error = new Error(`FFmpeg exited with code ${code}`);
        }
      });
      
      nextFfmpeg.on('error', err => {
        error = err;
        nextTrackReady = true;
      });
      
      // Store reference for cleanup
      this._gaplessNextFfmpeg = nextFfmpeg;
      this._gaplessNextPcmBuffers = nextPcmBuffers;
      this._gaplessNextTrackReady = () => nextTrackReady;
      
      return {
        buffers: nextPcmBuffers,
        ffmpeg: nextFfmpeg,
        ready: () => nextTrackReady && !error,
        error: () => error,
        cleanup: () => this.cleanupGapless()
      };
    } catch (error) {
      handleError(error, 'prebufferNextTrack');
      throw error;
    }
  }

  /**
   * Create crossfade effect between two tracks.
   * 
   * @param {Buffer[]} currentBuffers - PCM buffers from current track
   * @param {Buffer[]} nextBuffers - PCM buffers from next track
   * @param {number} sampleRate - Audio sample rate
   * @param {number} channels - Number of audio channels
   * @param {number} [duration] - Crossfade duration (uses configured duration if not specified)
   * @returns {Buffer[]} Mixed PCM buffers for crossfade
   * @throws {Error} If crossfade creation fails or bit-perfect mode is enabled
   * @author zevinDev
   */
  createCrossfade(currentBuffers, nextBuffers, sampleRate, channels, duration) {
    if (this._bitPerfect) {
      throw new Error('Crossfade is not supported in bit-perfect mode.');
    }
    
    try {
      const crossfadeDuration = duration || this._crossfadeDuration;
      const crossfadeFrames = durationToFrames(crossfadeDuration, sampleRate);
      
      return mixCrossfade(
        currentBuffers,
        nextBuffers,
        crossfadeFrames,
        channels,
        this._crossfadeCurve
      );
    } catch (error) {
      handleError(error, 'createCrossfade');
      throw error;
    }
  }

  /**
   * Wait for gapless track to be ready with timeout.
   * 
   * @param {number} [timeoutMs=2000] - Timeout in milliseconds
   * @returns {Promise<boolean>} True if ready, false if timeout
   * @author zevinDev
   */
  async waitForGaplessReady(timeoutMs = 2000) {
    if (!this._gaplessNextTrackReady) {
      return false;
    }
    
    const start = Date.now();
    while (!this._gaplessNextTrackReady() && Date.now() - start < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return this._gaplessNextTrackReady();
  }

  /**
   * Get gapless playback buffers if ready.
   * 
   * @returns {Buffer[]|null} PCM buffers or null if not ready
   * @author zevinDev
   */
  getGaplessBuffers() {
    if (this._gaplessNextTrackReady && this._gaplessNextTrackReady()) {
      return this._gaplessNextPcmBuffers;
    }
    return null;
  }

  /**
   * Clean up gapless playback resources.
   * 
   * @author zevinDev
   */
  cleanupGapless() {
    if (this._gaplessNextFfmpeg) {
      killFFmpegProcess(this._gaplessNextFfmpeg);
      this._gaplessNextFfmpeg = null;
    }
    
    this._gaplessNextPcmBuffers = null;
    this._gaplessNextTrackReady = false;
  }

  /**
   * Check if advanced effects are available (not in bit-perfect mode).
   * 
   * @returns {object} Availability status for each effect
   * @author zevinDev
   */
  getEffectAvailability() {
    const available = !this._bitPerfect;
    
    return {
      gapless: available,
      crossfade: available,
      volumeControl: available,
      visualization: available,
      bitPerfect: this._bitPerfect
    };
  }

  /**
   * Validate if an effect can be used in current mode.
   * 
   * @param {string} effectName - Name of the effect to validate
   * @throws {Error} If effect is not available in current mode
   * @author zevinDev
   */
  validateEffectAvailability(effectName) {
    if (this._bitPerfect) {
      const restrictedEffects = ['gapless', 'crossfade', 'volume', 'visualization'];
      if (restrictedEffects.includes(effectName.toLowerCase())) {
        throw new Error(`${effectName} is not supported in bit-perfect mode.`);
      }
    }
  }

  /**
   * Get current audio effects configuration.
   * 
   * @returns {object} Complete effects configuration
   * @author zevinDev
   */
  getConfiguration() {
    return {
      bitPerfect: {
        enabled: this._bitPerfect,
        sampleRate: this._bitPerfectSampleRate,
        bitDepth: this._bitPerfectBitDepth
      },
      crossfade: {
        duration: this._crossfadeDuration,
        curve: this._crossfadeCurve,
        enabled: !this._bitPerfect
      },
      gapless: {
        enabled: !this._bitPerfect,
        hasBufferedTrack: !!this._gaplessNextPcmBuffers
      }
    };
  }
}
