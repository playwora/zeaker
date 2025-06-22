/**
 * @module AudioUtils
 * @author zevinDev
 * @description Audio processing and format utilities
 */

/**
 * Negotiate the optimal output format between track and device capabilities, using PortAudio's format support check.
 *
 * @param {object} trackInfo - Track information
 * @param {number} trackInfo.sampleRate - Track sample rate
 * @param {number} trackInfo.channels - Track channel count
 * @param {object} deviceInfo - Device information
 * @param {number} deviceInfo.defaultSampleRate - Device default sample rate
 * @param {number} deviceInfo.maxOutputChannels - Device max output channels
 * @param {object} [portaudio] - PortAudio binding instance (must provide isOutputFormatSupported)
 * @returns {object} Negotiated format and required conversions
 * @author zevinDev
 * @example
 * // Returns { sampleRate, channels, needsResampling, needsRemixing, originalSampleRate, originalChannels, supported }
 * negotiateAudioFormat({ sampleRate: 44100, channels: 2 }, device, portaudio)
 */
export function negotiateAudioFormat(trackInfo, deviceInfo, portaudio) {
  const { sampleRate: trackSampleRate, channels: trackChannels } = trackInfo;
  const { defaultSampleRate: deviceSampleRate, maxOutputChannels: deviceChannels } = deviceInfo;

  let outputSampleRate = trackSampleRate;
  let outputChannels = trackChannels;
  let needsResampling = false;
  let needsRemixing = false;
  let supported = false;

  // Prefer track format, but check device limits
  if (outputChannels > deviceChannels) {
    needsRemixing = true;
    outputChannels = deviceChannels;
  }

  // Try device default if track format not supported
  if (portaudio && typeof portaudio.isOutputFormatSupported === 'function') {
    supported = portaudio.isOutputFormatSupported({
      sampleRate: outputSampleRate,
      channels: outputChannels,
      deviceIndex: deviceInfo.index,
      sampleFormat: 'f32le',
    });
    if (!supported) {
      // Try device default sample rate and max channels
      outputSampleRate = deviceSampleRate;
      outputChannels = deviceChannels;
      needsResampling = trackSampleRate !== outputSampleRate;
      needsRemixing = trackChannels !== outputChannels;
      supported = portaudio.isOutputFormatSupported({
        sampleRate: outputSampleRate,
        channels: outputChannels,
        deviceIndex: deviceInfo.index,
        sampleFormat: 'f32le',
      });
    }
  } else {
    // Fallback: check if resampling/remixing needed
    if (outputSampleRate !== deviceSampleRate) {
      needsResampling = true;
      outputSampleRate = deviceSampleRate;
    }
    if (outputChannels > deviceChannels) {
      needsRemixing = true;
      outputChannels = deviceChannels;
    }
    supported = true; // Assume supported if not checkable
  }

  return {
    sampleRate: outputSampleRate,
    channels: outputChannels,
    needsResampling,
    needsRemixing,
    originalSampleRate: trackSampleRate,
    originalChannels: trackChannels,
    supported
  };
}

/**
 * Scale PCM float32le buffer by volume (software gain).
 * 
 * @param {Buffer} buffer - PCM buffer (float32le format)
 * @param {number} volume - Volume multiplier (0.0-1.0)
 * @returns {Buffer} Scaled PCM buffer
 * @author zevinDev
 */
export function scalePCMVolume(buffer, volume) {
  if (volume === 1.0) return buffer; // No scaling needed
  
  const floatArray = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
  for (let i = 0; i < floatArray.length; i++) {
    floatArray[i] *= volume;
  }
  
  return Buffer.from(floatArray.buffer, floatArray.byteOffset, floatArray.byteLength);
}

/**
 * Mix two PCM buffer arrays for crossfade effects.
 * Supports multiple crossfade curves: linear, logarithmic, exponential.
 * 
 * @param {Buffer[]} currentBuffers - PCM buffers from current track
 * @param {Buffer[]} nextBuffers - PCM buffers from next track
 * @param {number} crossfadeFrames - Number of frames to crossfade
 * @param {number} channels - Number of audio channels
 * @param {string} [curve='linear'] - Crossfade curve type
 * @returns {Buffer[]} Mixed PCM buffers
 * @author zevinDev
 */
export function mixCrossfade(currentBuffers, nextBuffers, crossfadeFrames, channels, curve = 'linear') {
  // Flatten buffers
  const current = Buffer.concat(currentBuffers);
  const next = Buffer.concat(nextBuffers);
  const frameSize = 4 * channels; // float32le bytes per frame
  const mixed = [];
  
  // Select curve function
  let curveFunc = (x) => x; // linear by default
  
  switch (curve.toLowerCase()) {
    case 'log':
    case 'logarithmic':
      curveFunc = (x) => Math.log10(9 * x + 1); // log curve, x in [0,1]
      break;
    case 'exp':
    case 'exponential':
      curveFunc = (x) => x === 0 ? 0 : Math.pow(2, 10 * (x - 1)); // exponential curve
      break;
    case 'linear':
    default:
      curveFunc = (x) => x;
  }
  
  for (let i = 0; i < crossfadeFrames; i++) {
    const t = i / crossfadeFrames;
    const fadeOut = 1 - curveFunc(t);
    const fadeIn = curveFunc(t);
    
    for (let ch = 0; ch < channels; ch++) {
      const idx = i * frameSize + ch * 4;
      
      if (idx + 4 <= current.length && idx + 4 <= next.length) {
        const curSample = current.readFloatLE(idx) * fadeOut;
        const nextSample = next.readFloatLE(idx) * fadeIn;
        const mixedSample = curSample + nextSample;
        
        const buf = Buffer.alloc(4);
        buf.writeFloatLE(mixedSample, 0);
        mixed.push(buf);
      }
    }
  }
  
  return mixed;
}

/**
 * Fisher-Yates shuffle algorithm for arrays.
 * 
 * @param {Array} arr - Array to shuffle
 * @returns {Array} Shuffled array (new copy)
 * @author zevinDev
 */
export function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Validate crossfade curve parameter.
 * 
 * @param {string} curve - Curve name to validate
 * @returns {string} Normalized curve name
 * @throws {Error} If curve is invalid
 * @author zevinDev
 */
export function validateCrossfadeCurve(curve) {
  const valid = ['linear', 'log', 'logarithmic', 'exp', 'exponential'];
  
  if (typeof curve !== 'string' || !valid.includes(curve.toLowerCase())) {
    throw new Error(`Invalid crossfade curve: ${curve}. Valid: linear, logarithmic, exponential.`);
  }
  
  // Normalize curve name
  if (curve.toLowerCase().startsWith('log')) return 'logarithmic';
  if (curve.toLowerCase().startsWith('exp')) return 'exponential';
  return 'linear';
}

/**
 * Calculate the number of frames for a given duration and sample rate.
 * 
 * @param {number} durationSeconds - Duration in seconds
 * @param {number} sampleRate - Sample rate in Hz
 * @returns {number} Number of frames
 * @author zevinDev
 */
export function durationToFrames(durationSeconds, sampleRate) {
  return Math.floor(durationSeconds * sampleRate);
}

/**
 * Get frame size in bytes for given format.
 * 
 * @param {number} channels - Number of channels
 * @param {string} [format='f32le'] - Audio format
 * @returns {number} Frame size in bytes
 * @author zevinDev
 */
export function getFrameSize(channels, format = 'f32le') {
  const bytesPerSample = format === 'f32le' ? 4 : 2; // Assume 16-bit for others
  return channels * bytesPerSample;
}
