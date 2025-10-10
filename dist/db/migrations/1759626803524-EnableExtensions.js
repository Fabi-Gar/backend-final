"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnableExtensions1759626803524 = void 0;
class EnableExtensions1759626803524 {
    name = 'EnableExtensions1759626803524';
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
exports.EnableExtensions1759626803524 = EnableExtensions1759626803524;
