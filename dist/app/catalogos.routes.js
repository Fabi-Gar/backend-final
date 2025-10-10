"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const data_source_1 = require("../db/data-source");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
const CATALOGS = {
    medios: { table: 'medios', id: 'medio_uuid' },
    instituciones: { table: 'instituciones', id: 'institucion_uuid' },
    tipos_incendio: { table: 'tipos_incendio', id: 'tipo_incendio_id' },
    tipo_propiedad: { table: 'tipo_propiedad', id: 'tipo_propiedad_id' },
    causas_catalogo: { table: 'causas_catalogo', id: 'causa_id' },
    iniciado_junto_a_catalogo: { table: 'iniciado_junto_a_catalogo', id: 'iniciado_id' },
    medios_aereos_catalogo: { table: 'medios_aereos_catalogo', id: 'medio_aereo_id' },
    medios_terrestres_catalogo: { table: 'medios_terrestres_catalogo', id: 'medio_terrestre_id' },
    medios_acuaticos_catalogo: { table: 'medios_acuaticos_catalogo', id: 'medio_acuatico_id' },
    abastos_catalogo: { table: 'abastos_catalogo', id: 'abasto_id' },
    tecnicas_extincion_catalogo: { table: 'tecnicas_extincion_catalogo', id: 'tecnica_id' },
    roles: { table: 'roles', id: 'rol_uuid' },
};
function resolveCatalog(nombre) {
    const cfg = CATALOGS[nombre];
    if (!cfg)
        throw Object.assign(new Error('CATALOG_NOT_FOUND'), { status: 404 });
    return cfg;
}
const createSchema = zod_1.z.object({ nombre: zod_1.z.string().min(1) });
const updateSchema = zod_1.z.object({ nombre: zod_1.z.string().min(1) });
const createRoleSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1),
    descripcion: zod_1.z.string().optional().nullable(),
});
const updateRoleSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1).optional(),
    descripcion: zod_1.z.string().optional().nullable(),
});
router.get('/', auth_1.guardAuth, async (_req, res) => {
    res.json({ items: Object.keys(CATALOGS) });
});
router.get('/:catalogo', auth_1.guardAuth, async (req, res, next) => {
    try {
        const catalogo = String(req.params.catalogo);
        const { table, id } = resolveCatalog(catalogo);
        const q = String(req.query.q || '').trim();
        const page = Math.max(parseInt(String(req.query.page || '1'), 10) || 1, 1);
        const pageSize = Math.min(Math.max(parseInt(String(req.query.pageSize || '50'), 10) || 50, 1), 200);
        const totalRows = await data_source_1.AppDataSource.query(`SELECT COUNT(*)::int AS total
       FROM ${table}
       WHERE eliminado_en IS NULL
         AND ($1 = '' OR nombre ILIKE '%' || $1 || '%')`, [q]);
        const total = totalRows?.[0]?.total ?? 0;
        const selectCols = catalogo === 'roles'
            ? `${id} AS id, nombre, descripcion, creado_en, actualizado_en`
            : `${id} AS id, nombre, creado_en, actualizado_en`;
        const items = await data_source_1.AppDataSource.query(`SELECT ${selectCols}
       FROM ${table}
       WHERE eliminado_en IS NULL
         AND ($1 = '' OR nombre ILIKE '%' || $1 || '%')
       ORDER BY nombre ASC
       LIMIT $2 OFFSET $3`, [q, pageSize, (page - 1) * pageSize]);
        res.json({ total, page, pageSize, items });
    }
    catch (e) {
        if (e?.status)
            return res.status(e.status).json({ code: e.message });
        next(e);
    }
});
router.get('/:catalogo/:id', auth_1.guardAuth, async (req, res, next) => {
    try {
        const catalogo = String(req.params.catalogo);
        const { table, id: idCol } = resolveCatalog(catalogo);
        const id = String(req.params.id);
        const selectCols = catalogo === 'roles'
            ? `${idCol} AS id, nombre, descripcion, creado_en, actualizado_en`
            : `${idCol} AS id, nombre, creado_en, actualizado_en`;
        const rows = await data_source_1.AppDataSource.query(`SELECT ${selectCols}
       FROM ${table}
       WHERE ${idCol} = $1 AND eliminado_en IS NULL`, [id]);
        if (!rows.length)
            return res.status(404).json({ code: 'NOT_FOUND' });
        res.json(rows[0]);
    }
    catch (e) {
        if (e?.status)
            return res.status(e.status).json({ code: e.message });
        next(e);
    }
});
router.post('/:catalogo', auth_1.guardAdmin, async (req, res, next) => {
    try {
        const catalogo = String(req.params.catalogo);
        const { table, id } = resolveCatalog(catalogo);
        if (catalogo === 'roles') {
            const { nombre, descripcion } = createRoleSchema.parse(req.body);
            const rows = await data_source_1.AppDataSource.query(`INSERT INTO ${table} (nombre, descripcion)
         VALUES ($1, $2)
         ON CONFLICT (nombre) DO UPDATE SET
           nombre = EXCLUDED.nombre,
           descripcion = EXCLUDED.descripcion,
           actualizado_en = now()
         RETURNING ${id} AS id, nombre, descripcion, creado_en, actualizado_en`, [nombre, descripcion ?? null]);
            return res.status(201).json(rows[0]);
        }
        const { nombre } = createSchema.parse(req.body);
        const rows = await data_source_1.AppDataSource.query(`INSERT INTO ${table} (nombre)
       VALUES ($1)
       ON CONFLICT (nombre) DO UPDATE SET
         nombre = EXCLUDED.nombre,
         actualizado_en = now()
       RETURNING ${id} AS id, nombre, creado_en, actualizado_en`, [nombre]);
        res.status(201).json(rows[0]);
    }
    catch (e) {
        if (e?.issues)
            return res.status(400).json({ code: 'BAD_REQUEST', issues: e.issues });
        if (e?.status)
            return res.status(e.status).json({ code: e.message });
        next(e);
    }
});
router.patch('/:catalogo/:id', auth_1.guardAdmin, async (req, res, next) => {
    try {
        const catalogo = String(req.params.catalogo);
        const { table, id: idCol } = resolveCatalog(catalogo);
        const id = String(req.params.id);
        if (catalogo === 'roles') {
            const body = updateRoleSchema.parse(req.body);
            const sets = [];
            const values = [];
            let i = 1;
            if (typeof body.nombre === 'string') {
                sets.push(`nombre = $${i++}`);
                values.push(body.nombre);
            }
            if (typeof body.descripcion !== 'undefined') {
                sets.push(`descripcion = $${i++}`);
                values.push(body.descripcion);
            }
            sets.push(`actualizado_en = now()`);
            if (values.length === 0)
                return res.status(400).json({ code: 'BAD_REQUEST', message: 'Nada para actualizar' });
            const rows = await data_source_1.AppDataSource.query(`UPDATE ${table}
         SET ${sets.join(', ')}
         WHERE ${idCol} = $${i} AND eliminado_en IS NULL
         RETURNING ${idCol} AS id, nombre, descripcion, creado_en, actualizado_en`, [...values, id]);
            if (!rows.length)
                return res.status(404).json({ code: 'NOT_FOUND' });
            return res.json(rows[0]);
        }
        const { nombre } = updateSchema.parse(req.body);
        const rows = await data_source_1.AppDataSource.query(`UPDATE ${table}
       SET nombre = $1, actualizado_en = now()
       WHERE ${idCol} = $2 AND eliminado_en IS NULL
       RETURNING ${idCol} AS id, nombre, creado_en, actualizado_en`, [nombre, id]);
        if (!rows.length)
            return res.status(404).json({ code: 'NOT_FOUND' });
        res.json(rows[0]);
    }
    catch (e) {
        if (e?.issues)
            return res.status(400).json({ code: 'BAD_REQUEST', issues: e.issues });
        if (e?.status)
            return res.status(e.status).json({ code: e.message });
        next(e);
    }
});
router.delete('/:catalogo/:id', auth_1.guardAdmin, async (req, res, next) => {
    try {
        const { table, id: idCol } = resolveCatalog(String(req.params.catalogo));
        const id = String(req.params.id);
        const rows = await data_source_1.AppDataSource.query(`UPDATE ${table}
       SET eliminado_en = now()
       WHERE ${idCol} = $1 AND eliminado_en IS NULL
       RETURNING ${idCol} AS id`, [id]);
        if (!rows.length)
            return res.status(404).json({ code: 'NOT_FOUND' });
        res.json({ ok: true });
    }
    catch (e) {
        if (e?.status)
            return res.status(e.status).json({ code: e.message });
        next(e);
    }
});
exports.default = router;
