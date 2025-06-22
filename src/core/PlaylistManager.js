/**
 * @module PlaylistManager
 * @author zevinDev
 * @description Manages playlist operations including shuffle, repeat, and navigation
 */

import { shuffleArray } from '../utils/AudioUtils.js';
import { handleError, validateParams } from '../utils/ErrorHandler.js';

/**
 * PlaylistManager handles playlist state, navigation, and playback modes.
 * Supports shuffle, repeat modes, and efficient playlist operations.
 * 
 * @class
 * @author zevinDev
 */
export class PlaylistManager {
  constructor() {
    this._playlist = [];
    this._playlistIndex = 0;
    this._playlistActive = false;
    this._playlistShuffle = false;
    this._playlistRepeat = 'off'; // 'off', 'one', 'all'
    this._playlistOrder = [];
  }

  /**
   * Load a new playlist.
   * 
   * @param {string[]} playlist - Array of file paths
   * @throws {Error} If playlist is invalid
   * @author zevinDev
   */
  loadPlaylist(playlist) {
    try {
      if (!Array.isArray(playlist) || playlist.length === 0) {
        throw new Error('Playlist must be a non-empty array of file paths.');
      }
      
      // Defensive copy to avoid external mutation
      this._playlist = playlist.slice();
      this._playlistIndex = 0;
      this._playlistActive = true;
      this._updatePlaylistOrder();
    } catch (error) {
      handleError(error, 'loadPlaylist');
      throw error;
    }
  }

  /**
   * Update the playlist order based on shuffle setting.
   * 
   * @private
   * @author zevinDev
   */
  _updatePlaylistOrder() {
    if (this._playlist.length === 0) {
      this._playlistOrder = [];
      return;
    }
    
    if (this._playlistShuffle) {
      this._playlistOrder = shuffleArray([...Array(this._playlist.length).keys()]);
    } else {
      this._playlistOrder = [...Array(this._playlist.length).keys()];
    }
  }

  /**
   * Enable or disable shuffle mode for playlists.
   * 
   * @param {boolean} [enable=true] - Enable shuffle if true
   * @author zevinDev
   */
  setPlaylistShuffle(enable = true) {
    this._playlistShuffle = !!enable;
    this._updatePlaylistOrder();
  }

  /**
   * Set repeat mode for playlists.
   * 
   * @param {'off'|'one'|'all'} mode - Repeat mode
   * @throws {Error} If invalid repeat mode
   * @author zevinDev
   */
  setPlaylistRepeat(mode = 'off') {
    try {
      validateParams({ repeatMode: mode });
      this._playlistRepeat = mode;
    } catch (error) {
      handleError(error, 'setPlaylistRepeat');
      throw error;
    }
  }

  /**
   * Get the current track from the playlist.
   * 
   * @returns {string|null} Current track path or null if no playlist active
   * @author zevinDev
   */
  getCurrentTrack() {
    if (!this._playlistActive || this._playlistIndex >= this._playlist.length) {
      return null;
    }
    
    const orderIdx = this._playlistOrder[this._playlistIndex];
    return this._playlist[orderIdx];
  }

  /**
   * Navigate to the next track in the playlist.
   * Respects shuffle and repeat settings.
   * 
   * @returns {object} Navigation result
   * @author zevinDev
   */
  navigateNext() {
    if (!this._playlistActive) {
      return { hasNext: false, track: null, shouldRepeat: false };
    }
    
    // Handle repeat one mode
    if (this._playlistRepeat === 'one') {
      return { 
        hasNext: true, 
        track: this.getCurrentTrack(), 
        shouldRepeat: true 
      };
    }
    
    // Check if we can advance to next track
    if (this._playlistIndex < this._playlist.length - 1) {
      this._playlistIndex++;
      return { 
        hasNext: true, 
        track: this.getCurrentTrack(), 
        shouldRepeat: false 
      };
    }
    
    // Handle repeat all mode
    if (this._playlistRepeat === 'all') {
      this._playlistIndex = 0;
      
      // Reshuffle if shuffle is enabled
      if (this._playlistShuffle) {
        this._updatePlaylistOrder();
      }
      
      return { 
        hasNext: true, 
        track: this.getCurrentTrack(), 
        shouldRepeat: true 
      };
    }
    
    // End of playlist, no repeat
    return { hasNext: false, track: null, shouldRepeat: false };
  }

