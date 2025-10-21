"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TablaNuevaCatalogos1760335740046 = void 0;
class TablaNuevaCatalogos1760335740046 {
    name = 'TablaNuevaCatalogos1760335740046';
    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."ux_puntos_calor_hash"`);
        await queryRunner.query(`CREATE TABLE "tecnicas_extincion_catalogo" ("tecnica_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" text NOT NULL, "creado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "actualizado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "eliminado_en" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_471a0191a84be1cd5360ae26716" UNIQUE ("nombre"), CONSTRAINT "PK_aec3f75b4552841a25c432c00f7" PRIMARY KEY ("tecnica_id"))`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "tecnicas_extincion_catalogo"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "ux_puntos_calor_hash" ON "puntos_calor" ("hash_dedupe") `);
    }
}
exports.TablaNuevaCatalogos1760335740046 = TablaNuevaCatalogos1760335740046;
