import { describe, expect, it } from 'vitest';
import { router } from './router';

describe('router smoke', () => {
  it('defines a root layout and public routes', () => {
    expect(router.routes.length).toBeGreaterThan(0);
    const root = router.routes[0];
    expect(root.path).toBe('/');
    expect(root.children).toBeDefined();
    expect(root.children!.length).toBeGreaterThan(10);
  });

  it('every route has a title and an element', () => {
    const root = router.routes[0];
    const children = root.children || [];
    for (const route of children) {
      expect(route.handle).toBeDefined();
      expect((route.handle as Record<string, string>).title).toBeTruthy();
      expect(route.element).toBeTruthy();
    }
  });

  it('exposes all expected public category routes', () => {
    const root = router.routes[0];
    const paths = (root.children || []).map((r) => r.path).filter(Boolean);
    const expected = [
      'categorias/auditoria-seo-local',
      'categorias/google-business-profile',
      'categorias/local-pack-y-ranking',
      'categorias/link-building-local',
      'categorias/seo-tecnico-local',
      'categorias/seo-on-page-local',
      'categorias/reputacion-y-resenas',
      'categorias/citaciones-y-nap',
      'categorias/reportes-y-analytics',
      'categorias/mapas-calor-local',
      'categorias/contenido-local',
      'categorias/seo-local-ecommerce',
      'categorias/consultoria',
    ];
    for (const path of expected) {
      expect(paths).toContain(path);
    }
  });

  it('protects internal tool routes', () => {
    const root = router.routes[0];
    const protectedPaths = (root.children || [])
      .filter((r) => r.path?.startsWith('herramientas/'))
      .map((r) => r.path);
    expect(protectedPaths).toContain('herramientas/auditorias');
    expect(protectedPaths).toContain('herramientas/citaciones');
  });
});
