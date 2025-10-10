"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertCanReport = assertCanReport;
const data_source_1 = require("../../db/data-source");
const incendio_entity_1 = require("./entities/incendio.entity");
const typeorm_1 = require("typeorm");
async function assertCanReport(user, incendio_uuid) {
    if (!user?.usuario_uuid) {
        const e = new Error('Auth requerido');
        e.status = 401;
        e.code = 'UNAUTHENTICATED';
        throw e;
    }
    if (user.is_admin)
        return true;
    const incRepo = data_source_1.AppDataSource.getRepository(incendio_entity_1.Incendio);
    const inc = await incRepo.findOne({
        where: { incendio_uuid, eliminado_en: (0, typeorm_1.IsNull)() },
        relations: { creado_por: true }
    });
    if (!inc) {
        const e = new Error('Incendio no existe');
        e.status = 404;
        e.code = 'NOT_FOUND';
        throw e;
    }
    if (inc.creado_por?.usuario_uuid !== user.usuario_uuid) {
        const e = new Error('Sin permiso para reportar en este incendio');
        e.status = 403;
        e.code = 'FORBIDDEN';
        throw e;
    }
    return true;
}
