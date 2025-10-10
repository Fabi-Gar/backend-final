"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/incendios/reportes.routes.ts
const express_1 = require("express");
const zod_1 = require("zod");
const data_source_1 = require("../../db/data-source");
const auth_1 = require("../../middlewares/auth");
const validators_1 = require("../../utils/validators");
const incendios_permissions_1 = require("../incendios/incendios.permissions");
const reporte_entity_1 = require("./entities/reporte.entity");
const foto_reporte_entity_1 = require("./entities/foto-reporte.entity");
const typeorm_1 = require("typeorm");
const auditoria_service_1 = require("../auditoria/auditoria.service");
const router = (0, express_1.Router)();
// -------- Schemas --------
const reporteSchema = zod_1.z.object({
    incendio_uuid: zod_1.z.string().uuid().optional(),
    institucion_uuid: zod_1.z.string().uuid().nullable().optional(),
    medio_uuid: zod_1.z.string().uuid(),
    ubicacion: validators_1.point4326,
    reportado_en: zod_1.z.coerce.date(),
    observaciones: zod_1.z.string().nullish(),
    telefono: zod_1.z.string().nullish(),
    departamento_uuid: zod_1.z.string().uuid().nullish(),
    municipio_uuid: zod_1.z.string().uuid().nullish(),
    lugar_poblado: zod_1.z.string().nullish(),
    finca: zod_1.z.string().nullish(),
    reportado_por_nombre: zod_1.z.string().min(1),
});
const fotoSchema = zod_1.z.object({
    url: zod_1.z.string().url(),
    credito: zod_1.z.string().nullish()
});
// -------- Helpers --------
function pageParams(q) {
    const page = Math.max(parseInt(String(q.page || '1'), 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(String(q.pageSize || '20'), 10) || 20, 1), 100);
    return { page, pageSize, take: pageSize, skip: (page - 1) * pageSize };
}
// -------- Rutas --------
// Crear reporte
// POST /reportes
router.post('/', auth_1.guardAuth, async (req, res, next) => {
    try {
        const parsed = reporteSchema.parse(req.body);
        if (parsed.incendio_uuid) {
            await (0, incendios_permissions_1.assertCanReport)(res.locals.ctx.user, parsed.incendio_uuid);
        }
        const repo = data_source_1.AppDataSource.getRepository(reporte_entity_1.Reporte);
        const r = repo.create({
            incendio: parsed.incendio_uuid ? { incendio_uuid: parsed.incendio_uuid } : undefined,
            institucion: parsed.institucion_uuid ? { institucion_uuid: parsed.institucion_uuid } : undefined,
            medio: { medio_uuid: parsed.medio_uuid },
            ubicacion: parsed.ubicacion,
            reportado_en: parsed.reportado_en,
            observaciones: parsed.observaciones ?? null,
            telefono: parsed.telefono ?? null,
            lugar_poblado: parsed.lugar_poblado ?? null,
            finca: parsed.finca ?? null,
            reportado_por_nombre: parsed.reportado_por_nombre,
            departamento: parsed.departamento_uuid ? { departamento_uuid: parsed.departamento_uuid } : undefined,
            municipio: parsed.municipio_uuid ? { municipio_uuid: parsed.municipio_uuid } : undefined,
            reportado_por: { usuario_uuid: res.locals.ctx.user.usuario_uuid }
        });
        await repo.save(r);
        // ---- Feed: nuevo reporte (si está asociado a un incendio)
        if (parsed.incendio_uuid) {
            await data_source_1.AppDataSource.query(`INSERT INTO actualizaciones (incendio_uuid, tipo, descripcion_corta, creado_por)
         VALUES ($1, 'NUEVO_REPORTE', 'Nuevo reporte registrado', $2)`, [parsed.incendio_uuid, res.locals.ctx.user.usuario_uuid ?? null]);
        }
        // ---- Centroide desde primer reporte + feed + auditoría
        if (parsed.incendio_uuid) {
            const prev = await data_source_1.AppDataSource.query(`SELECT centroide
           FROM incendios
          WHERE incendio_uuid = $1
            AND eliminado_en IS NULL`, [parsed.incendio_uuid]);
            const antes = prev?.[0]?.centroide ?? null;
            if (!antes) {
                const upd = await data_source_1.AppDataSource.query(`UPDATE incendios
              SET centroide = $2::jsonb,
                  actualizado_en = now()
            WHERE incendio_uuid = $1
              AND eliminado_en IS NULL
              AND (centroide IS NULL)
          RETURNING incendio_uuid, centroide`, [parsed.incendio_uuid, JSON.stringify(parsed.ubicacion)]);
                if (upd?.length) {
                    await (0, auditoria_service_1.auditRecord)({
                        tabla: 'incendios',
                        registro_uuid: parsed.incendio_uuid,
                        accion: 'UPDATE',
                        antes: { centroide: null },
                        despues: { centroide: parsed.ubicacion },
                        ctx: res.locals.ctx
                    });
                    await data_source_1.AppDataSource.query(`INSERT INTO actualizaciones (incendio_uuid, tipo, descripcion_corta, creado_por)
             VALUES ($1, 'CIERRE_ACTUALIZADO', 'Centroide establecido desde primer reporte', $2)`, [parsed.incendio_uuid, res.locals.ctx.user.usuario_uuid ?? null]);
                }
            }
        }
        res.status(201).json(r);
    }
    catch (err) {
        if (err?.issues) {
            return res.status(400).json({
                error: { code: 'BAD_REQUEST', message: 'Validación', issues: err.issues },
                requestId: res.locals.ctx?.requestId
            });
        }
        if (err?.status) {
            return res.status(err.status).json({
                error: { code: err.code || 'ERROR', message: err.message },
                requestId: res.locals.ctx?.requestId
            });
        }
        next(err);
    }
});
// Listar reportes (opcionalmente por incendio)
// GET /reportes?incendio_uuid=&page=&pageSize=
router.get('/', auth_1.guardAuth, async (req, res, next) => {
    try {
        const { page, pageSize, take, skip } = pageParams(req.query);
        const incendio_uuid = req.query?.incendio_uuid ? String(req.query.incendio_uuid) : undefined;
        const repo = data_source_1.AppDataSource.getRepository(reporte_entity_1.Reporte);
        const [items, total] = await repo.findAndCount({
            where: incendio_uuid
                ? { eliminado_en: (0, typeorm_1.IsNull)(), incendio: { incendio_uuid } }
                : { eliminado_en: (0, typeorm_1.IsNull)() },
            relations: ['reportado_por', 'incendio', 'medio', 'institucion', 'departamento', 'municipio'],
            order: { reportado_en: 'DESC', creado_en: 'DESC' },
            take, skip
        });
        res.json({ total, page, pageSize, items });
    }
    catch (e) {
        next(e);
    }
});
// Mis reportes
// GET /reportes/mios?page=&pageSize=
router.get('/mios', auth_1.guardAuth, async (req, res, next) => {
    try {
        const { page, pageSize, take, skip } = pageParams(req.query);
        const repo = data_source_1.AppDataSource.getRepository(reporte_entity_1.Reporte);
        const [items, total] = await repo.findAndCount({
            where: {
                eliminado_en: (0, typeorm_1.IsNull)(),
                reportado_por: { usuario_uuid: res.locals.ctx.user.usuario_uuid }
            },
            relations: ['medio', 'incendio', 'institucion', 'departamento', 'municipio'],
            order: { reportado_en: 'DESC', creado_en: 'DESC' },
            take, skip
        });
        res.json({ total, page, pageSize, items });
    }
    catch (e) {
        next(e);
    }
});
// Detalle de un reporte
// GET /reportes/:reporte_uuid
router.get('/:reporte_uuid', auth_1.guardAuth, async (req, res, next) => {
    try {
        const repo = data_source_1.AppDataSource.getRepository(reporte_entity_1.Reporte);
        const item = await repo.findOne({
            where: { reporte_uuid: req.params.reporte_uuid, eliminado_en: (0, typeorm_1.IsNull)() },
            relations: ['reportado_por', 'incendio', 'medio', 'institucion', 'departamento', 'municipio']
        });
        if (!item)
            return res.status(404).json({ code: 'NOT_FOUND' });
        res.json(item);
    }
    catch (e) {
        next(e);
    }
});
// Subir foto a un reporte
// POST /reportes/:reporte_uuid/fotos
router.post('/:reporte_uuid/fotos', auth_1.guardAuth, async (req, res, next) => {
    try {
        const { url, credito } = fotoSchema.parse(req.body);
        // existe el reporte?
        const repRepo = data_source_1.AppDataSource.getRepository(reporte_entity_1.Reporte);
        const rep = await repRepo.findOne({
            where: { reporte_uuid: req.params.reporte_uuid, eliminado_en: (0, typeorm_1.IsNull)() },
            relations: ['incendio']
        });
        if (!rep)
            return res.status(404).json({ code: 'NOT_FOUND', message: 'Reporte no encontrado' });
        const repo = data_source_1.AppDataSource.getRepository(foto_reporte_entity_1.FotoReporte);
        const f = repo.create({
            url,
            credito: credito ?? null,
            reporte: { reporte_uuid: req.params.reporte_uuid }
        });
        await repo.save(f);
        // Auditoría foto
        await (0, auditoria_service_1.auditRecord)({
            tabla: 'fotos_reportes',
            registro_uuid: f.foto_reporte_uuid,
            accion: 'INSERT',
            despues: { reporte_uuid: req.params.reporte_uuid, url, credito: credito ?? null },
            ctx: res.locals.ctx
        });
        // Feed para el incendio (si aplica)
        if (rep.incendio?.incendio_uuid) {
            await data_source_1.AppDataSource.query(`INSERT INTO actualizaciones (incendio_uuid, tipo, descripcion_corta, creado_por)
         VALUES ($1, 'NUEVA_FOTO', 'Se añadió una foto al reporte', $2)`, [rep.incendio.incendio_uuid, res.locals.ctx.user.usuario_uuid ?? null]);
        }
        res.status(201).json(f);
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
exports.default = router;
