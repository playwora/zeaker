import { spawn } from 'node:child_process';

/**
 * Get audio stream info (sample rate, channels, bit depth, duration) from a file using ffprobe.
 *
 * @param {string} ffprobePath - Path to ffprobe executable.
 * @param {string} filePath - Path to audio file.
 * @returns {Promise<{sampleRate: number, channels: number, bitDepth: number, duration: number}>} Resolves with audio stream info.
 * @throws {Error} If ffprobe fails or no audio stream info is found, or if JSON parsing fails.
 * @author zevinDev
 * @example
 * const info = await getAudioStreamInfo('/usr/bin/ffprobe', 'track.flac');
 * // info = { sampleRate: 44100, channels: 2, bitDepth: 16, duration: 123.45 }
 */
export async function getAudioStreamInfo(ffprobePath, filePath) {
  return new Promise((resolve, reject) => {
    const args = [
      '-v', 'error',
      '-select_streams', 'a:0',
      '-show_entries', 'stream=sample_rate,channels,bits_per_raw_sample : format=duration',
      '-of', 'json',
      filePath
    ];
    const proc = spawn(ffprobePath, args);
    let data = '';
    proc.stdout.on('data', chunk => { data += chunk; });
    proc.stderr.on('data', err => {}); // ignore
    proc.on('close', code => {
      if (code !== 0) return reject(new Error('ffprobe failed'));
      try {
        const json = JSON.parse(data);
        if (json.streams && json.streams[0]) {
          resolve({
            sampleRate: Number(json.streams[0].sample_rate),
            channels: Number(json.streams[0].channels),
            bitDepth: json.streams[0].bits_per_raw_sample ? Number(json.streams[0].bits_per_raw_sample) : 16,
            duration: Number(json.format.duration)
          });
        } else {
          reject(new Error('No audio stream info found'));
        }
      } catch (error) {
        reject(error);
      }
    });
  });
}
