import { spawn } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import net from 'node:net';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = resolve(__dirname, '..');
const BACKEND_DIR = process.env.SEOLOCAL_BACKEND_DIR
  ? resolve(process.env.SEOLOCAL_BACKEND_DIR)
  : resolve(FRONTEND_DIR, '..', '..', 'SEO-LOCAL-BACKEND-main');

const BACKEND_ENV = parseEnv(join(BACKEND_DIR, '.env'));
const DB_HOST = BACKEND_ENV.DB_HOST || '127.0.0.1';
const DB_PORT = Number(BACKEND_ENV.DB_PORT || 5434);
const API_PORT = Number(BACKEND_ENV.PORT || 4001);
const API_PREFIX = BACKEND_ENV.API_PREFIX || 'api/v1';
const API_URL = `http://127.0.0.1:${API_PORT}/${API_PREFIX}`;
const HEALTH_URL = `${API_URL}/health`;
const BOOTSTRAP_URL = `${API_URL}/bootstrap`;

const children = [];

function log(...args) {
  console.log(`[SEOLOCAL]`, ...args);
}
function fatal(...args) {
  console.error(`[SEOLOCAL ERROR]`, ...args);
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

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    log(`Ejecutando: ${command} ${args.join(' ')}${options.cwd ? ` (cwd: ${options.cwd})` : ''}`);
    const proc = spawn(command, args, {
      stdio: options.stdio ?? 'inherit',
      shell: process.platform === 'win32',
      env: { ...process.env, ...options.env },
      cwd: options.cwd,
    });
    children.push(proc);
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0 || code === null) resolve(code);
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

function spawnPersistent(command, args, options = {}) {
  log(`Iniciando: ${command} ${args.join(' ')}${options.cwd ? ` (cwd: ${options.cwd})` : ''}`);
  const proc = spawn(command, args, {
    stdio: options.stdio ?? 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...options.env },
    cwd: options.cwd,
  });
  children.push(proc);
  return proc;
}

async function cleanup() {
  log('Recibida señal de cierre. Terminando Vite y NestJS. PostgreSQL permanece activo.');
  for (const proc of children) {
    if (proc && !proc.killed && proc.pid) {
      try {
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { stdio: 'ignore', shell: false });
        } else {
          process.kill(-proc.pid, 'SIGTERM');
        }
      } catch {
        // ignore
      }
    }
  }
  await sleep(1000);
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('SIGBREAK', cleanup);

async function ensureDocker() {
  log('Verificando Docker...');
  for (let i = 0; i < 3; i++) {
    try {
      await run('docker', ['info'], { cwd: FRONTEND_DIR, stdio: 'ignore' });
      log('Docker está disponible.');
      return;
    } catch {
      log('Docker no responde. Intentando iniciar Docker Desktop...');
      const dockerDesktopPaths = [
        'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe',
        'C:\\Program Files (x86)\\Docker\\Docker\\Docker Desktop.exe',
      ];
      for (const p of dockerDesktopPaths) {
        if (existsSync(p)) {
          log(`Abriendo Docker Desktop desde ${p}`);
          spawn(p, [], { stdio: 'ignore', detached: true, shell: false });
          break;
        }
      }
      await sleep(30000);
    }
  }
  fatal('Docker no está disponible. Inicia Docker Desktop manualmente e intenta de nuevo.');
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

async function waitForPort(host, port, timeoutMs = 120000, label = 'servicio') {
  const start = Date.now();
  log(`Esperando a ${label} en ${host}:${port}...`);
  while (Date.now() - start < timeoutMs) {
    if (await checkPort(host, port)) {
      log(`${label} responde en ${host}:${port}.`);
      return;
    }
    await sleep(1000);
  }
  fatal(`Timeout esperando a ${label} en ${host}:${port}.`);
}

async function waitForHttp(url, timeoutMs = 120000, label = 'endpoint') {
  const start = Date.now();
  log(`Esperando a ${label}: ${url}...`);
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        log(`${label} responde HTTP ${res.status}.`);
        return res;
      }
    } catch {
      // retry
    }
    await sleep(1000);
  }
  fatal(`Timeout esperando a ${label}: ${url}.`);
}

