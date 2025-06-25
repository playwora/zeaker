const { AudioPlayer } = require('../dist/cjs/index.js');

(async () => {
const player = new AudioPlayer();
const devices = await AudioPlayer.listOutputDevices();
console.log(devices)
})();