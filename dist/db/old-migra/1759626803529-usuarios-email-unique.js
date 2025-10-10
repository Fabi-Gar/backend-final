"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsuariosEmailUnique1759626803529 = void 0;
class UsuariosEmailUnique1759626803529 {
    name = 'UsuariosEmailUnique1759626803529';
    async up(q) {
        await q.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_usuarios_email_notnull
      ON usuarios (email)
      WHERE email IS NOT NULL;
    `);
    }
    async down(q) {
        await q.query(`DROP INDEX IF EXISTS uq_usuarios_email_notnull;`);
    }
}
exports.UsuariosEmailUnique1759626803529 = UsuariosEmailUnique1759626803529;
