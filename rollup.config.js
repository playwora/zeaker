import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

const external = [
  'node-gyp-build',
  '../native/index.js',
  './native/index.js',
  'path',
  'fs',
  'os',
  'util',
  'child_process',
];

export default [
  // ESModule build
  {
    input: 'src/index.js',
    output: {
      dir: 'dist/esm',
      format: 'esm',
      sourcemap: true,
      preserveModules: true,
      entryFileNames: '[name].js',
    },
    plugins: [nodeResolve(), terser()],
    external,
  },
  // CommonJS build
  {
    input: 'src/index.js',
    output: {
      dir: 'dist/cjs',
      format: 'cjs',
      exports: 'named',
      sourcemap: true,
      preserveModules: true,
      entryFileNames: '[name].js',
    },
    plugins: [commonjs(), nodeResolve(), terser()],
    external,
  },
];
