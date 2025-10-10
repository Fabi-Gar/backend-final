"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const data_source_1 = require("../db/data-source");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
const createSchema = zod_1.z.object({
    codigo: zod_1.z.string().min(1),
    nombre: zod_1.z.string().min(1),
    orden: zod_1.z.number().int().nonnegative(),
});
const updateSchema = zod_1.z.object({
    codigo: zod_1.z.string().min(1).optional(),
    nombre: zod_1.z.string().min(1).optional(),
    orden: zod_1.z.number().int().nonnegative().optional(),
});
// -------------------- LISTAR --------------------
router.get('/estados_incendio', auth_1.guardAuth, async (_req, res, next) => {
    try {
        const estados = await data_source_1.AppDataSource.query(`
      SELECT estado_incendio_uuid AS id, codigo, nombre, orden, creado_en, actualizado_en
      FROM estado_incendio
      WHERE eliminado_en IS NULL
      ORDER BY orden ASC
    `);
        res.json({ total: estados.length, items: estados });
    }
    catch (e) {
        next(e);
    }
});
// -------------------- CREAR (ADMIN) --------------------
router.post('/estados_incendio', auth_1.guardAdmin, async (req, res, next) => {
    try {
        const { codigo, nombre, orden } = createSchema.parse(req.body);
        const rows = await data_source_1.AppDataSource.query(`
      INSERT INTO estado_incendio (codigo, nombre, orden)
      VALUES ($1, $2, $3)
      ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, orden = EXCLUDED.orden
      RETURNING estado_incendio_uuid AS id, codigo, nombre, orden
    `, [codigo, nombre, orden]);
        res.status(201).json(rows[0]);
    }
    catch (e) {
        if (e?.issues)
            return res.status(400).json({ code: 'BAD_REQUEST', issues: e.issues });
        next(e);
    }
});
// -------------------- ACTUALIZAR (ADMIN) --------------------
router.patch('/estados_incendio/:id', auth_1.guardAdmin, async (req, res, next) => {
    try {
        const { codigo, nombre, orden } = updateSchema.parse(req.body);
        const id = String(req.params.id);
        const rows = await data_source_1.AppDataSource.query(`
      UPDATE estado_incendio
      SET codigo = COALESCE($1, codigo),
          nombre = COALESCE($2, nombre),
          orden  = COALESCE($3, orden),
          actualizado_en = now()
      WHERE estado_incendio_uuid = $4 AND eliminado_en IS NULL
      RETURNING estado_incendio_uuid AS id, codigo, nombre, orden
    `, [codigo ?? null, nombre ?? null, orden ?? null, id]);
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
// -------------------- ELIMINAR (ADMIN, soft delete) --------------------
router.delete('/estados_incendio/:id', auth_1.guardAdmin, async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const rows = await data_source_1.AppDataSource.query(`
      UPDATE estado_incendio
      SET eliminado_en = now()
      WHERE estado_incendio_uuid = $1 AND eliminado_en IS NULL
      RETURNING estado_incendio_uuid AS id
    `, [id]);
        if (!rows.length)
            return res.status(404).json({ code: 'NOT_FOUND' });
        res.json({ ok: true });
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
