/**
 * @module Zeaker
 * @author zevinDev
 * @description Node.js Lossless Audio Player (PortAudio + FFmpeg) - Modular Entry Point
 */

// Export the new modular AudioPlayer and all managers/utilities
export { AudioPlayer } from './core/AudioPlayer.js';
export { DeviceManager } from './core/DeviceManager.js';
export { PlaylistManager } from './core/PlaylistManager.js';
export { AudioEffects } from './core/AudioEffects.js';
export { StreamManager } from './core/StreamManager.js';