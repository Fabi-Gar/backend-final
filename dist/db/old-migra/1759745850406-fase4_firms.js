"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fase4AdjExisting1759745850406 = void 0;
class Fase4AdjExisting1759745850406 {
    name = 'Fase4AdjExisting1759745850406';
    async up(q) {
        await q.query(`ALTER TABLE "puntos_calor" ADD COLUMN IF NOT EXISTS "hash_dedupe" text`);
        await q.query(`CREATE UNIQUE INDEX IF NOT EXISTS "ux_puntos_calor_hash" ON "puntos_calor" ("hash_dedupe")`);
        await q.query(`CREATE INDEX IF NOT EXISTS "idx_puntos_calor_fecha_time" ON "puntos_calor" ("acq_date" DESC, "acq_time" DESC)`);
        await q.query(`CREATE INDEX IF NOT EXISTS "idx_puntos_calor_geom" ON "puntos_calor" USING GIST ("geom")`);
        await q.query(`CREATE TABLE IF NOT EXISTS "job_runs" (
      "job_run_uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "nombre_job" text NOT NULL,
      "inicio" timestamptz NOT NULL,
      "fin" timestamptz,
      "status" text NOT NULL,
      "insertados" integer DEFAULT 0,
      "ignorados" integer DEFAULT 0,
      "asociados" integer DEFAULT 0,
      "errores" jsonb,
      "creado_en" timestamptz DEFAULT now()
    )`);
        await q.query(`CREATE INDEX IF NOT EXISTS "idx_job_runs" ON "job_runs" ("nombre_job","inicio" DESC)`);
    }
    async down(q) {
        await q.query(`DROP INDEX IF EXISTS "idx_job_runs"`);
        await q.query(`DROP TABLE IF EXISTS "job_runs"`);
        await q.query(`DROP INDEX IF EXISTS "idx_puntos_calor_geom"`);
        await q.query(`DROP INDEX IF EXISTS "idx_puntos_calor_fecha_time"`);
        await q.query(`DROP INDEX IF EXISTS "ux_puntos_calor_hash"`);
        await q.query(`ALTER TABLE "puntos_calor" DROP COLUMN IF EXISTS "hash_dedupe"`);
    }
}
exports.Fase4AdjExisting1759745850406 = Fase4AdjExisting1759745850406;
