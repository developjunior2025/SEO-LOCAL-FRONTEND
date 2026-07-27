import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');
const runId = `${Date.now()}-${process.pid}`;
const stagingRoot = path.join(os.tmpdir(), 'seolocal-image-sync');
const stagingDir = path.join(stagingRoot, runId);
const legacyStagingDir = path.join(publicDir, '.image-sync-staging');

sharp.cache(false);
sharp.concurrency(1);

const preferExistingLocal =
  process.env.SEOLOCAL_FORCE_IMAGE_REDOWNLOAD !== 'true';

const source = (photoId, width = 1600) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&q=88&w=${width}`;

const recoverySources = [
  source('photo-1521737711867-e3b97375f902'),
  source('photo-1522071820081-009f0129c71c'),
  source('photo-1522202176988-66273c2fd55f'),
  source('photo-1557804506-669a67965ba0'),
  source('photo-1460925895917-afdab827c52f'),
];

const assets = [
  // Categories: all current slugs plus legacy slugs still present in old databases.
  ['category', 'auditoria-seo-local', source('photo-1507537297725-24a1c029d3ca'), 'assets/categories/auditoria-seo-local.webp', 1200, 700],
  ['category', 'google-business-profile', source('photo-1557804506-669a67965ba0'), 'assets/categories/google-business-profile.webp', 1200, 700],
  ['category', 'local-pack-y-ranking', source('photo-1460925895917-afdab827c52f'), 'assets/categories/local-pack-y-ranking.webp', 1200, 700],
  ['category', 'link-building-local', source('photo-1521737711867-e3b97375f902'), 'assets/categories/link-building-local.webp', 1200, 700],
  ['category', 'seo-tecnico-local', source('photo-1516321318423-f06f85e504b3'), 'assets/categories/seo-tecnico-local.webp', 1200, 700],
  ['category', 'seo-on-page-local', source('photo-1497366754035-f200968a6e72'), 'assets/categories/seo-on-page-local.webp', 1200, 700],
  ['category', 'reputacion-y-resenas', source('photo-1521791136368-1a46827d0adb'), 'assets/categories/reputacion-y-resenas.webp', 1200, 700],
  ['category', 'citaciones-y-nap', source('photo-1497366216548-37526070297c'), 'assets/categories/citaciones-y-nap.webp', 1200, 700],
  ['category', 'reportes-y-analytics', source('photo-1454165804606-c3d57bc86b40'), 'assets/categories/reportes-y-analytics.webp', 1200, 700],
  ['category', 'mapas-calor-local', source('photo-1477959858617-67f85cf4f1df'), 'assets/categories/mapas-calor-local.webp', 1200, 700],
  ['category', 'contenido-local', source('photo-1556761175-b413da4baf72'), 'assets/categories/contenido-local.webp', 1200, 700],
  ['category', 'seo-local-ecommerce', source('photo-1519389950473-47ba0277781c'), 'assets/categories/seo-local-ecommerce.webp', 1200, 700],
  ['category', 'consultoria', source('photo-1552664730-d307ca884978'), 'assets/categories/consultoria.webp', 1200, 700],
  ['category', 'alternativas-locales', source('photo-1556761175-5973dc0f32e7'), 'assets/categories/alternativas-locales.webp', 1200, 700],
  ['category', 'schema-local', source('photo-1516321318423-f06f85e504b3'), 'assets/categories/schema-local.webp', 1200, 700],
  ['category', 'software-y-automatizacion', source('photo-1460925895917-afdab827c52f'), 'assets/categories/software-y-automatizacion.webp', 1200, 700],

  // Agency images recovered from the original project data.ts URLs.
  ['agency', 'visibilidad-pro-seo', source('photo-1500530855697-b586d89ba3ee'), 'assets/agencies/visibilidad-pro-seo.webp', 1200, 700],
  ['agency', 'mapa-ranking-agency', source('photo-1486406146926-c627a92ad1ab'), 'assets/agencies/mapa-ranking-agency.webp', 1200, 700],
  ['agency', 'eje-cafetero-posicionamiento', source('photo-1519389950473-47ba0277781c'), 'assets/agencies/eje-cafetero-posicionamiento.webp', 1200, 700],
  ['agency', 'impulsa-local-studio', source('photo-1497366754035-f200968a6e72'), 'assets/agencies/impulsa-local-studio.webp', 1200, 700],
  ['agency', 'seo-local-colombia', source('photo-1556761175-5973dc0f32e7'), 'assets/agencies/seo-local-colombia.webp', 1200, 700],
  ['agency', 'local-rankers', source('photo-1497366216548-37526070297c'), 'assets/agencies/local-rankers.webp', 1200, 700],
  ['agency', 'seo-certero', source('photo-1454165804606-c3d57bc86b40'), 'assets/agencies/seo-certero.webp', 1200, 700],
  ['agency', 'santander-local-rank', source('photo-1552664730-d307ca884978'), 'assets/agencies/santander-local-rank.webp', 1200, 700],
  ['agency', 'estrategia-local', source('photo-1556761175-b413da4baf72'), 'assets/agencies/estrategia-local.webp', 1200, 700],

  // Hero and the two seeded team members.
  ['hero', 'home-city', source('photo-1477959858617-67f85cf4f1df', 2000), 'assets/hero/home-city.webp', 1600, 900],
  ['avatar', 'ana-torres', source('photo-1580489944761-15a19d654956', 700), 'assets/avatars/ana-torres.webp', 480, 480],
  ['avatar', 'carlos-gomez', source('photo-1500648767791-00dcc994a43e', 700), 'assets/avatars/carlos-gomez.webp', 480, 480],
].map(([type, key, url, output, width, height]) => ({
  type,
  key,
  url,
  urls: [...new Set([url, ...recoverySources])],
  output,
  width,
  height,
}));

const fallbackSvgs = {
  'assets/fallbacks/image-neutral.svg': `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700">
      <rect width="1200" height="700" fill="#F5F5F5"/>
      <rect x="390" y="220" width="420" height="260" rx="34" fill="#FFFFFF" stroke="#D1D5DB" stroke-width="8"/>
      <circle cx="500" cy="315" r="42" fill="#E5E7EB"/>
      <path d="M430 430l115-105 95 80 70-60 60 85H430z" fill="#D1D5DB"/>
      <text x="600" y="565" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#6B7280">Imagen no disponible</text>
    </svg>`,
  'assets/fallbacks/agency-default.svg': `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#101827"/><stop offset="1" stop-color="#1F2937"/></linearGradient></defs>
      <rect width="1200" height="700" fill="url(#g)"/>
      <circle cx="600" cy="300" r="110" fill="#D32323"/>
      <path d="M535 345V250l65-45 65 45v95h-45v-70h-40v70h-45z" fill="#FFFFFF"/>
      <text x="600" y="500" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="800" fill="#FFFFFF">AGENCIA SEO LOCAL</text>
      <text x="600" y="550" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" fill="#CBD5E1">Imagen pendiente de publicación</text>
    </svg>`,
  'assets/fallbacks/avatar-default.svg': `
    <svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480">
      <rect width="480" height="480" rx="80" fill="#F3F4F6"/>
      <circle cx="240" cy="175" r="85" fill="#CBD5E1"/>
      <path d="M85 430c18-105 78-155 155-155s137 50 155 155H85z" fill="#9CA3AF"/>
    </svg>`,
  'assets/fallbacks/offer-default.svg': `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700">
      <rect width="1200" height="700" fill="#FFF7F7"/>
      <circle cx="600" cy="300" r="150" fill="#D32323"/>
      <path d="M500 300h200M600 200v200" stroke="#FFFFFF" stroke-width="42" stroke-linecap="round"/>
      <text x="600" y="535" text-anchor="middle" font-family="Arial, sans-serif" font-size="58" font-weight="800" fill="#333333">OFERTA SEO LOCAL</text>
    </svg>`,
};

const categoryFallbackSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#111827"/><stop offset=".55" stop-color="#1F2937"/><stop offset="1" stop-color="#D32323"/></linearGradient></defs>
    <rect width="1200" height="700" fill="url(#g)"/>
    <circle cx="600" cy="310" r="118" fill="#FFFFFF" fill-opacity=".12" stroke="#FFFFFF" stroke-opacity=".55" stroke-width="8"/>
    <path d="M540 310h120M600 250v120" stroke="#FFFFFF" stroke-width="28" stroke-linecap="round"/>
    <text x="600" y="520" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="800" fill="#FFFFFF">CATEGORÍA SEO LOCAL</text>
  </svg>`;

