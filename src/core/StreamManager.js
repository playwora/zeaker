/**
 * @module StreamManager
 * @author zevinDev
 * @description Manages HTTP/HTTPS streaming with buffering, reconnection, and error handling
 */

import { spawn } from 'node:child_process';
import { buildFFmpegArgs, createFFmpegProcess, killFFmpegProcess } from '../utils/FFmpegUtils.js';
import { handleError, createUserFriendlyMessage } from '../utils/ErrorHandler.js';

/**
 * StreamManager handles streaming audio from HTTP/HTTPS URLs.
 * Provides robust buffering, error handling, reconnection, and partial playback support.
 * 
 * @class
 * @author zevinDev
 */
export class StreamManager {
  constructor() {
    this._streaming = false;
    this._streamRequest = null;
    this._streamResponse = null;
    this._ffmpegProcess = null;
    this._stopStreaming = null;
  }

  /**
   * Play from a streaming source with robust error handling and reconnection.
   * 
   * @param {string} url - Streaming source URL (http(s) or file)
   * @param {object} options - Streaming options
   * @param {string} options.ffmpegPath - Path to ffmpeg binary
   * @param {object} options.portaudio - PortAudio instance
   * @param {object} options.audioStream - Audio stream for output
   * @param {object} options.outputDevice - Output device info
   * @param {number} [options.bufferSize] - Buffer size for audio
   * @param {number} [options.maxRetries=5] - Maximum retry attempts
   * @param {number} [options.backoffBaseMs=500] - Base backoff time in ms
   * @param {number} [options.bufferSizeBytes=128*1024] - Stream buffer size in bytes
   * @param {Function} [options.visualizationCallback] - Callback for PCM data
   * @param {Function} [options.emitter] - Event emitter for events
   * @returns {Promise<void>}
   * @throws {Error} If streaming fails after all retries
   * @author zevinDev
   */
  async playStream(url, options) {
    const {
      ffmpegPath,
      portaudio,
      audioStream,
      outputDevice,
      bufferSize,
      maxRetries = 5,
      backoffBaseMs = 500,
      bufferSizeBytes = 128 * 1024,
      visualizationCallback,
      emitter
    } = options;

    let attempt = 0;
    let stopped = false;
    let lastError = null;
    let lastByte = 0; // Track last streamed byte for resume
    let canResume = false;

    this._streaming = true;

    const isHttp = /^https?:\/\//i.test(url);
    const isFile = /^file:/i.test(url) || /^[a-zA-Z]:\\/.test(url) || url.startsWith('/');

    const cleanup = () => {
      this._streaming = false;
      
      if (this._ffmpegProcess) {
        killFFmpegProcess(this._ffmpegProcess);
        this._ffmpegProcess = null;
      }
      
      if (this._streamRequest?.destroy) {
        try { this._streamRequest.destroy(); } catch {}
        this._streamRequest = null;
      }
      
      if (this._streamResponse?.destroy) {
        try { this._streamResponse.destroy(); } catch {}
        this._streamResponse = null;
      }
    };

    const tryStream = async () => {
      if (stopped) return;
      
      attempt++;

      try {
        // Prepare ffmpeg args
        const ffmpegArgs = buildFFmpegArgs({
          input: 'pipe:0',
          sampleRate: 44100,
          channels: 2
        });

        const ffmpeg = createFFmpegProcess(ffmpegPath, ffmpegArgs, {
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        this._ffmpegProcess = ffmpeg;

        // Buffering state
        let buffering = true;
        let buffer = Buffer.alloc(0);
        let streamEnded = false;

        // Handle PCM output from ffmpeg
        ffmpeg.stdout.on('data', chunk => {
          if (visualizationCallback) {
            try { visualizationCallback(chunk); } catch {}
          }
          
          if (portaudio && audioStream) {
            portaudio.writeStream(chunk, audioStream);
          }
        });

        ffmpeg.stderr.on('data', data => {
          const msg = `[ffmpeg] ${data}`;
          console.error(msg);
          if (emitter) {
            emitter.emit('streamError', new Error(msg));
          }
        });

        ffmpeg.on('close', code => {
          if (code !== 0 && !stopped) {
            lastError = new Error(`ffmpeg exited with code ${code}`);
            
            if (emitter) {
              emitter.emit('streamError', lastError);
            }
            
            if (attempt <= maxRetries) {
              if (emitter) {
                emitter.emit('streamReconnect', { attempt, url });
              }
              console.warn(`[StreamManager] Stream error, attempting reconnect #${attempt} to ${url}`);
              setTimeout(tryStream, backoffBaseMs * Math.pow(2, attempt - 1));
            } else {
              cleanup();
              const userMsg = createUserFriendlyMessage(lastError, 'stream');
              if (emitter) {
                emitter.emit('streamError', new Error(userMsg));
              }
              handleError(lastError, 'playStream', emitter);
            }
          } else if (!stopped && emitter) {
            emitter.emit('trackEnd', url);
          }
        });

        ffmpeg.on('error', err => {
          lastError = err;
          if (emitter) {
            emitter.emit('streamError', err);
          }
        });

        // Handle different stream types
        if (isHttp) {
          await this._handleHttpStream(url, ffmpeg, {
            lastByte, canResume, buffering, buffer, bufferSizeBytes,
            attempt, maxRetries, backoffBaseMs, emitter, cleanup
          });
        } else if (isFile) {
          await this._handleFileStream(url, ffmpeg, emitter);
        } else {
          cleanup();
          throw new Error('Unsupported stream URL: ' + url);
        }

        // Set up stop handler
        this._stopStreaming = () => {
          stopped = true;
          cleanup();
        };

      } catch (error) {
        lastError = error;
        if (emitter) {
          emitter.emit('streamError', error);
        }
        
        if (attempt <= maxRetries) {
          console.warn(`[StreamManager] Stream setup error, retrying #${attempt}`);
          setTimeout(tryStream, backoffBaseMs * Math.pow(2, attempt - 1));
        } else {
          cleanup();
          handleError(error, 'playStream', emitter);
        }
      }
    };

    try {
      await tryStream();
    } catch (error) {
      cleanup();
      const userMsg = createUserFriendlyMessage(error, 'stream');
      if (emitter) {
        emitter.emit('streamError', new Error(userMsg));
      }
      handleError(error, 'playStream', emitter);
      throw error;
    }
  }

  /**
   * Handle HTTP/HTTPS streaming with reconnection support.
   * 
   * @private
   * @param {string} url - HTTP(S) URL
   * @param {ChildProcess} ffmpeg - FFmpeg process
   * @param {object} streamState - Stream state and options
   * @author zevinDev
   */
  async _handleHttpStream(url, ffmpeg, streamState) {
    const { 
      lastByte, canResume, buffering, buffer, bufferSizeBytes,
      attempt, maxRetries, backoffBaseMs, emitter, cleanup 
    } = streamState;

    // Try to use 'got' library if available, fallback to node http/https
    let got = null;
    try { 
      got = (await import('got')).default; 
    } catch {}

    const onStreamError = err => {
      if (emitter) {
        emitter.emit('streamError', err);
      }
      
      if (attempt <= maxRetries) {
        if (emitter) {
          emitter.emit('streamReconnect', { attempt, url });
        }
        console.warn(`[StreamManager] Network error, attempting reconnect #${attempt} to ${url}`);
        // Retry will be handled by the caller
      } else {
        cleanup();
        const userMsg = createUserFriendlyMessage(err, 'stream');
        if (emitter) {
          emitter.emit('streamError', new Error(userMsg));
        }
      }
    };

    const headers = {};
    if (lastByte > 0) {
      headers['Range'] = `bytes=${lastByte}-`;
      canResume = true;
    }

    if (got) {
      this._streamRequest = got.stream(url, { 
        retry: 0, 
        timeout: { request: 10000 }, 
        headers 
      });
      
      this._streamRequest.on('error', onStreamError);
      
      this._streamRequest.on('response', res => {
        this._streamResponse = res;
        if (emitter) {
          emitter.emit('streamBuffering', false);
        }
        
        if (canResume && res.statusCode === 206) {
          if (emitter) {
            emitter.emit('streamResume', { attempt, url, fromByte: lastByte });
          }
        } else if (canResume && res.statusCode === 200) {
          if (emitter) {
            emitter.emit('streamPartial', { attempt, url, fromByte: 0 });
          }
          lastByte = 0;
        }
      });
      
      this._streamRequest.on('data', chunk => {
        this._handleStreamData(chunk, ffmpeg, streamState);
      });
      
      this._streamRequest.on('end', () => {
        ffmpeg.stdin.end();
      });
      
    } else {
      // Fallback to native http/https
      const proto = url.startsWith('https') ? require('https') : require('http');
      const reqOpts = { headers };
      
      this._streamRequest = proto.get(url, reqOpts, res => {
        this._streamResponse = res;
        if (emitter) {
          emitter.emit('streamBuffering', false);
        }
        
        if (canResume && res.statusCode === 206) {
          if (emitter) {
            emitter.emit('streamResume', { attempt, url, fromByte: lastByte });
          }
        } else if (canResume && res.statusCode === 200) {
          if (emitter) {
            emitter.emit('streamPartial', { attempt, url, fromByte: 0 });
          }
          lastByte = 0;
        }
        
        res.on('data', chunk => {
          this._handleStreamData(chunk, ffmpeg, streamState);
        });
        
        res.on('end', () => {
          ffmpeg.stdin.end();
        });
      });
      
      this._streamRequest.on('error', onStreamError);
    }

    if (emitter) {
      emitter.emit('streamBuffering', true);
    }
  }

  /**
   * Handle local file streaming.
   * 
   * @private
   * @param {string} url - File URL
   * @param {ChildProcess} ffmpeg - FFmpeg process
   * @param {Function} emitter - Event emitter
   * @author zevinDev
   */
  async _handleFileStream(url, ffmpeg, emitter) {
    const fs = require('fs');
    const filePath = url.replace(/^file:\/\//, '');
    
    const readStream = fs.createReadStream(filePath);
    
    readStream.on('error', err => {
      if (emitter) {
        emitter.emit('streamError', err);
      }
    });
    
    readStream.on('open', () => {
      if (emitter) {
        emitter.emit('streamBuffering', false);
      }
    });
    
    readStream.on('data', chunk => {
      ffmpeg.stdin.write(chunk);
    });
    
    readStream.on('end', () => {
      ffmpeg.stdin.end();
    });
  }

  /**
   * Handle incoming stream data with buffering.
   * 
   * @private
   * @param {Buffer} chunk - Data chunk
   * @param {ChildProcess} ffmpeg - FFmpeg process
   * @param {object} streamState - Stream state
   * @author zevinDev
   */
  _handleStreamData(chunk, ffmpeg, streamState) {
    const { lastByte, buffering, buffer, bufferSizeBytes, emitter } = streamState;
    
    streamState.lastByte += chunk.length;
    
    if (streamState.buffering) {
      streamState.buffer = Buffer.concat([streamState.buffer, chunk]);
      if (streamState.buffer.length >= bufferSizeBytes) {
        streamState.buffering = false;
        if (emitter) {
          emitter.emit('streamBuffering', false);
        }
        ffmpeg.stdin.write(streamState.buffer);
        streamState.buffer = Buffer.alloc(0);
      }
    } else {
      ffmpeg.stdin.write(chunk);
    }
  }

  /**
   * Stop the current stream.
   * 
   * @author zevinDev
   */
  stopStream() {
    if (this._stopStreaming) {
      this._stopStreaming();
      this._stopStreaming = null;
    }
  }

  /**
   * Check if currently streaming.
   * 
   * @returns {boolean} True if streaming is active
   * @author zevinDev
   */
  isStreaming() {
    return this._streaming;
  }

  /**
   * Clean up all streaming resources.
   * 
   * @author zevinDev
   */
  cleanup() {
    this.stopStream();
    this._streaming = false;
    this._streamRequest = null;
    this._streamResponse = null;
    this._ffmpegProcess = null;
  }
}
