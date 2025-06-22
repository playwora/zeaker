import { spawn } from 'node:child_process';

/**
 * Get audio stream info (sample rate, channels) from a file using ffprobe.
 * @param {string} ffprobePath - Path to ffprobe executable.
 * @param {string} filePath - Path to audio file.
 * @returns {Promise<{sample_rate: number, channels: number}>}
 */
export async function getAudioStreamInfo(ffprobePath, filePath) {
  return new Promise((resolve, reject) => {
    const args = [
      '-v', 'error',
      '-select_streams', 'a:0',
      '-show_entries', 'stream=sample_rate,channels',
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
            sample_rate: Number(json.streams[0].sample_rate),
            channels: Number(json.streams[0].channels)
          });
        } else {
          reject(new Error('No audio stream info found'));
        }
      } catch (e) {
        reject(e);
      }
    });
  });
}
