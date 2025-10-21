"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushService = void 0;
// src/modules/notificaciones/push.service.ts
const pushPrefs_repo_1 = require("./pushPrefs.repo");
exports.PushService = {
    register: async (body) => {
        const { userId, expoPushToken, municipiosSuscritos = [], departamentosSuscritos = [], avisarmeAprobado = true, avisarmeActualizaciones = true, avisarmeCierres = true } = body;
        if (!userId || !expoPushToken) {
            throw new Error('userId y expoPushToken son requeridos');
        }
        return pushPrefs_repo_1.PushPrefsRepo.upsertTokenAndPrefs(userId, expoPushToken, municipiosSuscritos, departamentosSuscritos, avisarmeAprobado, avisarmeActualizaciones, avisarmeCierres);
    },
    updatePrefs: async (body) => {
        const { userId, municipiosSuscritos, departamentosSuscritos, avisarmeAprobado, avisarmeActualizaciones, avisarmeCierres } = body;
        if (!userId)
            throw new Error('userId es requerido');
        const updated = await pushPrefs_repo_1.PushPrefsRepo.updatePrefs(userId, municipiosSuscritos, departamentosSuscritos, avisarmeAprobado, avisarmeActualizaciones, avisarmeCierres);
        if (!updated)
            throw new Error('Usuario no encontrado');
        return updated;
    },
    unregister: async (body) => {
        const { userId, expoPushToken } = body;
        if (!userId || !expoPushToken) {
            throw new Error('userId y expoPushToken son requeridos');
        }
        const updated = await pushPrefs_repo_1.PushPrefsRepo.removeToken(userId, expoPushToken);
        if (!updated)
            throw new Error('Usuario no encontrado o token inexistente');
        return updated;
    },
};
