"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/seguridad/usuarios.routes.ts
const express_1 = require("express");
const zod_1 = require("zod");
const data_source_1 = require("../../db/data-source");
const auth_1 = require("../../middlewares/auth");
const usuario_entity_1 = require("./entities/usuario.entity");
const typeorm_1 = require("typeorm");
const password_1 = require("../../utils/password");
const router = (0, express_1.Router)();
// ---------- Schemas ----------
const createUserSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1),
    apellido: zod_1.z.string().min(1),
    telefono: zod_1.z.string().optional().nullable(),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    rol_uuid: zod_1.z.string().uuid(),
    institucion_uuid: zod_1.z.string().uuid().optional().nullable(),
    is_admin: zod_1.z.boolean().optional().default(false),
});
const updateUserSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1).optional(),
    apellido: zod_1.z.string().min(1).optional(),
    telefono: zod_1.z.string().optional().nullable(),
    email: zod_1.z.string().email().optional(),
    new_password: zod_1.z.string().min(6).optional(),
    rol_uuid: zod_1.z.string().uuid().optional(),
    institucion_uuid: zod_1.z.string().uuid().optional().nullable(),
    is_admin: zod_1.z.boolean().optional(),
});
// ---------- Helpers ----------
function stripSensitive(user) {
    if (!user)
        return user;
    const { password_hash, ...safe } = user;
    return safe;
}
// ---------- Rutas ----------
// LISTAR usuarios (ADMIN) - GET /usuarios
router.get('/', auth_1.guardAdmin, async (req, res, next) => {
    try {
        const page = Math.max(parseInt(String(req.query.page || '1'), 10) || 1, 1);
        const pageSize = Math.min(Math.max(parseInt(String(req.query.pageSize || '20'), 10) || 20, 1), 100);
        const [items, total] = await data_source_1.AppDataSource.getRepository(usuario_entity_1.Usuario).findAndCount({
            where: { eliminado_en: (0, typeorm_1.IsNull)() },
            relations: ['rol', 'institucion'],
            order: { creado_en: 'DESC' },
            take: pageSize,
            skip: (page - 1) * pageSize,
        });
        res.json({
            total,
            page,
            pageSize,
            items: items.map(stripSensitive),
        });
    }
    catch (e) {
        next(e);
    }
});
// CREAR usuario (ADMIN) - POST /usuarios
router.post('/', auth_1.guardAdmin, async (req, res, next) => {
    try {
        const body = createUserSchema.parse(req.body);
        const repo = data_source_1.AppDataSource.getRepository(usuario_entity_1.Usuario);
        const exists = await repo.findOne({ where: { email: body.email, eliminado_en: (0, typeorm_1.IsNull)() } });
        if (exists)
            return res.status(409).json({ code: 'EMAIL_IN_USE', message: 'El email ya está registrado' });
        const password_hash = await (0, password_1.hashPassword)(body.password);
        const user = repo.create({
            nombre: body.nombre,
            apellido: body.apellido,
            telefono: body.telefono || null,
            email: body.email,
            password_hash,
            rol: { rol_uuid: body.rol_uuid },
            institucion: body.institucion_uuid ? { institucion_uuid: body.institucion_uuid } : null,
            is_admin: !!body.is_admin,
        });
        await repo.save(user);
        res.status(201).json(stripSensitive(user));
    }
    catch (e) {
        if (e?.issues)
            return res.status(400).json({ code: 'BAD_REQUEST', issues: e.issues });
        next(e);
    }
});
// MI PERFIL - GET /usuarios/me
router.get('/me', auth_1.guardAuth, async (_req, res, next) => {
    try {
        const repo = data_source_1.AppDataSource.getRepository(usuario_entity_1.Usuario);
        const me = await repo.findOne({
            where: { usuario_uuid: res.locals.ctx.user.usuario_uuid, eliminado_en: (0, typeorm_1.IsNull)() },
            relations: ['rol', 'institucion'],
        });
        if (!me)
            return res.status(404).json({ code: 'NOT_FOUND' });
        res.json(stripSensitive(me));
    }
    catch (e) {
        next(e);
    }
});
// ACTUALIZAR usuario - PATCH /usuarios/:id
//  - Admin puede modificar cualquier usuario
//  - Usuario normal solo puede modificarse a sí mismo (algunos campos)
router.patch('/:id', auth_1.guardAuth, async (req, res, next) => {
    try {
        const { id } = req.params;
        const body = updateUserSchema.parse(req.body);
        const isSelf = res.locals.ctx.user?.usuario_uuid === id;
        const isAdmin = !!res.locals.ctx.user?.is_admin;
        if (!isAdmin && !isSelf) {
            return res.status(403).json({ code: 'PERMISSION_DENIED' });
        }
        const repo = data_source_1.AppDataSource.getRepository(usuario_entity_1.Usuario);
        const user = await repo.findOne({ where: { usuario_uuid: id, eliminado_en: (0, typeorm_1.IsNull)() } });
        if (!user)
            return res.status(404).json({ code: 'NOT_FOUND' });
        if (body.email) {
            const emailUsed = await repo.findOne({ where: { email: body.email, eliminado_en: (0, typeorm_1.IsNull)() } });
            if (emailUsed && emailUsed.usuario_uuid !== user.usuario_uuid) {
                return res.status(409).json({ code: 'EMAIL_IN_USE' });
            }
            user.email = body.email;
        }
        if (body.nombre)
            user.nombre = body.nombre;
        if (body.apellido)
            user.apellido = body.apellido;
        user.telefono = body.telefono ?? user.telefono;
        if (typeof body.is_admin === 'boolean' && isAdmin) {
            user.is_admin = body.is_admin;
        }
        if (body.rol_uuid && isAdmin) {
            ;
            user.rol = { rol_uuid: body.rol_uuid };
        }
        if (typeof body.institucion_uuid !== 'undefined') {
            ;
            user.institucion = body.institucion_uuid ? { institucion_uuid: body.institucion_uuid } : null;
        }
        if (body.new_password) {
            user.password_hash = await (0, password_1.hashPassword)(body.new_password);
        }
        await repo.save(user);
        res.json(stripSensitive(user));
    }
    catch (e) {
        if (e?.issues)
            return res.status(400).json({ code: 'BAD_REQUEST', issues: e.issues });
        next(e);
    }
});
// ELIMINAR usuario (soft delete) - DELETE /usuarios/:id (ADMIN)
router.delete('/:id', auth_1.guardAdmin, async (req, res, next) => {
    try {
        const repo = data_source_1.AppDataSource.getRepository(usuario_entity_1.Usuario);
        const user = await repo.findOne({ where: { usuario_uuid: req.params.id, eliminado_en: (0, typeorm_1.IsNull)() } });
        if (!user)
            return res.status(404).json({ code: 'NOT_FOUND' });
        user.eliminado_en = new Date();
        await repo.save(user);
        res.json({ ok: true });
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
