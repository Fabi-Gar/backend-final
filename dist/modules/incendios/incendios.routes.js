"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/incendios/incendios.routes.ts
const express_1 = require("express");
const zod_1 = require("zod");
const data_source_1 = require("../../db/data-source");
const incendio_entity_1 = require("./entities/incendio.entity");
const typeorm_1 = require("typeorm");
const auth_1 = require("../../middlewares/auth");
const auditoria_service_1 = require("../auditoria/auditoria.service");
const estado_incendio_entity_1 = require("../catalogos/entities/estado-incendio.entity");
const incendio_estado_historial_entity_1 = require("./entities/incendio-estado-historial.entity");
const router = (0, express_1.Router)();
// --- helpers ---
const point4326 = zod_1.z.object({
    type: zod_1.z.literal('Point'),
    coordinates: zod_1.z.tuple([zod_1.z.number().min(-180).max(180), zod_1.z.number().min(-90).max(90)])
});
// helper para default:
async function getDefaultEstadoUuid() {
    const repo = data_source_1.AppDataSource.getRepository(estado_incendio_entity_1.EstadoIncendio);
    // 1) intenta por codigo 'REPORTADO'
    const byCode = await repo.createQueryBuilder('e')
        .where('e.eliminado_en IS NULL AND e.codigo = :c', { c: 'REPORTADO' })
        .getOne();
    if (byCode)
        return byCode.estado_incendio_uuid;
    // 2) cae al de menor orden
    const byOrden = await repo.createQueryBuilder('e')
        .where('e.eliminado_en IS NULL')
        .orderBy('e.orden', 'ASC')
        .getOne();
    if (byOrden)
        return byOrden.estado_incendio_uuid;
    return null;
}
const createIncendioSchema = zod_1.z.object({
    titulo: zod_1.z.string().min(1),
    descripcion: zod_1.z.string().nullish(),
    centroide: point4326.nullish(),
    estado_incendio_uuid: zod_1.z.string().uuid().optional(), // server pone default si no viene
});
// ⚠️ Importante: NO permitir null; si permites null aquí, romperás el NOT NULL en DB.
const updateIncendioSchema = zod_1.z.object({
    titulo: zod_1.z.string().min(1).optional(),
    descripcion: zod_1.z.string().optional(),
    centroide: point4326.nullish().optional(),
    estado_incendio_uuid: zod_1.z.string().uuid().optional(), // <-- sin nullish
});
// -------------------- LISTAR --------------------
router.get('/', async (req, res, next) => {
    try {
        const q = String(req.query.q || '').trim();
        const desde = req.query.desde ? new Date(String(req.query.desde)) : undefined;
        const hasta = req.query.hasta ? new Date(String(req.query.hasta)) : undefined;
        const page = Math.max(parseInt(String(req.query.page || '1'), 10) || 1, 1);
        const pageSize = Math.min(Math.max(parseInt(String(req.query.pageSize || '20'), 10) || 20, 1), 100);
        const where = { eliminado_en: (0, typeorm_1.IsNull)(), aprobado: true };
        if (q)
            where.titulo = (0, typeorm_1.ILike)(`%${q}%`);
        if (desde && hasta)
            where.creado_en = (0, typeorm_1.Between)(desde, hasta);
        const repo = data_source_1.AppDataSource.getRepository(incendio_entity_1.Incendio);
        const [items, total] = await repo.findAndCount({
            where,
            order: { creado_en: 'DESC' },
            take: pageSize,
            skip: (page - 1) * pageSize
        });
        res.json({ total, page, pageSize, items });
    }
    catch (err) {
        next(err);
    }
});
// -------------------- DETALLE --------------------
router.get('/:uuid', async (req, res, next) => {
    try {
        const { uuid } = zod_1.z.object({ uuid: zod_1.z.string().uuid() }).parse(req.params);
        const repo = data_source_1.AppDataSource.getRepository(incendio_entity_1.Incendio);
        const item = await repo.findOne({
            where: { incendio_uuid: uuid, eliminado_en: (0, typeorm_1.IsNull)() },
            relations: { creado_por: true }
        });
        const u = res.locals?.ctx?.user;
        const puedeVer = item && (item.aprobado || (u?.is_admin || u?.usuario_uuid === item.creado_por_uuid));
        if (!item || !puedeVer) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Incendio no disponible' }, requestId: res.locals.ctx?.requestId });
        }
        res.json(item);
    }
    catch (err) {
        next(err);
    }
});
// -------------------- CREAR --------------------
router.post('/', auth_1.guardAuth, async (req, res, next) => {
    try {
        const body = createIncendioSchema.parse(req.body);
        const user = res.locals.ctx.user;
        const repo = data_source_1.AppDataSource.getRepository(incendio_entity_1.Incendio);
        const estadoUuid = body.estado_incendio_uuid ??
            (await getDefaultEstadoUuid());
        if (!estadoUuid) {
            return res.status(500).json({
                error: { code: 'DEFAULT_STATE_MISSING', message: 'No existe estado por defecto en catálogo' },
                requestId: res.locals.ctx?.requestId
            });
        }
        const ent = repo.create({
            titulo: body.titulo,
            descripcion: body.descripcion ?? null,
            centroide: body.centroide ?? null,
            requiere_aprobacion: true,
            aprobado: false,
            creado_por: { usuario_uuid: user.usuario_uuid },
            estado_incendio: { estado_incendio_uuid: estadoUuid }, // nunca null
        });
        const saved = await repo.save(ent);
        // historial inicial
        await data_source_1.AppDataSource.getRepository(incendio_estado_historial_entity_1.IncendioEstadoHistorial).save({
            incendio: { incendio_uuid: saved.incendio_uuid },
            estado_incendio: { estado_incendio_uuid: estadoUuid },
            cambiado_por: { usuario_uuid: user.usuario_uuid },
            observacion: 'Estado inicial',
        });
        await (0, auditoria_service_1.auditRecord)({
            tabla: 'incendios',
            registro_uuid: saved.incendio_uuid,
            accion: 'INSERT',
            despues: saved,
            ctx: res.locals.ctx
        });
        res.status(201).json(saved);
    }
    catch (err) {
        if (err?.issues) {
            return res.status(400).json({
                error: { code: 'BAD_REQUEST', message: 'Validación', issues: err.issues },
                requestId: res.locals.ctx?.requestId
            });
        }
        next(err);
    }
});
// -------------------- ACTUALIZAR --------------------
router.patch('/:uuid', auth_1.guardAuth, async (req, res, next) => {
    try {
        const { uuid } = zod_1.z.object({ uuid: zod_1.z.string().uuid() }).parse(req.params);
        const body = updateIncendioSchema.parse(req.body);
        const user = res.locals.ctx.user;
        const repo = data_source_1.AppDataSource.getRepository(incendio_entity_1.Incendio);
        // obtén el estado previo directamente de la tabla (columna FK)
        const prevRow = await data_source_1.AppDataSource.query(`SELECT estado_incendio_uuid FROM incendios WHERE incendio_uuid = $1 AND eliminado_en IS NULL`, [uuid]);
        if (!prevRow.length) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Incendio no existe' }, requestId: res.locals.ctx?.requestId });
        }
        const prevEstadoUuid = prevRow[0].estado_incendio_uuid;
        const inc = await repo.findOne({ where: { incendio_uuid: uuid, eliminado_en: (0, typeorm_1.IsNull)() } });
        if (!inc) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Incendio no existe' }, requestId: res.locals.ctx?.requestId });
        }
        const esCreador = inc.creado_por_uuid === user.usuario_uuid;
        if (!user.is_admin && !esCreador) {
            return res.status(403).json({ error: { code: 'PERMISSION_DENIED' }, requestId: res.locals.ctx?.requestId });
        }
        const before = { titulo: inc.titulo, descripcion: inc.descripcion, centroide: inc.centroide };
        if (typeof body.titulo === 'string')
            inc.titulo = body.titulo;
        if (typeof body.descripcion === 'string')
            inc.descripcion = body.descripcion;
        if (typeof body.centroide !== 'undefined')
            inc.centroide = body.centroide ?? null;
        // si viene estado_incendio_uuid, lo seteamos (NO permitir null aquí)
        let nuevoEstadoUuid = null;
        if (typeof body.estado_incendio_uuid !== 'undefined') {
            nuevoEstadoUuid = body.estado_incendio_uuid;
            inc.estado_incendio = { estado_incendio_uuid: body.estado_incendio_uuid };
        }
        const saved = await repo.save(inc);
        // si cambió el estado, guarda historial
        if (nuevoEstadoUuid && nuevoEstadoUuid !== prevEstadoUuid) {
            await data_source_1.AppDataSource.getRepository(incendio_estado_historial_entity_1.IncendioEstadoHistorial).save({
                incendio: { incendio_uuid: saved.incendio_uuid },
                estado_incendio: { estado_incendio_uuid: nuevoEstadoUuid },
                cambiado_por: { usuario_uuid: user.usuario_uuid },
                observacion: 'Cambio de estado por edición',
            });
        }
        await (0, auditoria_service_1.auditRecord)({
            tabla: 'incendios',
            registro_uuid: saved.incendio_uuid,
            accion: 'UPDATE',
            antes: before,
            despues: {
                titulo: saved.titulo,
                descripcion: saved.descripcion,
                centroide: saved.centroide,
                estado_incendio_uuid: nuevoEstadoUuid ?? prevEstadoUuid,
            },
            ctx: res.locals.ctx
        });
        res.json(saved);
    }
    catch (err) {
        if (err?.issues)
            return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Validación', issues: err.issues }, requestId: res.locals.ctx?.requestId });
        next(err);
    }
});
// -------------------- APROBAR --------------------
router.patch('/:uuid/aprobar', auth_1.guardAuth, auth_1.guardAdmin, async (req, res, next) => {
    try {
        const { uuid } = zod_1.z.object({ uuid: zod_1.z.string().uuid() }).parse(req.params);
        const repo = data_source_1.AppDataSource.getRepository(incendio_entity_1.Incendio);
        const inc = await repo.findOne({ where: { incendio_uuid: uuid, eliminado_en: (0, typeorm_1.IsNull)() } });
        if (!inc)
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Incendio no existe' }, requestId: res.locals.ctx?.requestId });
        const before = { aprobado: inc.aprobado, requiere_aprobacion: inc.requiere_aprobacion };
        inc.aprobado = true;
        inc.requiere_aprobacion = false;
        inc.aprobado_en = new Date();
        inc.aprobado_por = { usuario_uuid: res.locals.ctx.user.usuario_uuid };
        inc.rechazado_en = null;
        inc.rechazado_por = null;
        inc.motivo_rechazo = null;
        const saved = await repo.save(inc);
        await (0, auditoria_service_1.auditRecord)({
            tabla: 'incendios',
            registro_uuid: saved.incendio_uuid,
            accion: 'UPDATE',
            antes: before,
            despues: { aprobado: saved.aprobado, requiere_aprobacion: saved.requiere_aprobacion, aprobado_en: saved.aprobado_en, aprobado_por: saved.aprobado_por },
            ctx: res.locals.ctx
        });
        res.json(saved);
    }
    catch (err) {
        next(err);
    }
});
// -------------------- RECHAZAR --------------------
router.patch('/:uuid/rechazar', auth_1.guardAuth, auth_1.guardAdmin, async (req, res, next) => {
    try {
        const { uuid } = zod_1.z.object({ uuid: zod_1.z.string().uuid() }).parse(req.params);
        const { motivo_rechazo } = zod_1.z.object({ motivo_rechazo: zod_1.z.string().min(1) }).parse(req.body);
        const repo = data_source_1.AppDataSource.getRepository(incendio_entity_1.Incendio);
        const inc = await repo.findOne({ where: { incendio_uuid: uuid, eliminado_en: (0, typeorm_1.IsNull)() } });
        if (!inc)
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Incendio no existe' }, requestId: res.locals.ctx?.requestId });
        const before = { aprobado: inc.aprobado, requiere_aprobacion: inc.requiere_aprobacion };
        inc.aprobado = false;
        inc.requiere_aprobacion = false;
        inc.rechazado_en = new Date();
        inc.rechazado_por = { usuario_uuid: res.locals.ctx.user.usuario_uuid };
        inc.motivo_rechazo = motivo_rechazo;
        const saved = await repo.save(inc);
        await (0, auditoria_service_1.auditRecord)({
            tabla: 'incendios',
            registro_uuid: saved.incendio_uuid,
            accion: 'UPDATE',
            antes: before,
            despues: { aprobado: saved.aprobado, requiere_aprobacion: saved.requiere_aprobacion, rechazado_en: saved.rechazado_en, rechazado_por: saved.rechazado_por, motivo_rechazo: saved.motivo_rechazo },
            ctx: res.locals.ctx
        });
        res.json(saved);
    }
    catch (err) {
        if (err?.issues)
            return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Validación', issues: err.issues }, requestId: res.locals.ctx?.requestId });
        next(err);
    }
});
exports.default = router;