async function ensureDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function sha256(filePath) {
  const content = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function removeTree(target, { required = false, label = target } = {}) {
  let lastError;

  for (let attempt = 1; attempt <= 12; attempt += 1) {
    try {
      await fs.rm(target, {
        recursive: true,
        force: true,
        maxRetries: 4,
        retryDelay: 200,
      });
      return true;
    } catch (error) {
      lastError = error;
      const code = error && typeof error === 'object' ? error.code : '';
      const retryable = ['EBUSY', 'EPERM', 'ENOTEMPTY', 'EACCES'].includes(code);

      if (!retryable || attempt === 12) break;

      console.warn(
        `[SEOLOCAL] ${label}: limpieza bloqueada (${code || 'sin código'}), reintento ${attempt}/12...`,
      );
      await sleep(350 * attempt);
    }
  }

  const message = lastError instanceof Error ? lastError.message : String(lastError);
  if (required) throw new Error(`${label}: no pudo limpiarse: ${message}`);

  console.warn(
    `[SEOLOCAL] ${label}: no pudo eliminarse ahora (${message}). No afecta las imágenes publicadas.`,
  );
  return false;
}

async function writeFileWithRetries(destination, content) {
  await ensureDir(destination);
  let lastError;

  for (let attempt = 1; attempt <= 10; attempt += 1) {
    try {
      await fs.writeFile(destination, content);
      return;
    } catch (error) {
      lastError = error;
      const code = error && typeof error === 'object' ? error.code : '';
      if (!['EBUSY', 'EPERM', 'EACCES'].includes(code) || attempt === 10) break;
      await sleep(250 * attempt);
    }
  }

  throw lastError;
}

async function copyFileWithRetries(sourcePath, destination) {
  await ensureDir(destination);
  let lastError;

  for (let attempt = 1; attempt <= 10; attempt += 1) {
    try {
      await fs.copyFile(sourcePath, destination);
      return;
    } catch (error) {
      lastError = error;
      const code = error && typeof error === 'object' ? error.code : '';
      if (!['EBUSY', 'EPERM', 'EACCES'].includes(code) || attempt === 10) break;
      console.warn(
        `[SEOLOCAL] ${path.basename(destination)}: archivo ocupado, reintento ${attempt}/10...`,
      );
      await sleep(300 * attempt);
    }
  }

  throw lastError;
}

async function prepareStaging() {
  await fs.mkdir(stagingRoot, { recursive: true });

  // V12 used a fixed directory inside public. Remove it when possible so Vite
  // does not copy stale staging content into dist. Failure is non-blocking.
  await removeTree(legacyStagingDir, {
    required: false,
    label: 'staging heredado de V12',
  });

  await removeTree(stagingDir, {
    required: true,
    label: 'staging temporal V13',
  });
  await fs.mkdir(stagingDir, { recursive: true });
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function humanize(value) {
  return String(value)
    .replaceAll('-', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function brandedSvg(asset) {
  const label = escapeXml(humanize(asset.key));
  const typeLabel = escapeXml(humanize(asset.type));

  if (asset.type === 'avatar') {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${asset.width}" height="${asset.height}" viewBox="0 0 480 480">
        <defs>
          <linearGradient id="avatar-bg" x1="0" y1="0" x2="1" y2="1">
            <stop stop-color="#F3F4F6"/>
            <stop offset="1" stop-color="#E5E7EB"/>
          </linearGradient>
        </defs>
        <rect width="480" height="480" rx="72" fill="url(#avatar-bg)"/>
        <circle cx="240" cy="172" r="82" fill="#9CA3AF"/>
        <path d="M78 438c18-112 82-166 162-166s144 54 162 166H78z" fill="#6B7280"/>
        <circle cx="378" cy="96" r="44" fill="#D32323"/>
        <path d="M357 96h42M378 75v42" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round"/>
      </svg>`;
  }

  const accent = asset.type === 'agency' ? '#0074E0' : '#D32323';
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${asset.width}" height="${asset.height}" viewBox="0 0 1200 700">
      <defs>
        <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#111827"/>
          <stop offset=".62" stop-color="#273449"/>
          <stop offset="1" stop-color="${accent}"/>
        </linearGradient>
        <pattern id="grid" width="54" height="54" patternUnits="userSpaceOnUse">
          <path d="M54 0H0V54" fill="none" stroke="#FFFFFF" stroke-opacity=".07" stroke-width="2"/>
        </pattern>
      </defs>
      <rect width="1200" height="700" fill="url(#background)"/>
      <rect width="1200" height="700" fill="url(#grid)"/>
      <circle cx="600" cy="275" r="132" fill="#FFFFFF" fill-opacity=".12" stroke="#FFFFFF" stroke-opacity=".42" stroke-width="8"/>
      <path d="M530 275h140M600 205v140" stroke="#FFFFFF" stroke-width="30" stroke-linecap="round"/>
      <text x="600" y="500" text-anchor="middle" font-family="Arial, sans-serif" font-size="52" font-weight="800" fill="#FFFFFF">${label}</text>
      <text x="600" y="558" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#FFFFFF" fill-opacity=".78">${typeLabel} · SEO LOCAL</text>
    </svg>`;
}

async function fetchBuffer(urls, label) {
  const failures = [];

  for (const url of urls) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await fetch(url, {
          redirect: 'follow',
          signal: AbortSignal.timeout(45000),
          headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 SEOLOCAL-ImageSync/2.0',
            accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          },
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.toLowerCase().startsWith('image/')) {
          throw new Error(`tipo de contenido inesperado: ${contentType || 'sin content-type'}`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        if (buffer.length < 5000) {
          throw new Error(`respuesta demasiado pequeña (${buffer.length} bytes)`);
        }

        return { buffer, resolvedUrl: url };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push(`${url} -> ${message}`);
        console.warn(`[SEOLOCAL] ${label}: fuente ${urls.indexOf(url) + 1}/${urls.length}, intento ${attempt}/3 falló: ${message}`);
        await sleep(900 * attempt);
      }
    }
  }

  throw new Error(`${label}: agotó ${urls.length} fuentes. ${failures.slice(-4).join(' | ')}`);
}

async function writeWebp(input, destination, asset) {
  const outputBuffer = await sharp(input)
    .rotate()
    .resize(asset.width, asset.height, { fit: 'cover', position: 'attention' })
    .webp({ quality: asset.type === 'avatar' ? 90 : 87, effort: 5 })
    .toBuffer();

  const metadata = await sharp(outputBuffer).metadata();
  if (
    metadata.width !== asset.width ||
    metadata.height !== asset.height ||
    metadata.format !== 'webp'
  ) {
    throw new Error(
      `${asset.output}: salida inválida ${metadata.format} ${metadata.width}x${metadata.height}`,
    );
  }

  await writeFileWithRetries(destination, outputBuffer);
}


async function tryReusePublishedAsset(asset, destination) {
  if (!preferExistingLocal) return null;

  const existing = path.join(publicDir, asset.output);

  try {
    const content = await fs.readFile(existing);
    const metadata = await sharp(content).metadata();

    if (
      metadata.format !== 'webp' ||
      metadata.width !== asset.width ||
      metadata.height !== asset.height ||
      content.length < 1500
    ) {
      return null;
    }

    await writeFileWithRetries(destination, content);
    return {
      sourceStatus: 'reused-existing',
      resolvedUrl: `local-existing:/${asset.output.replaceAll('\\', '/')}`,
      downloadError: '',
    };
  } catch {
    return null;
  }
}

async function renderRemoteAsset(asset) {
  const destination = path.join(stagingDir, asset.output);
  await ensureDir(destination);

  const reused = await tryReusePublishedAsset(asset, destination);
  if (reused) {
    console.log(`[SEOLOCAL] Reutilizada imagen local validada: ${asset.output}`);
    return {
      ...asset,
      ...reused,
    };
  }

  let sourceStatus = 'downloaded';
  let resolvedUrl = asset.url;
  let downloadError = '';

  try {
    const remote = await fetchBuffer(asset.urls, `${asset.type}/${asset.key}`);
    resolvedUrl = remote.resolvedUrl;
    await writeWebp(remote.buffer, destination, asset);
    console.log(`[SEOLOCAL] Descargada y convertida: ${asset.output}`);
  } catch (error) {
    downloadError = error instanceof Error ? error.message : String(error);
    const existing = path.join(publicDir, asset.output);

    try {
      const existingMetadata = await sharp(existing).metadata();
      if (!existingMetadata.width || !existingMetadata.height) {
        throw new Error('archivo local sin dimensiones válidas');
      }

      await writeWebp(existing, destination, asset);
      sourceStatus = 'reused-existing';
      resolvedUrl = `local-existing:/${asset.output.replaceAll('\\', '/')}`;
      console.warn(`[SEOLOCAL] Reutilizada imagen local existente: ${asset.output}`);
    } catch {
      await writeWebp(Buffer.from(brandedSvg(asset)), destination, asset);
      sourceStatus = 'generated-local';
      resolvedUrl = `generated:branded/${asset.type}/${asset.key}`;
      console.warn(`[SEOLOCAL] Generada imagen local específica como último recurso: ${asset.output}`);
    }
  }

  return {
    ...asset,
    sourceStatus,
    resolvedUrl,
    downloadError,
  };
}

async function writeFallbacks() {
  for (const [relative, svg] of Object.entries(fallbackSvgs)) {
    const destination = path.join(stagingDir, relative);
    await ensureDir(destination);
    await writeFileWithRetries(destination, Buffer.from(svg.trim(), 'utf8'));
  }

  const categoryFallback = path.join(stagingDir, 'assets/fallbacks/category-default.webp');
  await ensureDir(categoryFallback);
  const categoryFallbackBuffer = await sharp(Buffer.from(categoryFallbackSvg))
    .webp({ quality: 90 })
    .toBuffer();
  await writeFileWithRetries(categoryFallback, categoryFallbackBuffer);

  // Compatibility path used by older code and migrations.
  const compatibility = path.join(stagingDir, 'assets/categories/category-default.webp');
  await writeFileWithRetries(compatibility, categoryFallbackBuffer);
}

async function writeOffers() {
  const offers = [
    ['assets/categories/auditoria-seo-local.webp', 'assets/offers/auditoria-seo-local.webp'],
    ['assets/categories/google-business-profile.webp', 'assets/offers/google-business-profile.webp'],
  ];
  for (const [from, to] of offers) {
    const sourcePath = path.join(stagingDir, from);
    const destination = path.join(stagingDir, to);
    await ensureDir(destination);
    await copyFileWithRetries(sourcePath, destination);
  }
}

async function publish() {
  const files = [];
  async function walk(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(full);
      else files.push(full);
    }
  }
  await walk(stagingDir);

  for (const staged of files) {
    const relative = path.relative(stagingDir, staged);
    const destination = path.join(publicDir, relative);
    await ensureDir(destination);
    await copyFileWithRetries(staged, destination);
  }
}

async function main() {
  console.log(
    `[SEOLOCAL] Sincronizando ${assets.length} imágenes con reanudación local primero...`,
  );
  await prepareStaging();
  console.log(`[SEOLOCAL] Staging temporal único: ${stagingDir}`);

  const renderedAssets = [];
  for (const asset of assets) renderedAssets.push(await renderRemoteAsset(asset));
  await writeFallbacks();
  await writeOffers();

  const manifestItems = [];
  for (const asset of renderedAssets) {
    const staged = path.join(stagingDir, asset.output);
    manifestItems.push({
      type: asset.type,
      key: asset.key,
      sourceUrl: asset.resolvedUrl,
      sourceStatus: asset.sourceStatus,
      attemptedUrls: asset.urls,
      downloadError: asset.downloadError || null,
      localPath: `/${asset.output.replaceAll('\\', '/')}`,
      width: asset.width,
      height: asset.height,
      sha256: await sha256(staged),
    });
  }

  const derivedOffers = [
    ['auditoria-seo-local', 'assets/categories/auditoria-seo-local.webp', 'assets/offers/auditoria-seo-local.webp'],
    ['google-business-profile', 'assets/categories/google-business-profile.webp', 'assets/offers/google-business-profile.webp'],
  ];
  for (const [key, sourceAsset, output] of derivedOffers) {
    manifestItems.push({
      type: 'offer',
      key,
      sourceUrl: `derived:/${sourceAsset}`,
      sourceStatus: 'derived',
      attemptedUrls: [],
      downloadError: null,
      localPath: `/${output}`,
      width: 1200,
      height: 700,
      sha256: await sha256(path.join(stagingDir, output)),
    });
  }

  const manifestPath = path.join(stagingDir, 'assets/image-manifest.json');
  await ensureDir(manifestPath);
  await writeFileWithRetries(
    manifestPath,
    Buffer.from(JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: 'existing-project-references-with-multi-source-local-recovery',
        summary: {
          downloaded: manifestItems.filter((item) => item.sourceStatus === 'downloaded').length,
          reusedExisting: manifestItems.filter((item) => item.sourceStatus === 'reused-existing').length,
          generatedLocal: manifestItems.filter((item) => item.sourceStatus === 'generated-local').length,
          derived: manifestItems.filter((item) => item.sourceStatus === 'derived').length,
        },
        items: manifestItems,
      },
      null,
      2,
    ) + '\n', 'utf8'),
  );

  await publish();

  // Cleanup must never turn a successful publication into an installer failure.
  await removeTree(stagingDir, {
    required: false,
    label: 'staging temporal publicado',
  });

  const downloaded = manifestItems.filter((item) => item.sourceStatus === 'downloaded').length;
  const reused = manifestItems.filter((item) => item.sourceStatus === 'reused-existing').length;
  const generated = manifestItems.filter((item) => item.sourceStatus === 'generated-local').length;
  await writeFileWithRetries(
    path.join(publicDir, 'assets', '.image-sync-v16-complete'),
    Buffer.from(`${new Date().toISOString()}\n`, 'utf8'),
  );

  console.log(
    `[SEOLOCAL] Sincronización terminada y publicada: ${downloaded} descargadas, ${reused} reutilizadas, ${generated} generadas localmente y fallbacks separados.`,
  );
}

main().catch((error) => {
  console.error(`[SEOLOCAL ERROR] ${error.stack || error.message}`);
  process.exit(1);
});
