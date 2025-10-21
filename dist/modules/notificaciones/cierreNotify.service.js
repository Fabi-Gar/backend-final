"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyCierreEvento = notifyCierreEvento;
exports.notifyCierreFinalizadoARegion = notifyCierreFinalizadoARegion;
// src/services/cierreNotify.service.ts
const pushPrefs_repo_1 = require("./pushPrefs.repo");
const expoPush_service_1 = require("./expoPush.service");
async function tokensParaCierre(incendio, primerReportanteUserId) {
    const userIds = new Set([String(incendio.creadorUserId)]);
    if (primerReportanteUserId)
        userIds.add(String(primerReportanteUserId));
    (incendio.seguidoresUserIds || []).forEach(u => userIds.add(String(u)));
    return await pushPrefs_repo_1.PushPrefsRepo.getTokensForUserIds(Array.from(userIds));
}
async function notifyCierreEvento(params) {
    const { type, incendio, autorNombre, resumen, primerReportanteUserId } = params;
    const tokens = await tokensParaCierre(incendio, primerReportanteUserId);
    if (!tokens.length)
        return;
    const titles = {
        cierre_iniciado: 'Se inició el cierre',
        cierre_actualizado: 'Cierre actualizado',
        cierre_finalizado: 'Cierre finalizado',
        cierre_reabierto: 'Cierre reabierto',
    };
    const body = [
        incendio.titulo || 'Incendio',
        autorNombre ? `• por ${autorNombre}` : null,
        resumen ? `• ${resumen}` : null,
    ].filter(Boolean).join(' ');
    await (0, expoPush_service_1.sendExpoPush)(tokens, {
        title: titles[type],
        body,
        data: {
            type,
            incendio_id: String(incendio.id),
            deeplink: `/incendios/detalles?id=${incendio.id}`,
        },
    });
}
async function notifyCierreFinalizadoARegion(params) {
    const tokens = await pushPrefs_repo_1.PushPrefsRepo.getTokensByRegion(params.incendio.regionCode);
    if (!tokens.length)
        return;
    await (0, expoPush_service_1.sendExpoPush)(tokens, {
        title: 'Incendio finalizado en tu zona',
        body: params.incendio.titulo || 'Toca para ver detalles',
        data: {
            type: 'cierre_finalizado',
            region: params.incendio.regionCode,
            incendio_id: String(params.incendio.id),
            deeplink: `/incendios/detalles?id=${params.incendio.id}`,
        },
    });
}
