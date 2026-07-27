export const IMAGE_FALLBACKS = {
  neutral: '/assets/fallbacks/image-neutral.svg',
  category: '/assets/fallbacks/category-default.webp',
  agency: '/assets/fallbacks/agency-default.svg',
  avatar: '/assets/fallbacks/avatar-default.svg',
  offer: '/assets/fallbacks/offer-default.svg',
} as const;

export const CATEGORY_IMAGE_BY_SLUG: Record<string, string> = {
  'auditoria-seo-local': '/assets/categories/auditoria-seo-local.webp',
  'google-business-profile': '/assets/categories/google-business-profile.webp',
  'local-pack-y-ranking': '/assets/categories/local-pack-y-ranking.webp',
  'link-building-local': '/assets/categories/link-building-local.webp',
  'seo-tecnico-local': '/assets/categories/seo-tecnico-local.webp',
  'seo-on-page-local': '/assets/categories/seo-on-page-local.webp',
  'reputacion-y-resenas': '/assets/categories/reputacion-y-resenas.webp',
  'citaciones-y-nap': '/assets/categories/citaciones-y-nap.webp',
  'reportes-y-analytics': '/assets/categories/reportes-y-analytics.webp',
  'mapas-calor-local': '/assets/categories/mapas-calor-local.webp',
  'contenido-local': '/assets/categories/contenido-local.webp',
  'seo-local-ecommerce': '/assets/categories/seo-local-ecommerce.webp',
  consultoria: '/assets/categories/consultoria.webp',
  'alternativas-locales': '/assets/categories/alternativas-locales.webp',
  'schema-local': '/assets/categories/schema-local.webp',
  'software-y-automatizacion': '/assets/categories/software-y-automatizacion.webp',
  'gpb-optimization': '/assets/categories/google-business-profile.webp',
  'local-pack': '/assets/categories/local-pack-y-ranking.webp',
  'local-audit': '/assets/categories/auditoria-seo-local.webp',
  'local-links': '/assets/categories/link-building-local.webp',
  'local-content': '/assets/categories/contenido-local.webp',
  'review-management': '/assets/categories/reputacion-y-resenas.webp',
};

export const AGENCY_IMAGE_BY_SLUG: Record<string, string> = {
  'visibilidad-pro-seo': '/assets/agencies/visibilidad-pro-seo.webp',
  'mapa-ranking-agency': '/assets/agencies/mapa-ranking-agency.webp',
  'eje-cafetero-posicionamiento': '/assets/agencies/eje-cafetero-posicionamiento.webp',
  'impulsa-local-studio': '/assets/agencies/impulsa-local-studio.webp',
  'seo-local-colombia': '/assets/agencies/seo-local-colombia.webp',
  'local-rankers': '/assets/agencies/local-rankers.webp',
  'seo-certero': '/assets/agencies/seo-certero.webp',
  'santander-local-rank': '/assets/agencies/santander-local-rank.webp',
  'estrategia-local': '/assets/agencies/estrategia-local.webp',
};

function isLocalAsset(value?: string | null): value is string {
  return Boolean(value && value.startsWith('/assets/'));
}

export function getCategoryImage(slug: string, imageUrl?: string | null): string {
  if (isLocalAsset(imageUrl) && !imageUrl.includes('/category-default.')) return imageUrl;
  return CATEGORY_IMAGE_BY_SLUG[slug] || IMAGE_FALLBACKS.category;
}

export function getAgencyImage(slug: string, imageUrl?: string | null): string {
  if (isLocalAsset(imageUrl) && !imageUrl.includes('/category-default.')) return imageUrl;
  return AGENCY_IMAGE_BY_SLUG[slug] || IMAGE_FALLBACKS.agency;
}

export function getAvatarImage(imageUrl?: string | null): string {
  if (isLocalAsset(imageUrl) && !imageUrl.includes('category-default') && !imageUrl.includes('agency-default')) {
    return imageUrl;
  }
  return IMAGE_FALLBACKS.avatar;
}

