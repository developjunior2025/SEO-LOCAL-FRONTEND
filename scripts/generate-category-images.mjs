import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '..', 'public', 'assets', 'categories');

if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

const WIDTH = 1200;
const HEIGHT = 700;
const DARK = '#0B0F19';
const DARKER = '#070A10';
const RED = '#D32323';
const BLUE = '#0074E0';
const WHITE = '#FFFFFF';

function baseSvg(content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${DARK}"/>
        <stop offset="100%" stop-color="${DARKER}"/>
      </linearGradient>
      <radialGradient id="glow-red" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${RED}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="${RED}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="glow-blue" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${BLUE}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="${BLUE}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
    ${content}
  </svg>`;
}

const CATEGORIES = {
  'auditoria-seo-local': () => {
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;
    return baseSvg(`
      <circle cx="${cx}" cy="${cy}" r="220" fill="url(#glow-red)"/>
      <circle cx="${cx}" cy="${cy}" r="180" fill="none" stroke="${RED}" stroke-width="3" opacity="0.6"/>
      <circle cx="${cx}" cy="${cy}" r="120" fill="none" stroke="${BLUE}" stroke-width="3" opacity="0.5"/>
      <line x1="${cx - 90}" y1="${cy - 90}" x2="${cx + 90}" y2="${cy + 90}" stroke="${RED}" stroke-width="4" opacity="0.8"/>
      <line x1="${cx - 90}" y1="${cy + 90}" x2="${cx + 90}" y2="${cy - 90}" stroke="${RED}" stroke-width="4" opacity="0.8"/>
      <circle cx="${cx}" cy="${cy}" r="30" fill="${WHITE}" opacity="0.9"/>
      <rect x="${cx + 35}" y="${cy + 35}" width="80" height="12" fill="${RED}" transform="rotate(45 ${cx + 35} ${cy + 35})"/>
      <circle cx="${cx + 85}" cy="${cy + 85}" r="18" fill="none" stroke="${RED}" stroke-width="5"/>
    `);
  },
  'google-business-profile': () => {
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2 + 40;
    return baseSvg(`
      <circle cx="${cx - 100}" cy="${cy - 150}" r="160" fill="url(#glow-blue)"/>
      <path d="M${cx - 60} ${cy} L${cx} ${cy - 120} L${cx + 60} ${cy} Z" fill="${RED}" opacity="0.9"/>
      <circle cx="${cx}" cy="${cy}" r="90" fill="none" stroke="${BLUE}" stroke-width="6" opacity="0.8"/>
      <circle cx="${cx}" cy="${cy}" r="55" fill="${BLUE}" opacity="0.25"/>
      <rect x="${cx - 140}" y="${cy + 20}" width="280" height="120" rx="8" fill="${WHITE}" opacity="0.06"/>
      <rect x="${cx - 120}" y="${cy + 40}" width="240" height="16" rx="4" fill="${WHITE}" opacity="0.15"/>
      <rect x="${cx - 120}" y="${cy + 72}" width="160" height="12" rx="3" fill="${WHITE}" opacity="0.1"/>
    `);
  },
  'local-pack-y-ranking': () => {
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2 + 30;
    return baseSvg(`
      <circle cx="${cx + 120}" cy="${cy - 180}" r="160" fill="url(#glow-red)"/>
      <rect x="${cx - 160}" y="${cy}" width="100" height="200" rx="6" fill="${WHITE}" opacity="0.08"/>
      <rect x="${cx - 40}" y="${cy - 80}" width="100" height="280" rx="6" fill="${RED}" opacity="0.85"/>
      <rect x="${cx + 80}" y="${cy - 40}" width="100" height="240" rx="6" fill="${BLUE}" opacity="0.7"/>
      <circle cx="${cx - 110}" cy="${cy - 30}" r="22" fill="none" stroke="${WHITE}" stroke-width="3" opacity="0.3"/>
      <circle cx="${cx + 10}" cy="${cy - 110}" r="28" fill="none" stroke="${WHITE}" stroke-width="4" opacity="0.4"/>
      <circle cx="${cx + 130}" cy="${cy - 70}" r="22" fill="none" stroke="${WHITE}" stroke-width="3" opacity="0.3"/>
    `);
  },
  'link-building-local': () => {
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;
    return baseSvg(`
      <circle cx="${cx - 200}" cy="${cy}" r="180" fill="url(#glow-blue)"/>
      <circle cx="${cx - 180}" cy="${cy - 60}" r="50" fill="${RED}" opacity="0.9"/>
      <circle cx="${cx + 180}" cy="${cy - 60}" r="50" fill="${BLUE}" opacity="0.9"/>
      <circle cx="${cx}" cy="${cy + 120}" r="50" fill="${WHITE}" opacity="0.15"/>
      <line x1="${cx - 140}" y1="${cy - 50}" x2="${cx + 140}" y2="${cy - 50}" stroke="${RED}" stroke-width="5" opacity="0.8"/>
      <line x1="${cx - 135}" y1="${cy - 45}" x2="${cx}" y2="${cy + 90}" stroke="${BLUE}" stroke-width="5" opacity="0.7"/>
      <line x1="${cx + 135}" y1="${cy - 45}" x2="${cx}" y2="${cy + 90}" stroke="${WHITE}" stroke-width="5" opacity="0.3"/>
    `);
  },
  'seo-tecnico-local': () => {
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;
    return baseSvg(`
      <circle cx="${cx + 150}" cy="${cy - 150}" r="170" fill="url(#glow-red)"/>
      <circle cx="${cx}" cy="${cy}" r="140" fill="none" stroke="${BLUE}" stroke-width="3" stroke-dasharray="20 12" opacity="0.7"/>
      <circle cx="${cx}" cy="${cy}" r="90" fill="none" stroke="${RED}" stroke-width="4" opacity="0.8"/>
      <rect x="${cx - 80}" y="${cy - 80}" width="160" height="160" rx="12" fill="${WHITE}" opacity="0.06"/>
      <rect x="${cx - 50}" y="${cy - 50}" width="100" height="100" rx="8" fill="${BLUE}" opacity="0.3"/>
      <circle cx="${cx}" cy="${cy}" r="22" fill="${RED}"/>
    `);
  },
  'seo-on-page-local': () => {
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;
    return baseSvg(`
      <circle cx="${cx - 150}" cy="${cy + 120}" r="170" fill="url(#glow-blue)"/>
      <rect x="${cx - 200}" y="${cy - 220}" width="400" height="440" rx="14" fill="${WHITE}" opacity="0.06"/>
      <rect x="${cx - 170}" y="${cy - 190}" width="340" height="50" rx="6" fill="${RED}" opacity="0.8"/>
      <rect x="${cx - 170}" y="${cy - 110}" width="220" height="20" rx="4" fill="${WHITE}" opacity="0.2"/>
      <rect x="${cx - 170}" y="${cy - 70}" width="300" height="16" rx="3" fill="${WHITE}" opacity="0.12"/>
      <rect x="${cx - 170}" y="${cy - 40}" width="260" height="16" rx="3" fill="${WHITE}" opacity="0.12"/>
      <rect x="${cx - 170}" y="${cy + 20}" width="160" height="120" rx="6" fill="${BLUE}" opacity="0.25"/>
      <rect x="${cx + 10}" y="${cy + 20}" width="160" height="120" rx="6" fill="${BLUE}" opacity="0.15"/>
    `);
  },
  'reputacion-y-resenas': () => {
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;
    return baseSvg(`
      <circle cx="${cx}" cy="${cy - 120}" r="160" fill="url(#glow-red)"/>
      <polygon points="${cx - 120},${cy} ${cx - 88},${cy + 90} ${cx - 170},${cy + 34} ${cx - 70},${cy + 34} ${cx - 108},${cy + 90}" fill="${RED}" opacity="0.9"/>
      <polygon points="${cx},${cy} ${cx + 32},${cy + 90} ${cx - 50},${cy + 34} ${cx + 50},${cy + 34} ${cx + 12},${cy + 90}" fill="${RED}" opacity="0.9"/>
      <polygon points="${cx + 120},${cy} ${cx + 152},${cy + 90} ${cx + 70},${cy + 34} ${cx + 170},${cy + 34} ${cx + 132},${cy + 90}" fill="${WHITE}" opacity="0.15"/>
      <rect x="${cx - 160}" y="${cy + 120}" width="320" height="80" rx="10" fill="${WHITE}" opacity="0.06"/>
      <rect x="${cx - 140}" y="${cy + 140}" width="200" height="14" rx="3" fill="${WHITE}" opacity="0.15"/>
      <rect x="${cx - 140}" y="${cy + 168}" width="140" height="12" rx="3" fill="${WHITE}" opacity="0.1"/>
    `);
  },
  'citaciones-y-nap': () => {
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;
    return baseSvg(`
      <circle cx="${cx + 180}" cy="${cy - 120}" r="170" fill="url(#glow-blue)"/>
      <circle cx="${cx - 150}" cy="${cy - 80}" r="45" fill="${RED}" opacity="0.9"/>
      <circle cx="${cx + 150}" cy="${cy - 80}" r="45" fill="${BLUE}" opacity="0.9"/>
      <circle cx="${cx - 150}" cy="${cy + 100}" r="45" fill="${BLUE}" opacity="0.6"/>
      <circle cx="${cx + 150}" cy="${cy + 100}" r="45" fill="${RED}" opacity="0.6"/>
      <circle cx="${cx}" cy="${cy}" r="55" fill="${WHITE}" opacity="0.15"/>
      <line x1="${cx - 110}" y1="${cy - 80}" x2="${cx + 110}" y2="${cy - 80}" stroke="${WHITE}" stroke-width="3" opacity="0.3"/>
      <line x1="${cx - 110}" y1="${cy + 100}" x2="${cx + 110}" y2="${cy + 100}" stroke="${WHITE}" stroke-width="3" opacity="0.3"/>
      <line x1="${cx}" y1="${cy - 45}" x2="${cx}" y2="${cy + 45}" stroke="${WHITE}" stroke-width="3" opacity="0.3"/>
    `);
  },
  'reportes-y-analytics': () => {
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2 + 30;
    return baseSvg(`
      <circle cx="${cx - 180}" cy="${cy - 120}" r="160" fill="url(#glow-red)"/>
      <rect x="${cx - 200}" y="${cy}" width="50" height="160" rx="4" fill="${WHITE}" opacity="0.12"/>
      <rect x="${cx - 130}" y="${cy - 60}" width="50" height="220" rx="4" fill="${BLUE}" opacity="0.7"/>
      <rect x="${cx - 60}" y="${cy - 120}" width="50" height="280" rx="4" fill="${RED}" opacity="0.85"/>
      <rect x="${cx + 10}" y="${cy - 40}" width="50" height="200" rx="4" fill="${BLUE}" opacity="0.5"/>
      <rect x="${cx + 80}" y="${cy - 90}" width="50" height="250" rx="4" fill="${WHITE}" opacity="0.18"/>
      <rect x="${cx + 150}" y="${cy - 30}" width="50" height="190" rx="4" fill="${BLUE}" opacity="0.4"/>
      <polyline points="${cx - 175},${cy + 120} ${cx - 105},${cy + 40} ${cx - 35},${cy + 70} ${cx + 35},${cy + 20} ${cx + 105},${cy + 50} ${cx + 175},${cy + 10}" fill="none" stroke="${RED}" stroke-width="4" opacity="0.9"/>
    `);
  },
  'mapas-calor-local': () => {
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;
    let rects = '';
    const cols = 14;
    const rows = 8;
    const rw = 56;
    const rh = 56;
    const ox = cx - (cols * rw) / 2 + 20;
    const oy = cy - (rows * rh) / 2 + 20;
    const colors = [RED, BLUE, WHITE];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dist = Math.sqrt(Math.pow(c - cols / 2, 2) + Math.pow(r - rows / 2, 2));
        const idx = Math.floor((dist / 6 + r * 0.3) % colors.length);
        const opacity = Math.max(0.15, 1 - dist / 8).toFixed(2);
        rects += `<rect x="${ox + c * rw}" y="${oy + r * rh}" width="${rw - 8}" height="${rh - 8}" rx="4" fill="${colors[idx]}" opacity="${opacity}"/>`;
      }
    }
    return baseSvg(`
      <circle cx="${cx}" cy="${cy}" r="200" fill="url(#glow-blue)"/>
      ${rects}
    `);
  },
  'contenido-local': () => {
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;
    return baseSvg(`
      <circle cx="${cx + 160}" cy="${cy + 120}" r="170" fill="url(#glow-red)"/>
      <rect x="${cx - 120}" y="${cy - 160}" width="240" height="320" rx="10" fill="${WHITE}" opacity="0.06"/>
      <rect x="${cx - 90}" y="${cy - 130}" width="180" height="24" rx="4" fill="${RED}" opacity="0.8"/>
      <rect x="${cx - 90}" y="${cy - 80}" width="180" height="12" rx="2" fill="${WHITE}" opacity="0.15"/>
      <rect x="${cx - 90}" y="${cy - 55}" width="180" height="12" rx="2" fill="${WHITE}" opacity="0.15"/>
      <rect x="${cx - 90}" y="${cy - 30}" width="140" height="12" rx="2" fill="${WHITE}" opacity="0.15"/>
      <rect x="${cx - 90}" y="${cy + 20}" width="180" height="90" rx="6" fill="${BLUE}" opacity="0.25"/>
      <path d="M${cx + 60} ${cy - 170} L${cx + 110} ${cy - 120} L${cx + 60} ${cy - 70} L${cx + 10} ${cy - 120} Z" fill="${RED}" opacity="0.9"/>
    `);
  },
  'seo-local-ecommerce': () => {
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2 + 20;
    return baseSvg(`
      <circle cx="${cx - 180}" cy="${cy - 120}" r="160" fill="url(#glow-blue)"/>
      <rect x="${cx - 130}" y="${cy - 90}" width="260" height="200" rx="14" fill="${WHITE}" opacity="0.06"/>
      <path d="M${cx - 80} ${cy - 30} Q${cx - 80} ${cy - 70} ${cx - 40} ${cy - 70} Q${cx} ${cy - 70} ${cx} ${cy - 30}" fill="none" stroke="${RED}" stroke-width="5"/>
      <circle cx="${cx - 45}" cy="${cy + 10}" r="10" fill="${BLUE}" opacity="0.8"/>
      <circle cx="${cx + 35}" cy="${cy + 10}" r="10" fill="${BLUE}" opacity="0.8"/>
      <rect x="${cx - 90}" y="${cy + 35}" width="180" height="14" rx="3" fill="${RED}" opacity="0.8"/>
      <rect x="${cx - 160}" y="${cy - 120}" width="80" height="80" rx="8" fill="${BLUE}" opacity="0.25"/>
      <rect x="${cx + 80}" y="${cy - 120}" width="80" height="80" rx="8" fill="${BLUE}" opacity="0.15"/>
      <rect x="${cx - 160}" y="${cy + 40}" width="80" height="80" rx="8" fill="${BLUE}" opacity="0.15"/>
      <rect x="${cx + 80}" y="${cy + 40}" width="80" height="80" rx="8" fill="${BLUE}" opacity="0.25"/>
    `);
  },
  'consultoria': () => {
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;
    return baseSvg(`
      <circle cx="${cx}" cy="${cy}" r="190" fill="url(#glow-red)"/>
      <circle cx="${cx}" cy="${cy}" r="150" fill="none" stroke="${WHITE}" stroke-width="2" opacity="0.15"/>
      <circle cx="${cx}" cy="${cy}" r="110" fill="none" stroke="${BLUE}" stroke-width="3" opacity="0.6"/>
      <circle cx="${cx}" cy="${cy}" r="70" fill="none" stroke="${RED}" stroke-width="3" opacity="0.8"/>
      <circle cx="${cx}" cy="${cy}" r="22" fill="${WHITE}" opacity="0.9"/>
      <line x1="${cx}" y1="${cy - 150}" x2="${cx}" y2="${cy - 22}" stroke="${RED}" stroke-width="5" opacity="0.8"/>
      <polygon points="${cx - 12},${cy - 36} ${cx + 12},${cy - 36} ${cx},${cy - 14}" fill="${RED}"/>
      <line x1="${cx + 22}" y1="${cy}" x2="${cx + 150}" y2="${cy}" stroke="${BLUE}" stroke-width="5" opacity="0.7"/>
    `);
  },
  'category-default': () => {
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;
    return baseSvg(`
      <circle cx="${cx}" cy="${cy}" r="180" fill="url(#glow-blue)"/>
      <circle cx="${cx}" cy="${cy}" r="130" fill="none" stroke="${RED}" stroke-width="3" opacity="0.6"/>
      <circle cx="${cx}" cy="${cy}" r="80" fill="none" stroke="${BLUE}" stroke-width="3" opacity="0.6"/>
      <circle cx="${cx}" cy="${cy}" r="30" fill="${WHITE}" opacity="0.9"/>
    `);
  },
};

async function main() {
  for (const [slug, factory] of Object.entries(CATEGORIES)) {
    const svg = factory();
    const outPath = join(OUTPUT_DIR, `${slug}.webp`);
    await sharp(Buffer.from(svg))
      .resize(WIDTH, HEIGHT, { fit: 'cover' })
      .webp({ quality: 90 })
      .toFile(outPath);
    console.log(`Generated ${outPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
