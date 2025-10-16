// src/services/incendioNotify.service.ts
import { PushPrefsRepo } from './pushPrefs.repo';
import { sendExpoPush } from './expoPush.service';
import type { CierreUpdateType } from './push.types';

export async function notifyIncendioAprobado(incendio: {
  id: string | number;
  titulo?: string;
  creadorUserId: string;
}) {
  const prefs = await PushPrefsRepo.getByUserId(incendio.creadorUserId);
  const tokens = (prefs?.tokens || []).filter(t => t.active).map(t => t.token);
  if (!prefs || !prefs.avisarmeAprobado || tokens.length === 0) return;

  await sendExpoPush(tokens, {
    title: 'Tu incendio fue aprobado',
    body: incendio.titulo || 'Toca para ver detalles',
    data: {
      type: 'incendio_aprobado',
      incendio_id: String(incendio.id),
      deeplink: `/incendios/detalles?id=${incendio.id}`,
    },
  });
}

export async function notifyIncendioNuevoRegion(incendio: {
  id: string | number;
  titulo?: string;
  regionCode: string;
}) {
  const tokens = await PushPrefsRepo.getTokensByRegion(incendio.regionCode);
  if (!tokens.length) return;

  await sendExpoPush(tokens, {
    title: 'Nuevo incendio en tu zona',
    body: incendio.titulo || 'Toca para ver detalles',
    data: {
      type: 'incendio_nuevo_region',
      region: incendio.regionCode,
      incendio_id: String(incendio.id),
      deeplink: `/incendios/detalles?id=${incendio.id}`,
    },
  });
}
