// Loads the native PortAudio binding
const path = require('path');
const { join } = path;
const binding = require('node-gyp-build')(join(__dirname, '..'));

module.exports = binding;
