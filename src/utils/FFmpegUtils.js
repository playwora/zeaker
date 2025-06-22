/**
 * @module FFmpegUtils
 * @author zevinDev
 * @description FFmpeg-related utilities for audio processing
 */

import { fileURLToPath } from 'url';
import os from 'os';
import path from 'path';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import { spawn } from 'node:child_process';
import { getAudioStreamInfo } from './ffprobeUtil.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Locate the ffmpeg binary for the current platform.
 * 
 * @returns {Promise<string>} Path to ffmpeg binary
 * @throws {Error} If ffmpeg binary is not found
 * @author zevinDev
 */
export async function locateFFmpeg() {
    if (ffmpegPath) {
      return ffmpegPath;
    } else {
      throw new Error('FFmpeg binary not found.');
    }
}

/**
 * Locate the ffprobe binary for the current platform.
 * 
 * @returns {Promise<string>} Path to ffprobe binary
 * @throws {Error} If ffprobe binary is not found
 * @author zevinDev
 */
export async function locateFFprobe() {
    if (ffprobePath) {
      return ffprobePath.path;
    } else {
      throw new Error('FFprobe binary not found.');
    }
}

/**
 * Build FFmpeg arguments for audio conversion.
 * 
 * @param {object} options - Conversion options
 * @param {string} options.input - Input file path or 'pipe:0' for stdin
 * @param {string} options.output - Output destination or 'pipe:1' for stdout
 * @param {number} [options.sampleRate=44100] - Target sample rate
 * @param {number} [options.channels=2] - Target number of channels
 * @param {string} [options.format='f32le'] - Output format
 * @param {string} [options.codec='pcm_f32le'] - Audio codec
 * @param {number} [options.seekPosition] - Seek position in seconds
 * @returns {string[]} FFmpeg arguments array
 * @author zevinDev
 */
export function buildFFmpegArgs({
  input,
  output = 'pipe:1',
  sampleRate = 44100,
  channels = 2,
  format = 'f32le',
  codec = 'pcm_f32le',
  seekPosition
}) {
  const args = ['-hide_banner', '-loglevel', 'error'];
  
  // Add seek position if specified
  if (seekPosition !== undefined) {
    args.push('-ss', String(seekPosition));
  }
  
  // Input
  args.push('-i', input);
  
  // Output format settings
  args.push(
    '-f', format,
    '-acodec', codec,
    '-ar', String(sampleRate),
    '-ac', String(channels),
    output
  );
  
  return args;
}

/**
 * Extract metadata from an audio file using ffmpeg.
 * 
 * @param {string} filePath - Path to the audio file
 * @param {string} [ffmpegPath] - Path to ffmpeg binary (auto-detected if not provided)
 * @returns {Promise<Object>} Metadata object (title, artist, album, duration, etc.)
 * @throws {Error} If extraction fails
 * @author zevinDev
 */
export async function extractMetadata(filePath, ffmpegPath) {
  if (!ffmpegPath) {
    ffmpegPath = await locateFFmpeg();
  }
  
  return new Promise((resolve, reject) => {
    const args = [
      '-hide_banner', '-loglevel', 'error',
      '-i', filePath,
      '-f', 'ffmetadata',
      '-'
    ];
    
    const ffmpeg = spawn(ffmpegPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    
    ffmpeg.stdout.on('data', chunk => { 
      output += chunk.toString(); 
    });
    
    ffmpeg.stderr.on('data', () => {}); // suppress stderr
    
    ffmpeg.on('close', code => {
      if (code !== 0) {
        return reject(new Error(`ffmpeg exited with code ${code}`));
      }
      
      // Parse ffmetadata format
      const meta = {};
      for (const line of output.split(/\r?\n/)) {
        const match = line.match(/^([A-Za-z0-9_\-]+)=(.*)$/);
        if (match) {
          meta[match[1].toLowerCase()] = match[2];
        }
      }
      
      resolve(meta);
    });
    
    ffmpeg.on('error', reject);
  });
}

/**
 * Get detailed audio stream information from a file.
 * 
 * @param {string} filePath - Path to the audio file
 * @param {string} [ffprobePath] - Path to ffprobe binary (auto-detected if not provided)
 * @returns {Promise<Object>} Audio stream info (sample_rate, channels, etc.)
 * @throws {Error} If analysis fails
 * @author zevinDev
 */
export async function getAudioInfo(filePath, ffprobePath) {
  if (!ffprobePath) {
    ffprobePath = await locateFFprobe();
  }
  
  try {
    return await getAudioStreamInfo(ffprobePath, filePath);
  } catch (error) {
    // Return defaults if ffprobe fails
    console.warn('[FFmpegUtils] Failed to get audio info, using defaults:', error.message);
    return {
      sample_rate: 44100,
      channels: 2,
      duration: null
    };
  }
}

/**
 * Create and configure an FFmpeg process for audio conversion.
 * 
 * @param {string} ffmpegPath - Path to ffmpeg binary
 * @param {string[]} args - FFmpeg arguments
 * @param {object} [options] - Spawn options
 * @returns {ChildProcess} Configured FFmpeg process
 * @author zevinDev
 */
export function createFFmpegProcess(ffmpegPath, args, options = {}) {
  const defaultOptions = {
    stdio: ['ignore', 'pipe', 'pipe']
  };
  
  return spawn(ffmpegPath, args, { ...defaultOptions, ...options });
}

/**
 * Kill an FFmpeg process safely.
 * 
 * @param {ChildProcess} process - FFmpeg process to kill
 * @param {string} [signal='SIGKILL'] - Signal to send
 * @author zevinDev
 */
export function killFFmpegProcess(process, signal = 'SIGKILL') {
  if (process && typeof process.kill === 'function') {
    try {
      process.kill(signal);
    } catch (error) {
      console.warn('[FFmpegUtils] Failed to kill process:', error.message);
    }
  }
}
