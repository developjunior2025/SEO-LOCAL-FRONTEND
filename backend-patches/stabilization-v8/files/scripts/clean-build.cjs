'use strict';

const { existsSync, readdirSync, rmSync, writeFileSync } = require('node:fs');
const { join, relative } = require('node:path');
const { spawnSync } = require('node:child_process');

const root = join(__dirname, '..');
const dist = join(root, 'dist');

function removeGenerated(path) {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
    console.log(`[SEOLOCAL] Eliminado artefacto generado: ${path}`);
  }
}

removeGenerated(dist);
removeGenerated(join(root, 'tsconfig.tsbuildinfo'));
removeGenerated(join(root, 'tsconfig.build.tsbuildinfo'));

for (const name of readdirSync(root)) {
  if (name.endsWith('.tsbuildinfo')) {
    removeGenerated(join(root, name));
  }
}

const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc');
if (!existsSync(tsc)) {
  console.error(`[SEOLOCAL ERROR] No existe el compilador TypeScript local: ${tsc}`);
  process.exit(2);
}

const result = spawnSync(
  process.execPath,
  [tsc, '-p', 'tsconfig.build.json', '--pretty', 'false'],
  { cwd: root, stdio: 'inherit', windowsHide: true },
);

if (result.error) {
  console.error(result.error);
  process.exit(3);
}
if (result.status !== 0) {
  process.exit(result.status ?? 4);
}

function collectMainJs(directory, output = []) {
  if (!existsSync(directory)) return output;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) collectMainJs(full, output);
    else if (entry.isFile() && entry.name === 'main.js') output.push(full);
  }
  return output;
}

const preferred = [
  join(dist, 'main.js'),
  join(dist, 'src', 'main.js'),
].filter(existsSync);

const matches = preferred.length ? preferred : collectMainJs(dist);
if (!matches.length) {
  console.error('[SEOLOCAL ERROR] TypeScript terminó correctamente, pero no emitió main.js.');
  process.exit(5);
}

const entry = matches[0];
const entryRelative = relative(root, entry).replaceAll('\\', '/');
writeFileSync(join(root, '.seolocal-backend-entry.txt'), `${entryRelative}\n`, 'ascii');
console.log(`[SEOLOCAL] Entrada backend compilada: ${entryRelative}`);