async function ensureDatabase() {
  log(`Verificando PostgreSQL en ${DB_HOST}:${DB_PORT}...`);
  if (await checkPort(DB_HOST, DB_PORT)) {
    log(`PostgreSQL ya está disponible en ${DB_HOST}:${DB_PORT}.`);
    return;
  }

  log('PostgreSQL no responde. Iniciando contenedor Docker...');
  const composeFile = join(BACKEND_DIR, 'docker-compose.yml');
  if (!existsSync(composeFile)) {
    fatal(`No se encontró ${composeFile}. Crea el archivo docker-compose.yml con el servicio db.`);
  }
  await run('npm', ['run', 'dev:database'], { cwd: FRONTEND_DIR });
  await waitForPort(DB_HOST, DB_PORT, 120000, 'PostgreSQL');
}

async function ensureBackend() {
  log(`Verificando backend NestJS en ${HEALTH_URL}...`);
  try {
    const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const body = await res.json();
      if (body.ok && body.database === 'connected') {
        log('Backend ya está saludable y conectado a la base de datos. Se reutiliza.');
        return;
      }
    }
  } catch {
    // not running or not ready
  }

  if (await checkPort('127.0.0.1', API_PORT)) {
    fatal(`El puerto ${API_PORT} está ocupado por otro proceso que no responde con health correcto. Cierra ese proceso antes de continuar.`);
  }

  log('Iniciando backend NestJS...');
  // Borrar info de compilación incremental stale; de lo contrario nest start --watch puede no emitir dist/main.
  for (const file of ['tsconfig.tsbuildinfo', 'tsconfig.build.tsbuildinfo']) {
    const p = join(BACKEND_DIR, file);
    if (existsSync(p)) {
      log(`Eliminando ${p} para forzar compilación limpia...`);
      rmSync(p);
    }
  }
  spawnPersistent('npm', ['run', 'start:dev'], { cwd: BACKEND_DIR });
  await waitForHttp(HEALTH_URL, 120000, 'health del backend');
}

async function startFrontend() {
  log('Iniciando frontend Vite...');
  spawnPersistent('npm', ['run', 'dev:frontend'], { cwd: FRONTEND_DIR });
}

async function validateBootstrap() {
  log(`Validando bootstrap: ${BOOTSTRAP_URL}`);
  try {
    const res = await fetch(BOOTSTRAP_URL, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const cats = data.categories?.length ?? 0;
    const ags = data.agencies?.length ?? 0;
    const srvs = data.services?.length ?? 0;
    const offs = data.offers?.length ?? 0;
    log(`Bootstrap: ${cats} categorías, ${ags} agencias, ${srvs} servicios, ${offs} ofertas.`);
  } catch (err) {
    log(`Bootstrap no pudo validarse: ${err.message}. Continuando...`);
  }
}

async function main() {
  log('=== SEOLOCAL arranque de desarrollo ===');
  log(`Frontend: ${FRONTEND_DIR}`);
  log(`Backend:  ${BACKEND_DIR}`);
  log(`Base de datos: ${DB_HOST}:${DB_PORT}`);
  log(`API: ${API_URL}`);

  if (!existsSync(BACKEND_DIR)) fatal(`No existe el backend en ${BACKEND_DIR}.`);
  if (!existsSync(FRONTEND_DIR)) fatal(`No existe el frontend en ${FRONTEND_DIR}.`);

  if (!existsSync(join(BACKEND_DIR, 'node_modules'))) {
    log('Instalando dependencias del backend...');
    await run('npm', ['install'], { cwd: BACKEND_DIR });
  }
  if (!existsSync(join(FRONTEND_DIR, 'node_modules'))) {
    log('Instalando dependencias del frontend...');
    await run('npm', ['install'], { cwd: FRONTEND_DIR });
  }

  await ensureDocker();
  await ensureDatabase();
  await ensureBackend();
  await validateBootstrap();
  await startFrontend();

  log('=== SEOLOCAL en ejecución. Presiona Ctrl+C para detener Vite y NestJS. PostgreSQL permanece activo. ===');

  // Mantener vivo mientras los procesos hijos corren
  while (true) {
    await sleep(1000);
  }
}

main().catch((err) => fatal(err.message));
