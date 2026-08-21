import { execFileSync, spawnSync } from 'node:child_process';
import net from 'node:net';

const CANONICAL = Object.freeze({
  container: 'seo-local-postgres',
  host: '127.0.0.1',
  hostPort: 5434,
  containerPort: '5432/tcp',
  database: 'seo_local',
  user: 'seo_local',
  pgdata: '/var/lib/postgresql/data',
  volume: '3c243c7b24ac52b599513950d42022cbb42fb604dbbf4da23344c9feece898d6',
  systemIdentifier: '7665735623965016098',
  tableCount: 76,
  migrationCount: 12,
  v19Timestamp: 1784839000000,
  v19Name: 'UtilidadesEnginesV191784839000000',
});

const START_IF_STOPPED = process.argv.includes('--start-if-stopped');
const VERIFY_ONLY = process.argv.includes('--verify') || !START_IF_STOPPED;

function log(...args) {
  console.log('[SEOLOCAL CANONICAL DB]', ...args);
}

function fatal(...args) {
  console.error('[SEOLOCAL CANONICAL DB ERROR]', ...args);
  process.exit(1);
}

function docker(args, options = {}) {
  const result = spawnSync('docker.exe', args, {
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 32 * 1024 * 1024,
    ...options,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || '').trim());
  }

  return String(result.stdout || '');
}

function inspectContainer() {
  const raw = docker(['inspect', CANONICAL.container]);
  const rows = JSON.parse(raw);
  if (!Array.isArray(rows) || !rows[0]) {
    throw new Error(`docker inspect returned no data for ${CANONICAL.container}.`);
  }
  return rows[0];
}

function envValue(entries, key) {
  const prefix = `${key}=`;
  const hit = (entries || []).find((entry) => String(entry).startsWith(prefix));
  return hit ? String(hit).slice(prefix.length) : null;
}

function coveringMount(pgdata, mounts) {
  const normalizedPgData = String(pgdata || '').replace(/\/+$/, '');
  const candidates = (mounts || [])
    .filter((mount) => {
      const destination = String(mount.Destination || '').replace(/\/+$/, '');
      return (
        destination &&
        (destination === normalizedPgData ||
          normalizedPgData.startsWith(`${destination}/`))
      );
    })
    .sort(
      (a, b) =>
        String(b.Destination || '').length -
        String(a.Destination || '').length,
    );

  return candidates[0] || null;
}

function publishedHostPorts(inspect) {
  const result = [];
  const ports = inspect?.HostConfig?.PortBindings || {};

  for (const [containerPort, bindings] of Object.entries(ports)) {
    for (const binding of bindings || []) {
      const hostPort = Number(binding?.HostPort || 0);
      if (hostPort) result.push({ containerPort, hostPort });
    }
  }

  return result;
}

function checkPort(host, port, timeoutMs = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);

    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

