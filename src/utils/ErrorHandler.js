/**
 * @module ErrorHandler
 * @author zevinDev
 * @description Centralized error handling utilities for the audio player
 */

/**
 * Centralized error handler for the module.
 * Provides user-friendly error messages and logging capabilities.
 * 
 * @param {Error} error - The error to handle
 * @param {string} [context='Unknown'] - Context where the error occurred
 * @param {Function} [emitter] - Optional event emitter to emit error events
 * @throws {Error} Only rethrows if configured to do so
 * @author zevinDev
 */
export function handleError(error, context = 'Unknown', emitter = null) {
  // TODO: Integrate with logging service or emit events
  console.error(`[AudioPlayer][${context}]`, error);
  
  // User-friendly message for CLI/console
  console.log('Audio playback failed. Please check your device and file format.');
  
  // Emit error event if emitter is provided
  if (emitter && typeof emitter.emit === 'function') {
    emitter.emit('error', error);
  }
  
  // Do not rethrow to avoid crashing the process
}

/**
 * Creates user-friendly error messages for common audio player errors.
 * 
 * @param {Error} error - The original error
 * @param {string} context - Context where the error occurred
 * @returns {string} User-friendly error message
 * @author zevinDev
 */
export function createUserFriendlyMessage(error, context) {
  const message = error.message?.toLowerCase() || '';
  
  // Network/streaming errors
  if (context.includes('stream') || message.includes('network') || message.includes('timeout')) {
    return 'Streaming failed after multiple attempts. Please check your network connection or try again later.';
  }
  
  // Device errors
  if (context.includes('device') || message.includes('device') || message.includes('portaudio')) {
    return 'Audio device error. Please check your audio device settings and try again.';
  }
  
  // File errors
  if (message.includes('file') || message.includes('path') || context.includes('ffmpeg')) {
    return 'Audio file error. Please check that the file exists and is a supported audio format.';
  }
  
  // Bit-perfect mode errors
  if (message.includes('bit-perfect') || message.includes('gapless') || message.includes('crossfade')) {
    return 'Advanced audio feature not available in current mode. Please check your audio settings.';
  }
  
  // Generic fallback
  return 'Audio playback failed. Please try again or check your audio settings.';
}

/**
 * Validates common audio player parameters and throws appropriate errors.
 * 
 * @param {object} params - Parameters to validate
 * @param {string} params.filePath - Audio file path
 * @param {number} params.volume - Volume level (0.0-1.0)
 * @param {number} params.seekPosition - Seek position in seconds
 * @param {string} params.repeatMode - Repeat mode ('off', 'one', 'all')
 * @throws {Error} If validation fails
 * @author zevinDev
 */
export function validateParams({ filePath, volume, seekPosition, repeatMode }) {
  if (filePath !== undefined) {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('Invalid file path: must be a non-empty string');
    }
  }
  
  if (volume !== undefined) {
    if (typeof volume !== 'number' || volume < 0 || volume > 1) {
      throw new Error('Volume level must be a number between 0.0 and 1.0');
    }
  }
  
  if (seekPosition !== undefined) {
    if (typeof seekPosition !== 'number' || seekPosition < 0) {
      throw new Error('Seek position must be a non-negative number');
    }
  }
  
  if (repeatMode !== undefined) {
    if (!['off', 'one', 'all'].includes(repeatMode)) {
      throw new Error('Invalid repeat mode: must be "off", "one", or "all"');
    }
  }
}
