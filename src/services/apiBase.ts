const DEFAULT_API_PORT = '4001';
const DEFAULT_API_PREFIX = '/api/v1';

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, '');
}

export const DEFAULT_API_BASE = `http://localhost:${DEFAULT_API_PORT}${DEFAULT_API_PREFIX}`;

export function resolveApiBases() {
  const configured = import.meta.env.VITE_API_URL;
  if (configured) return [trimTrailingSlash(String(configured))];

  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';

  return Array.from(new Set([
    `${protocol}//${host}:${DEFAULT_API_PORT}${DEFAULT_API_PREFIX}`,
    `http://127.0.0.1:${DEFAULT_API_PORT}${DEFAULT_API_PREFIX}`,
    DEFAULT_API_BASE,
  ]));
}

export function getPrimaryApiBase() {
  return resolveApiBases()[0] || DEFAULT_API_BASE;
}
