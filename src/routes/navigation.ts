import { useNavigate } from 'react-router-dom';
import type { MarketplaceCategory } from '@/types';
import { useAppState } from '@/state/useAppState';

// Mapa 1:1 con el switch de `handleDirectoryCategorySelect` del App.tsx original.
const CATEGORY_ROUTES: Record<string, string> = {
  'directory-cat-01': '/categorias/auditoria-seo-local',
  'directory-cat-02': '/categorias/google-business-profile',
  'directory-cat-03': '/categorias/local-pack-y-ranking',
  'directory-cat-04': '/categorias/link-building-local',
  'directory-cat-05': '/categorias/seo-tecnico-local',
  'directory-cat-06': '/categorias/seo-on-page-local',
  'directory-cat-07': '/categorias/reputacion-y-resenas',
  'directory-cat-08': '/categorias/citaciones-y-nap',
  'directory-cat-09': '/categorias/reportes-y-analytics',
  'directory-cat-10': '/categorias/mapas-calor-local',
  'directory-cat-12': '/categorias/contenido-local',
  'directory-cat-15': '/categorias/consultoria',
  'directory-cat-16': '/categorias/seo-local-ecommerce',
};

/** Navega a `/` y hace scroll suave hasta la sección `agencies` una vez montada la Home. */
export function useNavigateHomeSection() {
  const navigate = useNavigate();
  return (sectionId?: string) => {
    if (sectionId) {
      navigate({ pathname: '/', hash: sectionId });
    } else {
      navigate('/');
    }
  };
}

/** Equivalente a `handleAuditAgencySearch`: filtra agencias por palabra clave y salta a la sección de agencias del Home. */
export function useFindAgencies() {
  const { setSearchState, triggerToast } = useAppState();
  const navigateHome = useNavigateHomeSection();

  return (keyword = 'Auditoría SEO Local') => {
    setSearchState((prev) => ({ ...prev, keyword }));
    triggerToast(`Explorando agencias para: ${keyword}`);
    navigateHome('agencies');
  };
}

/** Equivalente a `handleHeroSearch`: actualiza el estado de búsqueda global y navega a `/buscar`. */
export function useHeroSearch() {
  const navigate = useNavigate();
  const { setSearchState, triggerToast } = useAppState();

  return (keyword: string, location: string) => {
    const cleanKeyword = keyword.trim();
    const cleanLocation = location.trim();
    setSearchState({ keyword: cleanKeyword, location: cleanLocation });
    if (cleanLocation) window.localStorage.setItem('seoLocalPreferredCity', cleanLocation);
    triggerToast(`Búsqueda actualizada: '${cleanKeyword || 'Todas'}' en '${cleanLocation || 'Todas partes'}'`);

    const params = new URLSearchParams();
    if (cleanKeyword) params.set('q', cleanKeyword);
    if (cleanLocation) params.set('loc', cleanLocation);
    navigate(`/buscar${params.toString() ? `?${params.toString()}` : ''}`);
  };
}

/** Equivalente a `handleDirectoryCategorySelect`. */
export function useSelectCategory() {
  const navigate = useNavigate();
  const { setSearchState, triggerToast } = useAppState();
  const navigateHome = useNavigateHomeSection();

  return (category: MarketplaceCategory) => {
    // Las categorías reales (BD) traen `slug` y sus rutas de detalle coinciden 1:1 con él;
    // `CATEGORY_ROUTES` queda como fallback para las categorías de datos mock (ids `directory-cat-XX`).
    const route = (category.slug && `/categorias/${category.slug}`) || CATEGORY_ROUTES[category.id];
    if (route) {
      navigate(route);
      return;
    }
    setSearchState((prev) => ({ ...prev, keyword: category.queryName }));
    triggerToast(`Explorando agencias para: ${category.name}`);
    navigateHome('agencies');
  };
}
