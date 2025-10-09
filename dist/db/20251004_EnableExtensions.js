"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnableExtensions20251004 = void 0;
class EnableExtensions20251004 {
    name = 'EnableExtensions20251004';
    async up(queryRunner) {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS btree_gist;`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP EXTENSION IF EXISTS btree_gist;`);
        await queryRunner.query(`DROP EXTENSION IF EXISTS postgis;`);
        await queryRunner.query(`DROP EXTENSION IF EXISTS pgcrypto;`);
    }
}
exports.EnableExtensions20251004 = EnableExtensions20251004;
