/**
 * @module AudioUtils
 * @author zevinDev
 * @description Audio processing and format utilities
 */

/**
 * Negotiate the optimal output format between track and device capabilities.
 * Prefers exact match, then highest supported <= track, else lowest available.
 *
 * @param {object} trackInfo - Track info ({ sampleRate, channels, bitDepth }).
 * @param {object} deviceInfo - Device info ({ index }).
 * @param {object} portaudio - PortAudio binding instance.
 * @returns {object} Negotiated format and required conversions.
 * @throws {Error} If portaudio.getDeviceCapabilities is not available.
 * @author zevinDev
 * @example
 * const fmt = negotiateAudioFormat(track, device, portaudio);
 */
export function negotiateAudioFormat(trackInfo, deviceInfo, portaudio) {
  const { sampleRate: trackSampleRate, channels: trackChannels, bitDepth: trackBitDepth } = trackInfo;
  
  // Validate inputs
  if (!portaudio || typeof portaudio.getDeviceCapabilities !== 'function') {
    throw new Error('portaudio.getDeviceCapabilities is required');
  }
  
  const deviceCapabilities = portaudio.getDeviceCapabilities(deviceInfo.index);
  const supportedRates = Array.isArray(deviceCapabilities.supportedSampleRates)
    ? [...new Set(deviceCapabilities.supportedSampleRates.map(Number))].sort((a, b) => a - b)
    : [deviceCapabilities.defaultSampleRate];
  const supportedChannels = Array.isArray(deviceCapabilities.supportedChannels)
    ? [...new Set(deviceCapabilities.supportedChannels.map(Number))].sort((a, b) => a - b)
    : [deviceCapabilities.maxOutputChannels];
  const supportedBitDepths = Array.isArray(deviceCapabilities.supportedBitDepths)
    ? [...new Set(deviceCapabilities.supportedBitDepths.map(Number))].sort((a, b) => a - b)
    : [32];

  // Helper: find best match with conservative defaults
  function pickBest(supported, trackValue, conservativeDefault) {
    // If trackValue is invalid, use conservative default
    if (typeof trackValue !== 'number' || trackValue <= 0) {
      return conservativeDefault && supported.includes(conservativeDefault) 
        ? conservativeDefault 
        : supported[0]; // Use lowest if no conservative default
    }
    
    // Exact match is always preferred
    if (supported.includes(trackValue)) return trackValue;
    
    // Find highest supported value <= track value (avoid unnecessary upsampling)
    const lessOrEqual = supported.filter(v => v <= trackValue);
    if (lessOrEqual.length > 0) return lessOrEqual[lessOrEqual.length - 1];
    
    // If track value is lower than all supported, use lowest supported
    return supported[0];
  }

  const outputSampleRate = pickBest(supportedRates, trackSampleRate, 44100);
  const outputChannels = pickBest(supportedChannels, trackChannels, 2);
  const outputBitDepth = pickBest(supportedBitDepths, trackBitDepth, 16);

  const needsResampling = outputSampleRate !== trackSampleRate;
  const needsRemixing = outputChannels !== trackChannels;
  const needsBitDepthConversion = outputBitDepth !== trackBitDepth && typeof trackBitDepth === 'number';

  // Map bit depth to PortAudio sampleFormat string
  const bitDepthToSampleFormat = {
    16: 's16le',
    24: 's24le',
    32: 'f32le',
  };
  const sampleFormat = bitDepthToSampleFormat[outputBitDepth] || 'f32le';

  // Check if format is supported
  let supported = false;
  if (typeof portaudio.isOutputFormatSupported === 'function') {
    try {
      supported = portaudio.isOutputFormatSupported({
        deviceIndex: deviceInfo.index,
        sampleRate: outputSampleRate,
        channels: outputChannels,
        sampleFormat
      });
    } catch (e) {
      // fallback: try legacy signature
      try {
        supported = portaudio.isOutputFormatSupported(
          deviceInfo.index,
          outputSampleRate,
          outputChannels
        );
      } catch {
        supported = false;
      }
    }
  } else {
    supported = true;
  }

  return {
    sampleRate: outputSampleRate,
    channels: outputChannels,
    bitDepth: outputBitDepth,
    needsResampling,
    needsRemixing,
    needsBitDepthConversion,
    originalSampleRate: trackSampleRate,
    originalChannels: trackChannels,
    originalBitDepth: trackBitDepth,
    supported
  };
}

/**
 * Scale PCM float32le buffer by volume (software gain).
 *
 * @param {Buffer|Float32Array} buffer - PCM buffer (float32le format).
 * @param {number} volume - Volume multiplier (0.0-1.0).
 * @returns {Float32Array} Scaled PCM buffer as Float32Array.
 * @throws {TypeError} If buffer is not Buffer or Float32Array.
 * @author zevinDev
 * @example
 * const scaled = scalePCMVolume(buf, 0.5);
 */
export function scalePCMVolume(buffer, volume) {
  if (volume === 1.0) return buffer;
  // Accept both Buffer and Float32Array
  let floatArray;
  if (buffer instanceof Float32Array) {
    floatArray = buffer;
  } else if (Buffer.isBuffer(buffer)) {
    floatArray = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
  } else {
    throw new TypeError('scalePCMVolume expects Buffer or Float32Array');
  }
  // Create a new Float32Array to avoid mutating the input
  const scaled = new Float32Array(floatArray.length);
  for (let i = 0; i < floatArray.length; i++) {
    scaled[i] = floatArray[i] * volume;
  }
  return scaled;
}

/**
 * Mix two PCM buffer arrays for crossfade effects.
 * Supports multiple crossfade curves: linear, logarithmic, exponential.
 *
 * @param {Buffer[]} currentBuffers - PCM buffers from current track.
 * @param {Buffer[]} nextBuffers - PCM buffers from next track.
 * @param {number} crossfadeFrames - Number of frames to crossfade.
 * @param {number} channels - Number of audio channels.
 * @param {string} [curve='linear'] - Crossfade curve type.
 * @returns {Buffer[]} Mixed PCM buffers.
 * @author zevinDev
 * @example
 * const mixed = mixCrossfade(curBufs, nextBufs, 1024, 2, 'logarithmic');
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
 * @param {Array} arr - Array to shuffle.
 * @returns {Array} Shuffled array (new copy).
 * @author zevinDev
 * @example
 * const shuffled = shuffleArray([1,2,3]);
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
 * @param {string} curve - Curve name to validate.
 * @returns {string} Normalized curve name.
 * @throws {Error} If curve is invalid.
 * @author zevinDev
 * @example
 * const c = validateCrossfadeCurve('log');
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
 * @param {number} durationSeconds - Duration in seconds.
 * @param {number} sampleRate - Sample rate in Hz.
 * @returns {number} Number of frames.
 * @author zevinDev
 * @example
 * const frames = durationToFrames(2.5, 44100);
 */
export function durationToFrames(durationSeconds, sampleRate) {
  return Math.floor(durationSeconds * sampleRate);
}

/**
 * Get frame size in bytes for given format.
 *
 * @param {number} channels - Number of channels.
 * @param {string} [format='f32le'] - Audio format.
 * @returns {number} Frame size in bytes.
 * @author zevinDev
 * @example
 * const size = getFrameSize(2, 'f32le');
 */
export function getFrameSize(channels, format = 'f32le') {
  const bytesPerSample = format === 'f32le' ? 4 : 2; // Assume 16-bit for others
  return channels * bytesPerSample;
}
