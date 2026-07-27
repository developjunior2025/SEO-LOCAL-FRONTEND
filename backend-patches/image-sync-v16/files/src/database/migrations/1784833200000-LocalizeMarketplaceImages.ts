import { MigrationInterface, QueryRunner } from 'typeorm';

export class LocalizeMarketplaceImages1784833200000 implements MigrationInterface {
  name = 'LocalizeMarketplaceImages1784833200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE seo_service_category
      SET image_url = CASE slug
        WHEN 'auditoria-seo-local' THEN '/assets/categories/auditoria-seo-local.webp'
        WHEN 'google-business-profile' THEN '/assets/categories/google-business-profile.webp'
        WHEN 'local-pack-y-ranking' THEN '/assets/categories/local-pack-y-ranking.webp'
        WHEN 'link-building-local' THEN '/assets/categories/link-building-local.webp'
        WHEN 'seo-tecnico-local' THEN '/assets/categories/seo-tecnico-local.webp'
        WHEN 'seo-on-page-local' THEN '/assets/categories/seo-on-page-local.webp'
        WHEN 'reputacion-y-resenas' THEN '/assets/categories/reputacion-y-resenas.webp'
        WHEN 'citaciones-y-nap' THEN '/assets/categories/citaciones-y-nap.webp'
        WHEN 'reportes-y-analytics' THEN '/assets/categories/reportes-y-analytics.webp'
        WHEN 'mapas-calor-local' THEN '/assets/categories/mapas-calor-local.webp'
        WHEN 'contenido-local' THEN '/assets/categories/contenido-local.webp'
        WHEN 'seo-local-ecommerce' THEN '/assets/categories/seo-local-ecommerce.webp'
        WHEN 'consultoria' THEN '/assets/categories/consultoria.webp'
        WHEN 'alternativas-locales' THEN '/assets/categories/alternativas-locales.webp'
        WHEN 'schema-local' THEN '/assets/categories/schema-local.webp'
        WHEN 'software-y-automatizacion' THEN '/assets/categories/software-y-automatizacion.webp'
        WHEN 'gpb-optimization' THEN '/assets/categories/google-business-profile.webp'
        WHEN 'local-pack' THEN '/assets/categories/local-pack-y-ranking.webp'
        WHEN 'local-audit' THEN '/assets/categories/auditoria-seo-local.webp'
        WHEN 'local-links' THEN '/assets/categories/link-building-local.webp'
        WHEN 'local-content' THEN '/assets/categories/contenido-local.webp'
        WHEN 'review-management' THEN '/assets/categories/reputacion-y-resenas.webp'
        ELSE image_url
      END
      WHERE slug IN (
        'auditoria-seo-local','google-business-profile','local-pack-y-ranking',
        'link-building-local','seo-tecnico-local','seo-on-page-local',
        'reputacion-y-resenas','citaciones-y-nap','reportes-y-analytics',
        'mapas-calor-local','contenido-local','seo-local-ecommerce','consultoria',
        'alternativas-locales','schema-local','software-y-automatizacion',
        'gpb-optimization','local-pack','local-audit','local-links','local-content',
        'review-management'
      )
    `);

    await queryRunner.query(`
      UPDATE seo_agency_profile
      SET image_url = CASE slug
        WHEN 'visibilidad-pro-seo' THEN '/assets/agencies/visibilidad-pro-seo.webp'
        WHEN 'mapa-ranking-agency' THEN '/assets/agencies/mapa-ranking-agency.webp'
        WHEN 'eje-cafetero-posicionamiento' THEN '/assets/agencies/eje-cafetero-posicionamiento.webp'
        WHEN 'impulsa-local-studio' THEN '/assets/agencies/impulsa-local-studio.webp'
        WHEN 'seo-local-colombia' THEN '/assets/agencies/seo-local-colombia.webp'
        WHEN 'local-rankers' THEN '/assets/agencies/local-rankers.webp'
        WHEN 'seo-certero' THEN '/assets/agencies/seo-certero.webp'
        WHEN 'santander-local-rank' THEN '/assets/agencies/santander-local-rank.webp'
        WHEN 'estrategia-local' THEN '/assets/agencies/estrategia-local.webp'
        ELSE image_url
      END
      WHERE slug IN (
        'visibilidad-pro-seo','mapa-ranking-agency','eje-cafetero-posicionamiento',
        'impulsa-local-studio','seo-local-colombia','local-rankers','seo-certero',
        'santander-local-rank','estrategia-local'
      )
      AND (
        image_url IS NULL OR image_url = '' OR image_url LIKE 'http%' OR
        image_url LIKE '%category-default%' OR image_url LIKE '%agency-default%'
      )
    `);

    await queryRunner.query(`
      UPDATE seo_agency_team_member
      SET avatar_url = CASE name
        WHEN 'Ana Torres' THEN '/assets/avatars/ana-torres.webp'
        WHEN 'Carlos Gómez' THEN '/assets/avatars/carlos-gomez.webp'
        ELSE avatar_url
      END
      WHERE name IN ('Ana Torres', 'Carlos Gómez')
      AND (
        avatar_url IS NULL OR avatar_url = '' OR avatar_url LIKE 'http%' OR
        avatar_url LIKE '%category-default%' OR avatar_url LIKE '%fallback-avatar%'
      )
    `);

    await queryRunner.query(`
      UPDATE seo_offer
      SET image_url = CASE title
        WHEN 'Auditoría SEO Local gratuita' THEN '/assets/offers/auditoria-seo-local.webp'
        WHEN '20% de descuento en optimización de GBP' THEN '/assets/offers/google-business-profile.webp'
        ELSE image_url
      END
      WHERE title IN (
        'Auditoría SEO Local gratuita',
        '20% de descuento en optimización de GBP'
      )
      AND (image_url IS NULL OR image_url = '' OR image_url LIKE 'http%')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE seo_agency_profile
      SET image_url = NULL
      WHERE image_url LIKE '/assets/agencies/%'
    `);
    await queryRunner.query(`
      UPDATE seo_agency_team_member
      SET avatar_url = NULL
      WHERE avatar_url LIKE '/assets/avatars/%'
    `);
    await queryRunner.query(`
      UPDATE seo_offer
      SET image_url = NULL
      WHERE image_url LIKE '/assets/offers/%'
    `);
  }
}
