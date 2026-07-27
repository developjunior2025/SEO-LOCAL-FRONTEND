import { describe, expect, it } from 'vitest';
import { getAgencyImage, getCategoryImage, IMAGE_FALLBACKS } from './imageAssets';

describe('image asset resolution', () => {
  it('resolves a known agency without using the category fallback', () => {
    expect(getAgencyImage('visibilidad-pro-seo', null)).toBe('/assets/agencies/visibilidad-pro-seo.webp');
  });

  it('resolves category aliases and legacy slugs', () => {
    expect(getCategoryImage('local-audit', null)).toBe('/assets/categories/auditoria-seo-local.webp');
  });

  it('uses domain-specific fallbacks', () => {
    expect(getAgencyImage('unknown', null)).toBe(IMAGE_FALLBACKS.agency);
    expect(getCategoryImage('unknown', null)).toBe(IMAGE_FALLBACKS.category);
  });
});
