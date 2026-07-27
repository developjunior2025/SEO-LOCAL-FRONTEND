import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetCategoryImageUrls1784832500000 implements MigrationInterface {
  name = 'SetCategoryImageUrls1784832500000';

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
        ELSE image_url
      END
      WHERE slug IN (
        'auditoria-seo-local','google-business-profile','local-pack-y-ranking',
        'link-building-local','seo-tecnico-local','seo-on-page-local',
        'reputacion-y-resenas','citaciones-y-nap','reportes-y-analytics',
        'mapas-calor-local','contenido-local','seo-local-ecommerce','consultoria'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE seo_service_category
      SET image_url = NULL
      WHERE image_url LIKE '/assets/categories/%'
    `);
  }
}
