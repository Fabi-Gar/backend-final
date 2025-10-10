"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crearReporte = crearReporte;
const data_source_1 = require("../../db/data-source");
const incendio_entity_1 = require("./entities/incendio.entity");
const reporte_entity_1 = require("./entities/reporte.entity");
const auditoria_service_1 = require("../auditoria/auditoria.service");
const typeorm_1 = require("typeorm");
async function crearReporte(input, ctx) {
    if (!ctx.user?.usuario_uuid) {
        const e = new Error('Auth requerido');
        e.status = 401;
        e.code = 'UNAUTHENTICATED';
        throw e;
    }
    const repRepo = data_source_1.AppDataSource.getRepository(reporte_entity_1.Reporte);
    const incRepo = data_source_1.AppDataSource.getRepository(incendio_entity_1.Incendio);
    const reporte = repRepo.create({
        // relaciones por id
        incendio: input.incendio_uuid ? { incendio_uuid: input.incendio_uuid } : null,
        reportado_por: { usuario_uuid: ctx.user.usuario_uuid },
        // campos simples
        reportado_por_nombre: input.reportado_por_nombre,
        institucion: input.institucion_uuid ? { institucion_uuid: input.institucion_uuid } : null,
        telefono: input.telefono ?? null,
        reportado_en: new Date(input.reportado_en),
        medio: { medio_uuid: input.medio_uuid },
        ubicacion: input.ubicacion,
        departamento: input.departamento_uuid ? { departamento_uuid: input.departamento_uuid } : null,
        municipio: input.municipio_uuid ? { municipio_uuid: input.municipio_uuid } : null,
        lugar_poblado: input.lugar_poblado ?? null,
        finca: input.finca ?? null,
        observaciones: input.observaciones ?? null
    });
    // save devuelve Reporte (objeto), no array
    const saved = await repRepo.save(reporte);
    // REGLA: si el reporte pertenece a un incendio y ese incendio no tiene centroide, setearlo desde la ubicacion del reporte
    const incendioUuid = input.incendio_uuid || saved.incendio?.incendio_uuid || null;
    if (incendioUuid) {
        const inc = await incRepo.findOne({
            where: { incendio_uuid: incendioUuid, eliminado_en: (0, typeorm_1.IsNull)() }
        });
        if (inc && !inc.centroide) {
            const before = { centroide: null };
            inc.centroide = saved.ubicacion;
            await incRepo.save(inc);
            await (0, auditoria_service_1.auditRecord)({
                tabla: 'incendios',
                registro_uuid: inc.incendio_uuid,
                accion: 'UPDATE',
                antes: before,
                despues: { centroide: inc.centroide },
                ctx
            });
        }
    }
    await (0, auditoria_service_1.auditRecord)({
        tabla: 'reportes',
        registro_uuid: saved.reporte_uuid,
        accion: 'INSERT',
        despues: saved,
        ctx
    });
    return saved;
}
