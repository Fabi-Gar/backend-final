"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditRecord = auditRecord;
const data_source_1 = require("../../db/data-source");
const auditoria_eventos_entity_1 = require("./entities/auditoria-eventos.entity");
async function auditRecord(input) {
    const repo = data_source_1.AppDataSource.getRepository(auditoria_eventos_entity_1.AuditoriaEventos);
    const body = {
        tabla: input.tabla,
        registro_id: input.registro_uuid,
        accion: input.accion,
        request_id: input.ctx.requestId,
        ip: input.ctx.ip,
        ua: input.ctx.ua,
        usuario_uuid: input.ctx.user?.usuario_uuid ?? null,
        antes: input.antes ? safeDiff(input.antes) : null,
        despues: input.despues ? safeDiff(input.despues) : null
    };
    return repo.save(body);
}
function safeDiff(x) {
    if (!x)
        return null;
    const clone = JSON.parse(JSON.stringify(x));
    if (clone.password)
        clone.password = '[redacted]';
    if (clone.password_hash)
        clone.password_hash = '[redacted]';
    if (clone.token)
        clone.token = '[redacted]';
    if (clone.geom?.type === 'MultiPolygon') {
        clone.geom = { type: 'MultiPolygon', meta: 'omitted' };
    }
    if (clone.centroide?.type === 'Point' && Array.isArray(clone.centroide.coordinates)) {
        clone.centroide = {
            type: 'Point',
            coordinates: clone.centroide.coordinates.map((n) => Number.isFinite(n) ? Number(n.toFixed(4)) : n)
        };
    }
    return clone;
}
