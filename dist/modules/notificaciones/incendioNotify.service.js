"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyIncendioAprobado = notifyIncendioAprobado;
exports.notifyIncendioActualizado = notifyIncendioActualizado;
exports.notifyIncendioCerrado = notifyIncendioCerrado;
exports.notifyIncendioNuevoMunicipio = notifyIncendioNuevoMunicipio;
exports.notifyIncendioNuevoDepartamento = notifyIncendioNuevoDepartamento;
// src/services/incendioNotify.service.ts
const pushPrefs_repo_1 = require("./pushPrefs.repo");
const expoPush_service_1 = require("./expoPush.service");
// 1. Notificar al creador cuando su incendio es aprobado
async function notifyIncendioAprobado(incendio) {
    const prefs = await pushPrefs_repo_1.PushPrefsRepo.getByUserId(incendio.creadorUserId);
    // ✅ Verificar si el usuario quiere recibir notificaciones de aprobación
    if (!prefs || !prefs.avisarmeAprobado) {
        console.log(`⏭️ Usuario ${incendio.creadorUserId} no quiere notificaciones de aprobación`);
        return;
    }
    const tokens = (prefs?.tokens || []).filter(t => t.active).map(t => t.token);
    if (tokens.length === 0)
        return;
    await (0, expoPush_service_1.sendExpoPush)(tokens, {
        title: '✅ Tu incendio fue aprobado',
        body: incendio.titulo || 'Toca para ver detalles',
        data: {
            type: 'incendio_aprobado',
            incendio_id: String(incendio.id),
            deeplink: `/incendios/detalles?id=${incendio.id}`,
        },
    });
}
// 2. Notificar cuando hay actualización en un incendio
async function notifyIncendioActualizado(incendio) {
    const userIds = new Set([String(incendio.creadorUserId)]);
    (incendio.seguidoresUserIds || []).forEach(u => userIds.add(String(u)));
    // ✅ Filtrar tokens de usuarios que quieren recibir actualizaciones
    const tokens = await pushPrefs_repo_1.PushPrefsRepo.getTokensForUserIdsWithPref(Array.from(userIds), 'avisarmeActualizaciones');
    if (!tokens.length)
        return;
    await (0, expoPush_service_1.sendExpoPush)(tokens, {
        title: '📢 Actualización de incendio',
        body: incendio.cambios
            ? `${incendio.titulo || 'Incendio'} - ${incendio.cambios}`
            : incendio.titulo || 'Hay cambios en el incendio',
        data: {
            type: 'incendio_actualizado',
            incendio_id: String(incendio.id),
            deeplink: `/incendios/detalles?id=${incendio.id}`,
        },
    });
}
// 3. Notificar cierre/finalización de incendio
async function notifyIncendioCerrado(incendio) {
    const userIds = new Set([String(incendio.creadorUserId)]);
    (incendio.seguidoresUserIds || []).forEach(u => userIds.add(String(u)));
    // ✅ Filtrar tokens de usuarios que quieren recibir notificaciones de cierre
    const tokens = await pushPrefs_repo_1.PushPrefsRepo.getTokensForUserIdsWithPref(Array.from(userIds), 'avisarmeCierres');
    if (!tokens.length)
        return;
    await (0, expoPush_service_1.sendExpoPush)(tokens, {
        title: '✅ Incendio cerrado',
        body: incendio.resumenCierre
            ? `${incendio.titulo || 'Incendio'} - ${incendio.resumenCierre}`
            : `${incendio.titulo || 'Incendio'} ha sido cerrado`,
        data: {
            type: 'incendio_cerrado',
            incendio_id: String(incendio.id),
            deeplink: `/incendios/detalles?id=${incendio.id}`,
        },
    });
}
// 4. Notificar nuevo incendio por MUNICIPIO
async function notifyIncendioNuevoMunicipio(incendio) {
    const tokens = await pushPrefs_repo_1.PushPrefsRepo.getTokensByMunicipio(incendio.municipioCode);
    if (!tokens.length)
        return;
    const locationText = incendio.ubicacion ? ` en ${incendio.ubicacion}` : '';
    await (0, expoPush_service_1.sendExpoPush)(tokens, {
        title: '🔥 Nuevo incendio en tu municipio',
        body: `${incendio.titulo || 'Incendio reportado'}${locationText}`,
        data: {
            type: 'incendio_nuevo_municipio',
            municipio: incendio.municipioCode,
            departamento: incendio.departamentoCode || '',
            incendio_id: String(incendio.id),
            deeplink: `/incendios/detalles?id=${incendio.id}`,
        },
    });
}
// 5. Notificar por departamento
async function notifyIncendioNuevoDepartamento(incendio) {
    const tokens = await pushPrefs_repo_1.PushPrefsRepo.getTokensByRegion(incendio.departamentoCode);
    if (!tokens.length)
        return;
    const locationText = incendio.municipioNombre ? ` en ${incendio.municipioNombre}` : '';
    await (0, expoPush_service_1.sendExpoPush)(tokens, {
        title: '🔥 Nuevo incendio en tu región',
        body: `${incendio.titulo || 'Incendio reportado'}${locationText}`,
        data: {
            type: 'incendio_nuevo_departamento',
            departamento: incendio.departamentoCode,
            incendio_id: String(incendio.id),
            deeplink: `/incendios/detalles?id=${incendio.id}`,
        },
    });
}
