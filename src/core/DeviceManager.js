/**
 * @module DeviceManager
 * @author zevinDev
 * @description Manages audio device selection and configuration
 */

import { fileURLToPath } from 'url';
import { handleError } from '../utils/ErrorHandler.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

/**
 * DeviceManager handles audio device discovery and selection.
 * Supports robust device selection across all PortAudio device types.
 * 
 * @class
 * @author zevinDev
 */
export class DeviceManager {
  constructor() {
    this._outputDevice = null;
    this._portaudio = null;
  }

  /**
   * Initialize PortAudio and cache reference.
   * 
   * @returns {Promise<void>}
   * @throws {Error} If PortAudio is not available
   * @author zevinDev
   */
  async _initPortAudio() {
    if (!this._portaudio) {
      // Use node-gyp-build to load the native binding relative to the project root
      const gypDir = fileURLToPath(new URL('../../../', import.meta.url));
      try {
        this._portaudio = require('node-gyp-build')(gypDir);
      } catch (error) {
        this._portaudio = null;
      }
      if (!this._portaudio || typeof this._portaudio.getDevices !== 'function') {
        throw new Error('PortAudio binding or getDevices() not available. Make sure the Native Binding is built correctly.');
      }
      await this._portaudio.init();
    }
    return this._portaudio;
  }

  /**
   * List available PortAudio output devices.
   * 
   * @returns {Promise<Array<{index: number, name: string, maxOutputChannels: number, defaultSampleRate: number}>>}
   * @throws {Error} If device listing fails
   * @author zevinDev
   */
  async listOutputDevices() {
    try {
      const portaudio = await this._initPortAudio();
      const devices = await portaudio.getDevices();
      
      if (!devices || !Array.isArray(devices) || devices.length === 0) {
        throw new Error('No audio devices found.');
      }
      
      // Filter for output-capable devices
      return devices.filter(d => d.maxOutputChannels > 0);
    } catch (error) {
      handleError(error, 'listOutputDevices');
      throw error;
    }
  }

  /**
   * Set the output device for playback.
   *
   * Device selection is robust across all PortAudio device types (WASAPI, ASIO, CoreAudio, ALSA, etc.).
   * Throws if device is not found or not output-capable (maxOutputChannels > 0).
   *
   * @param {number} deviceIndex - Device index
   * @returns {Promise<object>} Selected device info
   * @throws {Error} If device is not found or not output-capable
   * @platform Windows: WASAPI/ASIO/DirectSound; macOS: CoreAudio; Linux: ALSA/PulseAudio/JACK
   * @fires DeviceManager#deviceChange
   * @fires DeviceManager#deviceError
   * @author zevinDev
   */
  async setOutputDevice(deviceIndex) {
    try {
      const portaudio = await this._initPortAudio();
      const devices = await portaudio.getDevices();
      
      if (!devices || !Array.isArray(devices) || devices.length === 0) {
        const err = new Error('No audio devices found.');
        throw err;
      }
      
      // Find device by index
      const match = devices.find(d => d.index === deviceIndex);
      
      // Check output capability
      if (!match || match.maxOutputChannels <= 0) {
        const err = new Error(`Output device not found or not output-capable: ${deviceIndex}`);
        throw err;
      }
      
      const prevDevice = this._outputDevice;
      this._outputDevice = match;
      
      return {
        device: match,
        changed: prevDevice?.index !== match.index
      };
    } catch (error) {
      handleError(error, 'setOutputDevice');
      throw error;
    }
  }

  /**
   * Get the currently selected output device.
   * 
   * @returns {object|null} Current output device info
   * @author zevinDev
   */
  getCurrentDevice() {
    return this._outputDevice;
  }

  /**
   * Get the default output device.
   * 
   * @returns {Promise<object>} Default output device info
   * @throws {Error} If no default device found
   * @author zevinDev
   */
  async getDefaultDevice() {
    try {
      const devices = await this.listOutputDevices();
      
      // Find default device (usually index 0 or marked as default)
      const defaultDevice = devices.find(d => d.isDefault) || devices[0];
      
      if (!defaultDevice) {
        throw new Error('No default output device found.');
      }
      
      return defaultDevice;
    } catch (error) {
      handleError(error, 'getDefaultDevice');
      throw error;
    }
  }

  /**
   * Find device by name (partial or exact match).
   * 
   * @param {string} deviceName - Device name to search for
   * @param {boolean} [exactMatch=false] - Whether to require exact match
   * @returns {Promise<object|null>} Found device or null
   * @author zevinDev
   */
  async findDeviceByName(deviceName, exactMatch = false) {
    try {
      const devices = await this.listOutputDevices();
      const searchName = deviceName.toLowerCase();
      
      if (exactMatch) {
        return devices.find(d => d.name.toLowerCase() === searchName) || null;
      } else {
        return devices.find(d => d.name.toLowerCase().includes(searchName)) || null;
      }
    } catch (error) {
      handleError(error, 'findDeviceByName');
      return null;
    }
  }

  /**
   * Validate device capabilities for playback requirements.
   * 
   * @param {object} device - Device to validate
   * @param {object} requirements - Playback requirements
   * @param {number} [requirements.minChannels=2] - Minimum required channels
   * @param {number} [requirements.preferredSampleRate] - Preferred sample rate
   * @returns {object} Validation result with capabilities and warnings
   * @author zevinDev
   */
  validateDeviceCapabilities(device, requirements = {}) {
    const { minChannels = 2, preferredSampleRate } = requirements;
    const warnings = [];
    const capabilities = {
      supportsChannels: device.maxOutputChannels >= minChannels,
      supportsSampleRate: true, // Most devices are flexible
      device
    };
    
    if (!capabilities.supportsChannels) {
      warnings.push(`Device only supports ${device.maxOutputChannels} channels, need ${minChannels}`);
    }
    
    if (preferredSampleRate && device.defaultSampleRate !== preferredSampleRate) {
      warnings.push(`Device default is ${device.defaultSampleRate}Hz, preferred ${preferredSampleRate}Hz (will resample)`);
    }
    
    return {
      isValid: capabilities.supportsChannels,
      capabilities,
      warnings
    };
  }

  /**
   * Get PortAudio instance for use by other components.
   * 
   * @returns {Promise<object>} PortAudio instance
   * @author zevinDev
   */
  async getPortAudio() {
    return await this._initPortAudio();
  }
}
