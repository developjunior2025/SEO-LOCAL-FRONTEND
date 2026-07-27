'use strict';

const { existsSync, readFileSync, readdirSync } = require('node:fs');
const { join } = require('node:path');
const { spawn } = require('node:child_process');

const root = join(__dirname, '..');
const marker = join(root, '.seolocal-backend-entry.txt');

function collectMainJs(directory, output = []) {
  if (!existsSync(directory)) return output;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) collectMainJs(full, output);
    else if (entry.isFile() && entry.name === 'main.js') output.push(full);
  }
  return output;
}

let entry = '';
if (existsSync(marker)) {
  entry = readFileSync(marker, 'ascii').trim();
}

const candidates = [
  entry && join(root, entry),
  join(root, 'dist', 'main.js'),
  join(root, 'dist', 'src', 'main.js'),
].filter(Boolean);

let absoluteEntry = candidates.find(existsSync);
if (!absoluteEntry) {
  absoluteEntry = collectMainJs(join(root, 'dist'))[0];
}

if (!absoluteEntry) {
  console.error('[SEOLOCAL ERROR] No existe una entrada backend compilada. Ejecuta npm run build.');
  process.exit(2);
}

const child = spawn(process.execPath, [absoluteEntry], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
  windowsHide: false,
});

child.on('error', (error) => {
  console.error(error);
  process.exit(3);
});
child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