async function waitForPort(host, port, timeoutMs = 120000) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    if (await checkPort(host, port)) return;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Timeout waiting for ${host}:${port}.`);
}

function psqlReadOnly(sql) {
  return docker([
    'exec',
    '-e',
    'PGOPTIONS=-c default_transaction_read_only=on -c statement_timeout=12000',
    '-e',
    'PGAPPNAME=seolocal-canonical-runtime-v54431',
    CANONICAL.container,
    'psql',
    '-X',
    '-q',
    '-A',
    '-t',
    '-F',
    '|',
    '-v',
    'ON_ERROR_STOP=1',
    '-U',
    CANONICAL.user,
    '-d',
    CANONICAL.database,
    '-c',
    sql,
  ])
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function validateStaticIdentity(inspect) {
  if (!String(inspect?.Config?.Image || '').includes('postgres')) {
    throw new Error(`${CANONICAL.container} is not a PostgreSQL image.`);
  }

  const pgdata = envValue(inspect?.Config?.Env, 'PGDATA');
  const database = envValue(inspect?.Config?.Env, 'POSTGRES_DB');
  const user = envValue(inspect?.Config?.Env, 'POSTGRES_USER');

  if (pgdata !== CANONICAL.pgdata) {
    throw new Error(`PGDATA=${pgdata}; expected ${CANONICAL.pgdata}.`);
  }
  if (database !== CANONICAL.database) {
    throw new Error(
      `POSTGRES_DB=${database}; expected ${CANONICAL.database}.`,
    );
  }
  if (user !== CANONICAL.user) {
    throw new Error(`POSTGRES_USER=${user}; expected ${CANONICAL.user}.`);
  }

  const mount = coveringMount(pgdata, inspect?.Mounts || []);
  if (!mount || mount.Name !== CANONICAL.volume) {
    throw new Error(
      `Canonical volume=${mount?.Name || '(none)'}; expected ${CANONICAL.volume}.`,
    );
  }

  const portBindings = publishedHostPorts(inspect);
  const expectedBinding = portBindings.some(
    (binding) =>
      binding.containerPort === CANONICAL.containerPort &&
      binding.hostPort === CANONICAL.hostPort,
  );

  if (!expectedBinding) {
    throw new Error(
      `${CANONICAL.container} is not configured for host port ${CANONICAL.hostPort}->5432.`,
    );
  }

  return { mount, pgdata, database, user };
}

function validateLiveIdentity() {
  const readOnly = psqlReadOnly(
    "SELECT current_setting('default_transaction_read_only');",
  )[0];

  if (readOnly !== 'on') {
    throw new Error(`Read-only verification guard returned ${readOnly}.`);
  }

  const systemIdentifier = psqlReadOnly(
    'SELECT system_identifier::text FROM pg_control_system();',
  )[0];

  if (systemIdentifier !== CANONICAL.systemIdentifier) {
    throw new Error(
      `system_identifier=${systemIdentifier}; expected ${CANONICAL.systemIdentifier}.`,
    );
  }

  const tableCount = Number(
    psqlReadOnly(
      "SELECT COUNT(*) FROM pg_stat_user_tables WHERE schemaname='public';",
    )[0],
  );

  if (tableCount !== CANONICAL.tableCount) {
    throw new Error(
      `public user table count=${tableCount}; expected ${CANONICAL.tableCount}.`,
    );
  }

  const migrationCount = Number(
    psqlReadOnly('SELECT COUNT(*) FROM public.seo_schema_migration;')[0],
  );

  if (migrationCount !== CANONICAL.migrationCount) {
    throw new Error(
      `migration count=${migrationCount}; expected ${CANONICAL.migrationCount}.`,
    );
  }

  const v19Count = Number(
    psqlReadOnly(
      `SELECT COUNT(*) FROM public.seo_schema_migration WHERE timestamp=${CANONICAL.v19Timestamp} AND name='${CANONICAL.v19Name}';`,
    )[0],
  );

  if (v19Count !== 1) {
    throw new Error(`V19 migration row count=${v19Count}; expected 1.`);
  }

  return { systemIdentifier, tableCount, migrationCount, v19Count };
}

async function main() {
  log('Canonical database contract v5.44.31');
  log(
    `${CANONICAL.container} -> ${CANONICAL.host}:${CANONICAL.hostPort}/${CANONICAL.database}`,
  );

  docker(['info']);

  let inspect;
  try {
    inspect = inspectContainer();
  } catch (error) {
    fatal(
      `${CANONICAL.container} is missing or cannot be inspected. ` +
        'No replacement container will be created automatically.',
      error.message,
    );
  }

  const staticIdentity = validateStaticIdentity(inspect);
  log(`Canonical volume verified: ${staticIdentity.mount.Name}`);

  let running = Boolean(inspect?.State?.Running);

  if (!running) {
    if (VERIFY_ONLY) {
      fatal(
        `${CANONICAL.container} is stopped. Verification mode never starts it.`,
      );
    }

    const portOccupied = await checkPort(CANONICAL.host, CANONICAL.hostPort);
    if (portOccupied) {
      fatal(
        `Port ${CANONICAL.hostPort} is already occupied while ${CANONICAL.container} is stopped. ` +
          'Refusing to start anything.',
      );
    }

    log(`Starting existing canonical container ${CANONICAL.container}...`);
    docker(['start', CANONICAL.container]);
    await waitForPort(CANONICAL.host, CANONICAL.hostPort);
    running = true;
  }

  if (!running) {
    fatal(`${CANONICAL.container} could not be started.`);
  }

  const portReady = await checkPort(CANONICAL.host, CANONICAL.hostPort);
  if (!portReady) {
    fatal(
      `${CANONICAL.container} is running but ${CANONICAL.hostPort} is not reachable.`,
    );
  }

  const live = validateLiveIdentity();

  log(`system_identifier=${live.systemIdentifier}`);
  log(`tables=${live.tableCount}`);
  log(`migrations=${live.migrationCount}`);
  log('V19 migration row=1');
  log('CANONICAL_DB_STATUS=VERIFIED');
}

main().catch((error) => fatal(error?.message || String(error)));
