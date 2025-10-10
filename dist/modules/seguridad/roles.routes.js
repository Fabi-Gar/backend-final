"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const data_source_1 = require("../../db/data-source");
const auth_1 = require("../../middlewares/auth");
const router = (0, express_1.Router)();
const createSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1),
    descripcion: zod_1.z.string().nullish(),
});
const updateSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1).optional(),
    descripcion: zod_1.z.string().nullish().optional(),
});
// GET /roles — listar (auth)
router.get('/', auth_1.guardAuth, async (req, res, next) => {
    try {
        const q = String(req.query.q || '').trim();
        const page = Math.max(parseInt(String(req.query.page || '1'), 10) || 1, 1);
        const pageSize = Math.min(Math.max(parseInt(String(req.query.pageSize || '50'), 10) || 50, 1), 200);
        const countRows = await data_source_1.AppDataSource.query(`SELECT COUNT(*)::int AS total
       FROM roles
       WHERE eliminado_en IS NULL
         AND ($1 = '' OR nombre ILIKE '%' || $1 || '%')`, [q]);
        const total = countRows?.[0]?.total ?? 0;
        const items = await data_source_1.AppDataSource.query(`SELECT rol_uuid AS id, nombre, descripcion, creado_en, actualizado_en
       FROM roles
       WHERE eliminado_en IS NULL
         AND ($1 = '' OR nombre ILIKE '%' || $1 || '%')
       ORDER BY nombre ASC
       LIMIT $2 OFFSET $3`, [q, pageSize, (page - 1) * pageSize]);
        res.json({ total, page, pageSize, items });
    }
    catch (e) {
        next(e);
    }
});
// POST /roles — crear (admin)
router.post('/', auth_1.guardAdmin, async (req, res, next) => {
    try {
        const { nombre, descripcion } = createSchema.parse(req.body);
        const rows = await data_source_1.AppDataSource.query(`INSERT INTO roles (nombre, descripcion)
       VALUES ($1, $2)
       ON CONFLICT (nombre) DO UPDATE SET descripcion = EXCLUDED.descripcion
       RETURNING rol_uuid AS id, nombre, descripcion, creado_en, actualizado_en`, [nombre, descripcion ?? null]);
        res.status(201).json(rows[0]);
    }
    catch (e) {
        if (e?.issues)
            return res.status(400).json({ code: 'BAD_REQUEST', issues: e.issues });
        next(e);
    }
});
// PATCH /roles/:id — actualizar (admin)
router.patch('/:id', auth_1.guardAdmin, async (req, res, next) => {
    try {
        const { nombre, descripcion } = updateSchema.parse(req.body);
        const id = String(req.params.id);
        const rows = await data_source_1.AppDataSource.query(`UPDATE roles
       SET nombre = COALESCE($1, nombre),
           descripcion = COALESCE($2, descripcion),
           actualizado_en = now()
       WHERE rol_uuid = $3 AND eliminado_en IS NULL
       RETURNING rol_uuid AS id, nombre, descripcion, creado_en, actualizado_en`, [nombre ?? null, descripcion ?? null, id]);
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
// DELETE /roles/:id — soft delete (admin)
router.delete('/:id', auth_1.guardAdmin, async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const rows = await data_source_1.AppDataSource.query(`UPDATE roles
       SET eliminado_en = now()
       WHERE rol_uuid = $1 AND eliminado_en IS NULL
       RETURNING rol_uuid AS id`, [id]);
        if (!rows.length)
            return res.status(404).json({ code: 'NOT_FOUND' });
        res.json({ ok: true });
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
