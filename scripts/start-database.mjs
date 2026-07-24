import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import net from 'node:net';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = resolve(__dirname, '..');
const BACKEND_DIR = process.env.SEOLOCAL_BACKEND_DIR
  ? resolve(process.env.SEOLOCAL_BACKEND_DIR)
  : resolve(FRONTEND_DIR, '..', '..', 'SEO-LOCAL-BACKEND-main');

function log(...args) {
  console.log(`[SEOLOCAL DB]`, ...args);
}
function fatal(...args) {
  console.error(`[SEOLOCAL DB ERROR]`, ...args);
  process.exit(1);
}

function parseEnv(filePath) {
  const env = {};
  if (!existsSync(filePath)) return env;
  const text = readFileSync(filePath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([^#=][^=]*)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkPort(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
    socket.once('timeout', () => resolve(false));
    socket.connect(port, host);
  });
}

async function waitForPort(host, port, timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await checkPort(host, port)) return;
    await sleep(1000);
  }
  fatal(`Timeout esperando PostgreSQL en ${host}:${port}.`);
}

async function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    log(`Ejecutando: ${command} ${args.join(' ')}`);
    const proc = spawn(command, args, {
      stdio: options.stdio ?? 'inherit',
      shell: process.platform === 'win32',
      cwd: options.cwd,
    });
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0 || code === null) resolve(code);
      else reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
    });
  });
}

async function main() {
  const env = parseEnv(join(BACKEND_DIR, '.env'));
  const host = env.DB_HOST || '127.0.0.1';
  const port = Number(env.DB_PORT || 5434);

  log(`Verificando PostgreSQL en ${host}:${port}...`);
  if (await checkPort(host, port)) {
    log(`PostgreSQL ya está disponible en ${host}:${port}. No se inicia nada nuevo.`);
    return;
  }

  log('Iniciando PostgreSQL con Docker Compose...');
  const volumeName = 'seo-local-postgres-data';
  try {
    await run('docker', ['volume', 'inspect', volumeName], { cwd: BACKEND_DIR, stdio: 'ignore' });
    log(`Reutilizando volumen existente ${volumeName}.`);
  } catch {
    log(`Creando volumen ${volumeName}...`);
    await run('docker', ['volume', 'create', volumeName], { cwd: BACKEND_DIR });
  }
  await run('docker', ['compose', 'up', '-d', 'db'], { cwd: BACKEND_DIR });
  await waitForPort(host, port);
  log(`PostgreSQL listo en ${host}:${port}.`);
}

main().catch((err) => fatal(err.message));
