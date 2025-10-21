"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddUxPuntosCalorHash1760032728487 = void 0;
class AddUxPuntosCalorHash1760032728487 {
    async up(queryRunner) {
        // crea índice único si no existe
        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_puntos_calor_hash
      ON public.puntos_calor (hash_dedupe);
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      DROP INDEX IF EXISTS ux_puntos_calor_hash;
    `);
    }
}
exports.AddUxPuntosCalorHash1760032728487 = AddUxPuntosCalorHash1760032728487;