  /**
   * Navigate to the previous track in the playlist.
   * 
   * @returns {object} Navigation result
   * @author zevinDev
   */
  navigatePrevious() {
    if (!this._playlistActive) {
      return { hasPrevious: false, track: null };
    }
    
    // Check if we can go back to previous track
    if (this._playlistIndex > 0) {
      this._playlistIndex--;
      return { 
        hasPrevious: true, 
        track: this.getCurrentTrack() 
      };
    }
    
    // Handle repeat all mode - go to end
    if (this._playlistRepeat === 'all') {
      this._playlistIndex = this._playlist.length - 1;
      return { 
        hasPrevious: true, 
        track: this.getCurrentTrack() 
      };
    }
    
    // At beginning of playlist
    return { hasPrevious: false, track: null };
  }

  /**
   * Jump to a specific track index in the playlist.
   * 
   * @param {number} index - Track index to jump to
   * @returns {string|null} Track at the specified index
   * @throws {Error} If index is invalid
   * @author zevinDev
   */
  jumpToTrack(index) {
    if (!this._playlistActive || index < 0 || index >= this._playlist.length) {
      throw new Error(`Invalid track index: ${index}`);
    }
    
    this._playlistIndex = index;
    return this.getCurrentTrack();
  }

  /**
   * Get playlist status and information.
   * 
   * @returns {object} Playlist status
   * @author zevinDev
   */
  getPlaylistStatus() {
    return {
      active: this._playlistActive,
      length: this._playlist.length,
      currentIndex: this._playlistIndex,
      shuffle: this._playlistShuffle,
      repeat: this._playlistRepeat,
      currentTrack: this.getCurrentTrack(),
      hasNext: this._playlistIndex < this._playlist.length - 1 || this._playlistRepeat !== 'off',
      hasPrevious: this._playlistIndex > 0 || this._playlistRepeat === 'all'
    };
  }

  /**
   * Stop playlist playback and clear state.
   * 
   * @author zevinDev
   */
  stopPlaylist() {
    this._playlistActive = false;
    this._playlistIndex = 0;
    this._playlistOrder = [];
    this._playlist = [];
  }

  /**
   * Clear playlist without affecting current playback state.
   * 
   * @author zevinDev
   */
  clearPlaylist() {
    this._playlist = [];
    this._playlistOrder = [];
    this._playlistIndex = 0;
  }

  /**
   * Add tracks to the current playlist.
   * 
   * @param {string[]} tracks - Array of track paths to add
   * @param {number} [insertIndex] - Index to insert at (appends if not specified)
   * @author zevinDev
   */
  addTracks(tracks, insertIndex) {
    if (!Array.isArray(tracks) || tracks.length === 0) {
      return;
    }
    
    if (insertIndex !== undefined && insertIndex >= 0 && insertIndex <= this._playlist.length) {
      this._playlist.splice(insertIndex, 0, ...tracks);
    } else {
      this._playlist.push(...tracks);
    }
    
    this._updatePlaylistOrder();
  }

  /**
   * Remove tracks from the playlist.
   * 
   * @param {number[]} indices - Array of indices to remove
   * @author zevinDev
   */
  removeTracks(indices) {
    if (!Array.isArray(indices) || indices.length === 0) {
      return;
    }
    
    // Sort indices in descending order to avoid index shifting issues
    const sortedIndices = [...indices].sort((a, b) => b - a);
    
    for (const index of sortedIndices) {
      if (index >= 0 && index < this._playlist.length) {
        this._playlist.splice(index, 1);
        
        // Adjust current index if necessary
        if (index < this._playlistIndex) {
          this._playlistIndex--;
        } else if (index === this._playlistIndex && this._playlistIndex >= this._playlist.length) {
          this._playlistIndex = Math.max(0, this._playlist.length - 1);
        }
      }
    }
    
    this._updatePlaylistOrder();
  }

  /**
   * Check if the playlist is currently active.
   * 
   * @returns {boolean} True if playlist is active
   * @author zevinDev
   */
  isPlaylistActive() {
    return this._playlistActive;
  }

  /**
   * Get a copy of the current playlist.
   * 
   * @returns {string[]} Copy of the playlist
   * @author zevinDev
   */
  getPlaylistCopy() {
    return this._playlist.slice();
  }
}
