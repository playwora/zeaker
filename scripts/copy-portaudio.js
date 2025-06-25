// scripts/copy-portaudio.js
import { mkdir, readdir, copyFile, stat } from 'fs/promises';
import path from 'path';

const srcDir = path.resolve('build');
const targets = [
  path.resolve('dist/esm/core/build'),
  path.resolve('dist/cjs/core/build')
];

async function copyRecursive(src, dest) {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      await copyFile(srcPath, destPath);
      console.log(`Copied ${srcPath} to ${destPath}`);
    }
  }
}

for (const destDir of targets) {
  await copyRecursive(srcDir, destDir);
}
