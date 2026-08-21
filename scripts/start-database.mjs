// SEOLOCAL v5.44.31
// Backward-compatible wrapper. Canonical identity verification lives in
// canonical-database.mjs and never creates/recreates PostgreSQL.
process.argv.push('--start-if-stopped');
await import('./canonical-database.mjs');
