import { AppDataSource } from '../../db/data-source';
import { UserPushPrefs } from './entities/UserPushPrefs';
import { UserPushToken } from './entities/UserPushToken';

export const PushPrefsRepo = {
  // usado por notifyIncendioAprobado
  async getByUserId(userId: string) {
    const repo = AppDataSource.getRepository(UserPushPrefs);
    return repo.findOne({ where: { userId }, relations: { tokens: true } });
  },

  async ensurePrefs(userId: string, regiones: string[] = [], avisarmeAprobado = true) {
    const repo = AppDataSource.getRepository(UserPushPrefs);
    let prefs = await repo.findOne({ where: { userId } });
    if (!prefs) {
      prefs = repo.create({
        userId,
        regionesSuscritas: regiones,
        avisarmeAprobado,
        extra: null,
      });
      prefs = await repo.save(prefs);
    }
    return prefs;
  },

  // firma que espera tu PushService.register
  async upsertTokenAndPrefs(
    userId: string,
    expoToken: string,
    regionesSuscritas: string[] = [],
    avisarmeAprobado = true
  ) {
    const prefs = await this.ensurePrefs(userId, regionesSuscritas, avisarmeAprobado);
    const tokenRepo = AppDataSource.getRepository(UserPushToken);

    let tok = await tokenRepo.findOne({ where: { token: expoToken } });
    if (tok) {
      tok.active = true;
      tok.userId = userId;
      tok.prefsId = prefs.id;
      tok.prefs = prefs;
      await tokenRepo.save(tok);
    } else {
      tok = tokenRepo.create({
        token: expoToken,
        userId,
        prefsId: prefs.id,
        prefs,
        active: true,
      });
      await tokenRepo.save(tok);
    }

    // si vinieron nuevas prefs, actualízalas
    const prefsRepo = AppDataSource.getRepository(UserPushPrefs);
    await prefsRepo.update({ id: prefs.id }, {
      regionesSuscritas,
      avisarmeAprobado,
    });

    return { prefsId: prefs.id, tokenId: tok.id };
  },

  // firma que espera tu PushService.prefs
  async updatePrefs(userId: string, regiones?: string[], avisarmeAprobado?: boolean) {
    const repo = AppDataSource.getRepository(UserPushPrefs);
    const prefs = await repo.findOne({ where: { userId } });
    if (!prefs) return null;

    const patch: Partial<UserPushPrefs> = {};
    if (Array.isArray(regiones)) patch.regionesSuscritas = regiones;
    if (typeof avisarmeAprobado === 'boolean') patch.avisarmeAprobado = avisarmeAprobado;

    await repo.update({ id: prefs.id }, patch);
    return await repo.findOne({ where: { id: prefs.id } });
  },

  // firma que espera tu PushService.unregister
  async removeToken(userId: string, expoToken: string) {
    const repo = AppDataSource.getRepository(UserPushToken);
    const tok = await repo.findOne({ where: { token: expoToken, userId } });
    if (!tok) return null;
    tok.active = false;
    await repo.save(tok);
    return { tokenId: tok.id, active: tok.active };
  },

  // usado por notifyCierre/Incendio
  async getTokensForUserIds(userIds: string[]): Promise<string[]> {
    if (!userIds.length) return [];
    const rows = await AppDataSource.query(
      `
      SELECT DISTINCT t.token
      FROM user_push_tokens t
      JOIN user_push_prefs p ON p.id = t.prefs_id
      WHERE t.active = TRUE
        AND p.user_id = ANY($1::text[])
      `,
      [userIds]
    );
    return rows.map((r: any) => r.token);
  },

  // usado por notify*Region
  async getTokensByRegion(regionCode: string): Promise<string[]> {
    const rows = await AppDataSource.query(
      `
      SELECT t.token
      FROM user_push_tokens t
      JOIN user_push_prefs p ON p.id = t.prefs_id
      WHERE t.active = TRUE
        AND p.regiones_suscritas @> ARRAY[$1]::text[]
      `,
      [regionCode]
    );
    return rows.map((r: any) => r.token);
  },
};
