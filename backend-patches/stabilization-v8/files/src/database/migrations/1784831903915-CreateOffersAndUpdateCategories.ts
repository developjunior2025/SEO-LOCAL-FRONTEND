import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOffersAndUpdateCategories1784831903915 implements MigrationInterface {
  name = 'CreateOffersAndUpdateCategories1784831903915';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "seo_service_category" ADD COLUMN IF NOT EXISTS "image_url" character varying(500)`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "seo_offer" (
        "id" SERIAL NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "title" character varying(190) NOT NULL,
        "subtitle" character varying(255),
        "description" text,
        "discount_percent" integer,
        "original_price" numeric(10,2),
        "discounted_price" numeric(10,2),
        "currency_code" character varying(3) NOT NULL DEFAULT 'USD',
        "cta_label" character varying(80),
        "cta_link" character varying(500),
        "image_url" character varying(500),
        "starts_at" TIMESTAMP WITH TIME ZONE,
        "expires_at" TIMESTAMP WITH TIME ZONE,
        "status" character varying(20) NOT NULL DEFAULT 'draft',
        "active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_d6671542bfeb101723fb82ac1bd" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_78774f9b97e73239d9f42b5640" ON "seo_offer" ("starts_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_d7953c35d9b1a3286f0f5e1a39" ON "seo_offer" ("expires_at")`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "seo_offer_claim" (
        "id" SERIAL NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "offer_id" integer NOT NULL,
        "reference" character varying(40) NOT NULL,
        "name" character varying(190) NOT NULL,
        "email" character varying(190) NOT NULL,
        "phone" character varying(40),
        "company_name" character varying(190),
        "message" text,
        "active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_e72277207d4b2ef0d32b6684c69" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_8a404e99f6bee747bc9ac53ad0" ON "seo_offer_claim" ("offer_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_8ec11b373448755946faedb03b" ON "seo_offer_claim" ("reference")`,
    );

    await queryRunner.query(
      `ALTER TABLE "seo_offer_claim" ADD CONSTRAINT "FK_8a404e99f6bee747bc9ac53ad0f" FOREIGN KEY ("offer_id") REFERENCES "seo_offer"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "seo_offer_claim" DROP CONSTRAINT IF EXISTS "FK_8a404e99f6bee747bc9ac53ad0f"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_8ec11b373448755946faedb03b"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_8a404e99f6bee747bc9ac53ad0"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "seo_offer_claim"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_d7953c35d9b1a3286f0f5e1a39"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_78774f9b97e73239d9f42b5640"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "seo_offer"`);
    await queryRunner.query(
      `ALTER TABLE "seo_service_category" DROP COLUMN IF EXISTS "image_url"`,
    );
  }
}
