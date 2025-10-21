"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushPrefsRepo = void 0;
// src/modules/notificaciones/pushPrefs.repo.ts
const data_source_1 = require("../../db/data-source");
const UserPushPrefs_1 = require("./entities/UserPushPrefs");
const UserPushToken_1 = require("./entities/UserPushToken");
exports.PushPrefsRepo = {
    // Obtener preferencias de un usuario
    async getByUserId(userId) {
        const repo = data_source_1.AppDataSource.getRepository(UserPushPrefs_1.UserPushPrefs);
        return repo.findOne({ where: { userId }, relations: { tokens: true } });
    },
    // Crear o actualizar preferencias
    async ensurePrefs(userId, municipios = [], departamentos = [], avisarmeAprobado = true, avisarmeActualizaciones = true, avisarmeCierres = true) {
        const repo = data_source_1.AppDataSource.getRepository(UserPushPrefs_1.UserPushPrefs);
        let prefs = await repo.findOne({ where: { userId } });
        if (!prefs) {
            prefs = repo.create({
                userId,
                municipiosSuscritos: municipios,
                departamentosSuscritos: departamentos,
                avisarmeAprobado,
                avisarmeActualizaciones,
                avisarmeCierres,
                extra: null,
            });
            prefs = await repo.save(prefs);
        }
        return prefs;
    },
    // Registrar token y preferencias
    async upsertTokenAndPrefs(userId, expoToken, municipiosSuscritos = [], departamentosSuscritos = [], avisarmeAprobado = true, avisarmeActualizaciones = true, avisarmeCierres = true) {
        const prefs = await this.ensurePrefs(userId, municipiosSuscritos, departamentosSuscritos, avisarmeAprobado, avisarmeActualizaciones, avisarmeCierres);
        const tokenRepo = data_source_1.AppDataSource.getRepository(UserPushToken_1.UserPushToken);
        let tok = await tokenRepo.findOne({ where: { token: expoToken } });
        if (tok) {
            tok.active = true;
            tok.userId = userId;
            tok.prefsId = prefs.id;
            tok.prefs = prefs;
            await tokenRepo.save(tok);
        }
        else {
            tok = tokenRepo.create({
                token: expoToken,
                userId,
                prefsId: prefs.id,
                prefs,
                active: true,
            });
            await tokenRepo.save(tok);
        }
        // Actualizar preferencias
        const prefsRepo = data_source_1.AppDataSource.getRepository(UserPushPrefs_1.UserPushPrefs);
        await prefsRepo.update({ id: prefs.id }, {
            municipiosSuscritos,
            departamentosSuscritos,
            avisarmeAprobado,
            avisarmeActualizaciones,
            avisarmeCierres,
        });
        return { prefsId: prefs.id, tokenId: tok.id };
    },
    // Actualizar solo preferencias
    async updatePrefs(userId, municipios, departamentos, avisarmeAprobado, avisarmeActualizaciones, avisarmeCierres) {
        const repo = data_source_1.AppDataSource.getRepository(UserPushPrefs_1.UserPushPrefs);
        const prefs = await repo.findOne({ where: { userId } });
        if (!prefs)
            return null;
        const patch = {};
        if (Array.isArray(municipios))
            patch.municipiosSuscritos = municipios;
        if (Array.isArray(departamentos))
            patch.departamentosSuscritos = departamentos;
        if (typeof avisarmeAprobado === 'boolean')
            patch.avisarmeAprobado = avisarmeAprobado;
        if (typeof avisarmeActualizaciones === 'boolean')
            patch.avisarmeActualizaciones = avisarmeActualizaciones;
        if (typeof avisarmeCierres === 'boolean')
            patch.avisarmeCierres = avisarmeCierres;
        await repo.update({ id: prefs.id }, patch);
        return await repo.findOne({ where: { id: prefs.id } });
    },
    // Desactivar token
    async removeToken(userId, expoToken) {
        const repo = data_source_1.AppDataSource.getRepository(UserPushToken_1.UserPushToken);
        const tok = await repo.findOne({ where: { token: expoToken, userId } });
        if (!tok)
            return null;
        tok.active = false;
        await repo.save(tok);
        return { tokenId: tok.id, active: tok.active };
    },
    // 🆕 Obtener tokens de usuarios específicos CON FILTRO DE PREFERENCIAS
    async getTokensForUserIdsWithPref(userIds, prefField) {
        if (!userIds.length)
            return [];
        const rows = await data_source_1.AppDataSource.query(`
      SELECT DISTINCT t.token
      FROM user_push_tokens t
      JOIN user_push_prefs p ON p.id = t.prefs_id
      WHERE t.active = TRUE
        AND p.user_id = ANY($1::text[])
        AND p.${prefField} = TRUE
      `, [userIds]);
        return rows.map((r) => r.token);
    },
    // Obtener tokens de usuarios específicos (sin filtro de preferencias)
    async getTokensForUserIds(userIds) {
        if (!userIds.length)
            return [];
        const rows = await data_source_1.AppDataSource.query(`
      SELECT DISTINCT t.token
      FROM user_push_tokens t
      JOIN user_push_prefs p ON p.id = t.prefs_id
      WHERE t.active = TRUE
        AND p.user_id = ANY($1::text[])
      `, [userIds]);
        return rows.map((r) => r.token);
    },
    // Obtener tokens por región (municipio o departamento)
    async getTokensByRegion(regionCode) {
        const rows = await data_source_1.AppDataSource.query(`
      SELECT DISTINCT t.token
      FROM user_push_tokens t
      JOIN user_push_prefs p ON p.id = t.prefs_id
      WHERE t.active = TRUE
        AND (
          p.municipios_suscritos @> ARRAY[$1]::text[]
          OR p.departamentos_suscritos @> ARRAY[$1]::text[]
        )
      `, [regionCode]);
        return rows.map((r) => r.token);
    },
    // Obtener tokens solo por municipio
    async getTokensByMunicipio(municipioCode) {
        const rows = await data_source_1.AppDataSource.query(`
      SELECT DISTINCT t.token
      FROM user_push_tokens t
      JOIN user_push_prefs p ON p.id = t.prefs_id
      WHERE t.active = TRUE
        AND p.municipios_suscritos @> ARRAY[$1]::text[]
      `, [municipioCode]);
        return rows.map((r) => r.token);
    },
    // Obtener tokens solo por departamento
    async getTokensByDepartamento(departamentoCode) {
        const rows = await data_source_1.AppDataSource.query(`
      SELECT DISTINCT t.token
      FROM user_push_tokens t
      JOIN user_push_prefs p ON p.id = t.prefs_id
      WHERE t.active = TRUE
        AND p.departamentos_suscritos @> ARRAY[$1]::text[]
      `, [departamentoCode]);
        return rows.map((r) => r.token);
    },
};
