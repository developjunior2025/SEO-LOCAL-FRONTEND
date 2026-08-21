import { execFileSync, spawn } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
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
  log(
    `Verificando identidad PostgreSQL canonica en ${DB_HOST}:${DB_PORT}...`,
  );
  await run('npm', ['run', 'dev:database'], { cwd: FRONTEND_DIR });
  await waitForPort(DB_HOST, DB_PORT, 120000, 'PostgreSQL canonico');
  log(
    'PostgreSQL canonico verificado por container, volumen y system_identifier.',
  );
}

function latestSourceMtime(directory) {
  let latest = 0;
  if (!existsSync(directory)) return latest;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) latest = Math.max(latest, latestSourceMtime(full));
    else if (entry.isFile() && entry.name.endsWith('.ts')) latest = Math.max(latest, statSync(full).mtimeMs);
  }
  return latest;
}

function backendBuildId() {
  const entry = join(BACKEND_DIR, 'dist', 'main.js');
  if (!existsSync(entry)) return '';
  const stat = statSync(entry);
  return `${Math.trunc(stat.mtimeMs)}-${stat.size}`;
}

async function prepareBackendBuild() {
  const entry = join(BACKEND_DIR, 'dist', 'main.js');
  const distMtime = existsSync(entry) ? statSync(entry).mtimeMs : 0;
  const srcMtime = latestSourceMtime(join(BACKEND_DIR, 'src'));
  if (!existsSync(entry) || srcMtime > distMtime) {
    log('El codigo backend es mas nuevo que dist/main.js. Compilando antes de validar el runtime...');
    await run('npm', ['run', 'build'], { cwd: BACKEND_DIR });
  }
  const buildId = backendBuildId();
  if (!buildId) fatal('No se pudo calcular la version compilada del backend.');
  return buildId;
}

function powershell(command) {
  return execFileSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', command],
    { encoding: 'utf8', windowsHide: true },
  ).trim();
}

async function stopOwnedBackendOnWindows() {
  if (process.platform !== 'win32') return false;
  let pidText = '';
  try {
    pidText = powershell(`$c = Get-NetTCPConnection -LocalPort ${API_PORT} -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1; if ($c) { $c.OwningProcess }`);
  } catch {
    return false;
  }
  const pid = Number(pidText);
  if (!Number.isInteger(pid) || pid <= 0) return false;

  let commandLine = '';
  try {
    commandLine = powershell(`$p = Get-CimInstance Win32_Process -Filter \"ProcessId = ${pid}\" -ErrorAction SilentlyContinue; if ($p) { $p.CommandLine }`);
  } catch {
    return false;
  }

  const normalizedCommand = commandLine.replaceAll('\\', '/').toLowerCase();
  const normalizedBackend = BACKEND_DIR.replaceAll('\\', '/').toLowerCase();
  if (!normalizedCommand.includes(normalizedBackend) && !normalizedCommand.includes('seo-local-backend-main')) {
    fatal(`El puerto ${API_PORT} usa PID ${pid}, pero no parece ser SEOLOCAL. No se cerrara automaticamente.`);
  }

  log(`Backend SEOLOCAL desactualizado detectado (PID ${pid}). Reiniciando de forma controlada...`);
  try {
    execFileSync('taskkill.exe', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
  } catch (error) {
    fatal(`No se pudo detener el backend SEOLOCAL PID ${pid}: ${error.message}`);
  }

  const started = Date.now();
  while (Date.now() - started < 15000) {
    if (!(await checkPort('127.0.0.1', API_PORT))) return true;
    await sleep(300);
  }
  fatal(`El backend PID ${pid} fue detenido, pero el puerto ${API_PORT} sigue ocupado.`);
}

async function ensureBackend() {
  const expectedBuildId = await prepareBackendBuild();
  log(`Verificando backend NestJS en ${HEALTH_URL}... Build esperado: ${expectedBuildId}`);

  try {
    const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const body = await res.json();
      if (body.ok && body.database === 'connected' && body.runtimeBuildId === expectedBuildId) {
        log(`Backend saludable y actualizado (${expectedBuildId}). Se reutiliza.`);
        return;
      }
      if (body.ok && body.database === 'connected') {
        log(`Backend saludable pero desactualizado: runtime=${body.runtimeBuildId ?? 'legacy'} / disco=${expectedBuildId}.`);
        await stopOwnedBackendOnWindows();
      }
    }
  } catch {
    // not running or not ready
  }

  if (await checkPort('127.0.0.1', API_PORT)) {
    const stopped = await stopOwnedBackendOnWindows();
    if (!stopped && (await checkPort('127.0.0.1', API_PORT))) {
      fatal(`El puerto ${API_PORT} esta ocupado por otro proceso. Cierra ese proceso antes de continuar.`);
    }
  }

  log('Iniciando backend NestJS compilado y actualizado...');
  for (const file of ['tsconfig.tsbuildinfo', 'tsconfig.build.tsbuildinfo']) {
    const p = join(BACKEND_DIR, file);
    if (existsSync(p)) rmSync(p);
  }
  // Build was already prepared above. start:prod avoids recompiling after the build id was calculated.
  spawnPersistent('npm', ['run', 'start:prod'], {
    cwd: BACKEND_DIR,
    env: { SEOLOCAL_BUILD_ID: expectedBuildId },
  });
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
