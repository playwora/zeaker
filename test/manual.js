import { AudioPlayer } from '../dist/esm/index.js';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUDIO_DIR = path.join(__dirname, 'audioFiles');
const audioFiles = fs.readdirSync(AUDIO_DIR).filter(f => /\.(mp3|wav|ogg|flac|aac|m4a|mp4)$/i.test(f));

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans); }));
}

async function main() {
  const player = new AudioPlayer();
  const devices = await AudioPlayer.listOutputDevices();
  if (!devices.length) {
    console.error('No WASAPI output devices found.');
    process.exit(1);
  }
  console.log('Available WASAPI Output Devices:');
  devices.forEach((d, i) => console.log(`  [${d.index}] ${d.name} (id: ${d.index}, channels: ${d.maxOutputChannels})`));
  let idx = parseInt(await prompt('Select device index: '), 10);
  await player.setOutputDevice(idx);
  console.log(`Selected device: ${devices.find(d => d.index === idx)?.name || 'Unknown'}`);

  let playlist = audioFiles.map(f => path.join(AUDIO_DIR, f));
  let current = 0;
  let running = true;

  
  player.on('play', file => console.log(`[PLAY] ${file}`));
  player.on('pause', () => console.log('[PAUSE]'));
  player.on('resume', () => console.log('[RESUME]'));
  player.on('stop', () => console.log('[STOP]'));
  player.on('trackEnd', file => console.log(`[TRACK END] ${file}`));
  player.on('playlistEnd', () => console.log('[PLAYLIST END]'));
  player.on('error', err => console.error('[ERROR]', err));

  while (running) {
    console.log('\n--- AudioPlayer Manual Test Menu ---');
    console.log('1. Play current file');
    console.log('2. Pause');
    console.log('3. Resume');
    console.log('4. Stop');
    console.log('5. Seek (seconds)');
    console.log('6. Next file');
    console.log('7. Previous file');
    console.log('8. Play playlist');
    console.log('9. Toggle shuffle');
    console.log('10. Set repeat mode (none/one/all)');
    console.log('11. Show status');
    console.log('12. Exit');
    console.log(`Current file: ${playlist[current]}`);
    let cmd = await prompt('Select option: ');
    try {
      switch (cmd.trim()) {
        case '1':
          await player.play(playlist[current]);
          break;
        case '2':
          await player.pause();
          break;
        case '3':
          await player.resume();
          break;
        case '4':
          await player.stop();
          break;
        case '5':
          let sec = parseFloat(await prompt('Seek to (seconds): '));
          if (!isNaN(sec)) await player.seek(sec);
          break;
        case '6':
          current = (current + 1) % playlist.length;
          console.log(`Next file: ${playlist[current]}`);
          break;
        case '7':
          current = (current - 1 + playlist.length) % playlist.length;
          console.log(`Previous file: ${playlist[current]}`);
          break;
        case '8':
          await player.playPlaylist(playlist);
          break;
        case '9':
          player.setPlaylistShuffle(!player._playlistShuffle);
          console.log(`Shuffle: ${player._playlistShuffle}`);
          break;
        case '10':
          let mode = await prompt('Repeat mode (none/one/all): ');
          player.setPlaylistRepeat(mode);
          console.log(`Repeat mode: ${player._playlistRepeat}`);
          break;
        case '11':
          console.log('Status:', {
            isPlaying: player._isPlaying,
            paused: player._paused,
            currentFile: playlist[current],
            shuffle: player._playlistShuffle,
            repeat: player._playlistRepeat,
            playlistActive: player._playlistActive
          });
          break;
        case '12':
          running = false;
          await player.stop();
          break;
        default:
          console.log('Unknown option.');
      }
    } catch (error) {
      console.error('[COMMAND ERROR]', error);
    }
  }
  console.log('Exiting manual test.');
  process.exit(0);
}

main();
