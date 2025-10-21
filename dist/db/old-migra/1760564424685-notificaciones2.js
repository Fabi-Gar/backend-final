"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notificaciones21760564424685 = void 0;
class Notificaciones21760564424685 {
    name = 'Notificaciones21760564424685';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "job_runs" ALTER COLUMN "insertados" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job_runs" ALTER COLUMN "ignorados" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job_runs" ALTER COLUMN "asociados" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job_runs" ALTER COLUMN "creado_en" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job_runs" ALTER COLUMN "insertados" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job_runs" ALTER COLUMN "ignorados" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job_runs" ALTER COLUMN "asociados" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job_runs" ALTER COLUMN "creado_en" SET NOT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "job_runs" ALTER COLUMN "creado_en" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job_runs" ALTER COLUMN "asociados" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job_runs" ALTER COLUMN "ignorados" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job_runs" ALTER COLUMN "insertados" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job_runs" ALTER COLUMN "creado_en" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job_runs" ALTER COLUMN "asociados" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job_runs" ALTER COLUMN "ignorados" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job_runs" ALTER COLUMN "insertados" DROP NOT NULL`);
        await queryRunner.query(`DROP TABLE "tecnicas_extincion_catalogo"`);
        await queryRunner.query(`DROP INDEX "public"."idx_notif_usuario"`);
    }
}
exports.Notificaciones21760564424685 = Notificaciones21760564424685;
