import type { MarketplaceCategory } from '@/types';

function normalize(value?: string | number) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-');
}

export function resolveMarketplaceCategoryId(categories: MarketplaceCategory[], ...candidates: Array<string | undefined>) {
  for (const candidate of candidates) {
    const normalizedCandidate = normalize(candidate);
    if (!normalizedCandidate) continue;

    const match = categories.find((category) => {
      const values = [category.id, category.slug, category.name, category.queryName].map((value) => normalize(value));
      return values.includes(normalizedCandidate);
    });

    if (match) {
      const id = Number(match.id);
      if (Number.isFinite(id)) return id;
    }
  }

  return undefined;
}
