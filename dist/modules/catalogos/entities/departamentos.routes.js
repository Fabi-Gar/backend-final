"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/catalogos/departamentos.routes.ts
const express_1 = require("express");
const zod_1 = require("zod");
const data_source_1 = require("../../../db/data-source");
const auth_1 = require("../../../middlewares/auth");
const router = (0, express_1.Router)();
// ---------- Schemas ----------
const createDeptoSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1).trim(),
});
const updateDeptoSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1).trim(),
});
const createMuniSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1).trim(),
});
const updateMuniSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1).trim(),
});
// ---------- Helpers ----------
function parsePaging(qs, defSize = 50, maxSize = 200) {
    const page = Math.max(parseInt(String(qs.page || '1'), 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(String(qs.pageSize || String(defSize)), 10) || defSize, 1), maxSize);
    const offset = (page - 1) * pageSize;
    return { page, pageSize, offset };
}
async function ensureDeptoExists(id) {
    const rows = await data_source_1.AppDataSource.query(`SELECT departamento_uuid FROM departamentos WHERE departamento_uuid = $1 AND eliminado_en IS NULL`, [id]);
    return !!rows.length;
}
// =======================================================
// ================   DEPARTAMENTOS   ====================
// =======================================================
// GET /departamentos  (listar; ?q=&page=&pageSize=&withMunicipios=1)
router.get('/', auth_1.guardAuth, async (req, res, next) => {
    try {
        const q = String(req.query.q || '').trim();
        const withMunicipios = String(req.query.withMunicipios || '') === '1';
        const { page, pageSize, offset } = parsePaging(req.query);
        // total
        const totalRows = await data_source_1.AppDataSource.query(`SELECT COUNT(*)::int AS total
       FROM departamentos
       WHERE eliminado_en IS NULL
         AND ($1 = '' OR nombre ILIKE '%' || $1 || '%')`, [q]);
        const total = totalRows?.[0]?.total ?? 0;
        // page
        const departamentos = await data_source_1.AppDataSource.query(`SELECT departamento_uuid AS id, nombre, creado_en, actualizado_en
       FROM departamentos
       WHERE eliminado_en IS NULL
         AND ($1 = '' OR nombre ILIKE '%' || $1 || '%')
       ORDER BY nombre ASC
       LIMIT $2 OFFSET $3`, [q, pageSize, offset]);
        if (!withMunicipios || !departamentos.length) {
            return res.json({ total, page, pageSize, items: departamentos });
        }
        // cargar municipios por lote
        const ids = departamentos.map((d) => d.id);
        const munis = await data_source_1.AppDataSource.query(`SELECT municipio_uuid AS id, departamento_uuid AS depto_id, nombre, creado_en, actualizado_en
       FROM municipios
       WHERE eliminado_en IS NULL
         AND departamento_uuid = ANY($1)
       ORDER BY nombre ASC`, [ids]);
        const muniByDept = {};
        for (const m of munis) {
            if (!muniByDept[m.depto_id])
                muniByDept[m.depto_id] = [];
            muniByDept[m.depto_id].push({ id: m.id, nombre: m.nombre, creado_en: m.creado_en, actualizado_en: m.actualizado_en });
        }
        const items = departamentos.map((d) => ({
            ...d,
            municipios: muniByDept[d.id] ?? []
        }));
        res.json({ total, page, pageSize, items });
    }
    catch (e) {
        next(e);
    }
});
// GET /departamentos/:id  (?withMunicipios=1)
router.get('/:id', auth_1.guardAuth, async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const withMunicipios = String(req.query.withMunicipios || '') === '1';
        const rows = await data_source_1.AppDataSource.query(`SELECT departamento_uuid AS id, nombre, creado_en, actualizado_en
       FROM departamentos
       WHERE departamento_uuid = $1 AND eliminado_en IS NULL`, [id]);
        if (!rows.length)
            return res.status(404).json({ code: 'NOT_FOUND' });
        const depto = rows[0];
        if (!withMunicipios)
            return res.json(depto);
        const municipios = await data_source_1.AppDataSource.query(`SELECT municipio_uuid AS id, nombre, creado_en, actualizado_en
       FROM municipios
       WHERE eliminado_en IS NULL AND departamento_uuid = $1
       ORDER BY nombre ASC`, [id]);
        res.json({ ...depto, municipios });
    }
    catch (e) {
        next(e);
    }
});
// POST /departamentos  (admin)  — upsert por nombre + undelete
router.post('/', auth_1.guardAdmin, async (req, res, next) => {
    try {
        const { nombre } = createDeptoSchema.parse(req.body);
        // Nota: unique(nombre) ya existe en entidad
        const rows = await data_source_1.AppDataSource.query(`INSERT INTO departamentos (nombre, eliminado_en)
       VALUES ($1, NULL)
       ON CONFLICT (nombre) DO UPDATE SET
         nombre = EXCLUDED.nombre,
         eliminado_en = NULL,       -- undelete si estaba borrado
         actualizado_en = now()
       RETURNING departamento_uuid AS id, nombre, creado_en, actualizado_en`, [nombre]);
        res.status(201).json(rows[0]);
    }
    catch (e) {
        if (e?.issues)
            return res.status(400).json({ code: 'BAD_REQUEST', issues: e.issues });
        next(e);
    }
});
// PATCH /departamentos/:id  (admin)
router.patch('/:id', auth_1.guardAdmin, async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const { nombre } = updateDeptoSchema.parse(req.body);
        const rows = await data_source_1.AppDataSource.query(`UPDATE departamentos
       SET nombre = $1, actualizado_en = now()
       WHERE departamento_uuid = $2 AND eliminado_en IS NULL
       RETURNING departamento_uuid AS id, nombre, creado_en, actualizado_en`, [nombre, id]);
        if (!rows.length)
            return res.status(404).json({ code: 'NOT_FOUND' });
        res.json(rows[0]);
    }
    catch (e) {
        if (e?.issues)
            return res.status(400).json({ code: 'BAD_REQUEST', issues: e.issues });
        next(e);
    }
});
// DELETE /departamentos/:id  (admin, soft)
router.delete('/:id', auth_1.guardAdmin, async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const rows = await data_source_1.AppDataSource.query(`UPDATE departamentos
       SET eliminado_en = now()
       WHERE departamento_uuid = $1 AND eliminado_en IS NULL
       RETURNING departamento_uuid AS id`, [id]);
        if (!rows.length)
            return res.status(404).json({ code: 'NOT_FOUND' });
        res.json({ ok: true });
    }
    catch (e) {
        next(e);
    }
});
// =======================================================
// ==================   MUNICIPIOS   =====================
// =======================================================
// GET /departamentos/:id/municipios  (listar por depto; ?q=&page=&pageSize=)
router.get('/:id/municipios', auth_1.guardAuth, async (req, res, next) => {
    try {
        const deptoId = String(req.params.id);
        if (!(await ensureDeptoExists(deptoId)))
            return res.status(404).json({ code: 'NOT_FOUND_DEPARTAMENTO' });
        const q = String(req.query.q || '').trim();
        const { page, pageSize, offset } = parsePaging(req.query);
        const totalRows = await data_source_1.AppDataSource.query(`SELECT COUNT(*)::int AS total
       FROM municipios
       WHERE eliminado_en IS NULL
         AND departamento_uuid = $1
         AND ($2 = '' OR nombre ILIKE '%' || $2 || '%')`, [deptoId, q]);
        const total = totalRows?.[0]?.total ?? 0;
        const items = await data_source_1.AppDataSource.query(`SELECT municipio_uuid AS id, nombre, creado_en, actualizado_en
       FROM municipios
       WHERE eliminado_en IS NULL
         AND departamento_uuid = $1
         AND ($2 = '' OR nombre ILIKE '%' || $2 || '%')
       ORDER BY nombre ASC
       LIMIT $3 OFFSET $4`, [deptoId, q, pageSize, offset]);
        res.json({ total, page, pageSize, items });
    }
    catch (e) {
        next(e);
    }
});
// POST /departamentos/:id/municipios  (admin) — upsert (departamento, nombre) + undelete
router.post('/:id/municipios', auth_1.guardAdmin, async (req, res, next) => {
    try {
        const deptoId = String(req.params.id);
        if (!(await ensureDeptoExists(deptoId)))
            return res.status(404).json({ code: 'NOT_FOUND_DEPARTAMENTO' });
        const { nombre } = createMuniSchema.parse(req.body);
        // Índice único compuesto existe por entidad: uq_municipios_depto_nombre (departamento, nombre)
        const rows = await data_source_1.AppDataSource.query(`INSERT INTO municipios (departamento_uuid, nombre, eliminado_en)
       VALUES ($1, $2, NULL)
       ON CONFLICT (departamento_uuid, nombre) DO UPDATE SET
         nombre = EXCLUDED.nombre,
         eliminado_en = NULL,
         actualizado_en = now()
       RETURNING municipio_uuid AS id, nombre, creado_en, actualizado_en`, [deptoId, nombre]);
        res.status(201).json(rows[0]);
    }
    catch (e) {
        if (e?.issues)
            return res.status(400).json({ code: 'BAD_REQUEST', issues: e.issues });
        next(e);
    }
});
// PATCH /departamentos/:id/municipios/:muniId  (admin)
router.patch('/:id/municipios/:muniId', auth_1.guardAdmin, async (req, res, next) => {
    try {
        const deptoId = String(req.params.id);
        const muniId = String(req.params.muniId);
        if (!(await ensureDeptoExists(deptoId)))
            return res.status(404).json({ code: 'NOT_FOUND_DEPARTAMENTO' });
        const { nombre } = updateMuniSchema.parse(req.body);
        const rows = await data_source_1.AppDataSource.query(`UPDATE municipios
       SET nombre = $1, actualizado_en = now()
       WHERE municipio_uuid = $2
         AND departamento_uuid = $3
         AND eliminado_en IS NULL
       RETURNING municipio_uuid AS id, nombre, creado_en, actualizado_en`, [nombre, muniId, deptoId]);
        if (!rows.length)
            return res.status(404).json({ code: 'NOT_FOUND' });
        res.json(rows[0]);
    }
    catch (e) {
        if (e?.issues)
            return res.status(400).json({ code: 'BAD_REQUEST', issues: e.issues });
        next(e);
    }
});
// DELETE /departamentos/:id/municipios/:muniId  (admin, soft)
router.delete('/:id/municipios/:muniId', auth_1.guardAdmin, async (req, res, next) => {
    try {
        const deptoId = String(req.params.id);
        const muniId = String(req.params.muniId);
        const rows = await data_source_1.AppDataSource.query(`UPDATE municipios
       SET eliminado_en = now()
       WHERE municipio_uuid = $1
         AND departamento_uuid = $2
         AND eliminado_en IS NULL
       RETURNING municipio_uuid AS id`, [muniId, deptoId]);
        if (!rows.length)
            return res.status(404).json({ code: 'NOT_FOUND' });
        res.json({ ok: true });
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
