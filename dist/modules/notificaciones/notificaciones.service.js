"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crearNotificacion = crearNotificacion;
exports.notificarJobFallido = notificarJobFallido;
exports.notificarJobStale = notificarJobStale;
exports.notificarJobSinDatos = notificarJobSinDatos;
const data_source_1 = require("../../db/data-source");
const notificacion_entity_1 = require("./entities/notificacion.entity");
// usuario del sistema para alertas globales (puedes usar un UUID fijo o null)
const SYSTEM_USER_UUID = process.env.SYSTEM_USER_UUID || '00000000-0000-0000-0000-000000000000';
const windowMin = Number(process.env.NOTIFY_DUP_WINDOW_MIN || 60);
async function crearNotificacion(usuario_uuid, tipo, payload) {
    const repo = data_source_1.AppDataSource.getRepository(notificacion_entity_1.Notificacion);
    const dup = await repo.createQueryBuilder('n')
        .where('n.usuario_uuid = :u', { u: usuario_uuid })
        .andWhere('n.tipo = :t', { t: tipo })
        .andWhere('n.creado_en >= NOW() - INTERVAL :w', { w: `${windowMin} minutes` })
        .getCount();
    if (dup > 0)
        return null;
    const n = repo.create({ usuario_uuid, tipo, payload: payload || null });
    return repo.save(n);
}
async function notificarJobFallido(job, error) {
    return crearNotificacion(SYSTEM_USER_UUID, 'job_failed', { job, error });
}
async function notificarJobStale(job, horas, lastSuccessAt) {
    return crearNotificacion(SYSTEM_USER_UUID, 'job_stale', { job, horas, lastSuccessAt });
}
async function notificarJobSinDatos(job) {
    return crearNotificacion(SYSTEM_USER_UUID, 'job_no_data', { job });
}
