// src/services/push.service.ts
import { PushPrefsRepo } from "./pushPrefs.repo";

export const PushService = {
  register: async (body: {
    userId: string;
    expoPushToken: string;
    regionesSuscritas?: string[];
    avisarmeAprobado?: boolean;
  }) => {
    const { userId, expoPushToken, regionesSuscritas = [], avisarmeAprobado = true } = body;
    if (!userId || !expoPushToken) throw new Error('userId y expoPushToken son requeridos');
    return PushPrefsRepo.upsertTokenAndPrefs(userId, expoPushToken, regionesSuscritas, avisarmeAprobado);
  },

  updatePrefs: async (body: {
    userId: string;
    regionesSuscritas?: string[];
    avisarmeAprobado?: boolean;
  }) => {
    const { userId, regionesSuscritas, avisarmeAprobado } = body;
    if (!userId) throw new Error('userId es requerido');
    const updated = await PushPrefsRepo.updatePrefs(userId, regionesSuscritas, avisarmeAprobado);
    if (!updated) throw new Error('Usuario no encontrado');
    return updated;
  },

  unregister: async (body: { userId: string; expoPushToken: string }) => {
    const { userId, expoPushToken } = body;
    if (!userId || !expoPushToken) throw new Error('userId y expoPushToken son requeridos');
    const updated = await PushPrefsRepo.removeToken(userId, expoPushToken);
    if (!updated) throw new Error('Usuario no encontrado o token inexistente');
    return updated;
  },
};
