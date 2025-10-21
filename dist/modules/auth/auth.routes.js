"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const data_source_1 = require("../../db/data-source");
const usuario_entity_1 = require("../seguridad/entities/usuario.entity");
const typeorm_1 = require("typeorm");
const password_1 = require("../../utils/password");
const jwt_1 = require("../../utils/jwt");
const router = (0, express_1.Router)();
// ===== Schemas =====
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
const publicRegisterSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(1),
    apellido: zod_1.z.string().min(1),
    telefono: zod_1.z.string().optional().nullable(),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    institucion_uuid: zod_1.z.string().uuid().optional().nullable(),
});
const sleep = (ms) => new Promise(res => setTimeout(res, ms));
/**
 * REGISTRO público - POST /auth/register
 * - No requiere token
 * - Asigna rol "USUARIO" del seed
 * - Devuelve { token, user }
 */
router.post('/register', async (req, res, next) => {
    try {
        const body = publicRegisterSchema.parse(req.body);
        const repo = data_source_1.AppDataSource.getRepository(usuario_entity_1.Usuario);
        const emailN = body.email.trim().toLowerCase();
        // Unicidad de email
        const exists = await repo.findOne({ where: { email: emailN, eliminado_en: (0, typeorm_1.IsNull)() } });
        if (exists) {
            return res.status(409).json({ error: { code: 'EMAIL_IN_USE', message: 'El email ya está registrado' } });
        }
        // Rol por defecto: USUARIO
        const row = await data_source_1.AppDataSource.manager.query(`SELECT rol_uuid FROM roles WHERE UPPER(nombre)=UPPER($1) LIMIT 1`, ['USUARIO']);
        const defaultRoleUuid = row?.[0]?.rol_uuid;
        if (!defaultRoleUuid) {
            return res.status(500).json({
                error: { code: 'PUBLIC_ROLE_NOT_FOUND', message: 'No se encontró el rol "USUARIO". Verifica el seed.' },
            });
        }
        const password_hash = await (0, password_1.hashPassword)(body.password);
        const user = repo.create({
            nombre: body.nombre,
            apellido: body.apellido,
            telefono: body.telefono || null,
            email: emailN,
            password_hash,
            rol: { rol_uuid: defaultRoleUuid },
            institucion: body.institucion_uuid ? { institucion_uuid: body.institucion_uuid } : null,
            is_admin: false,
        });
        await repo.save(user);
        const token = (0, jwt_1.signAccessToken)({
            sub: user.usuario_uuid,
            is_admin: false,
            rol_uuid: defaultRoleUuid,
            institucion_uuid: user?.institucion?.institucion_uuid ?? null,
            email: user.email ?? undefined,
            nombre: `${user.nombre ?? ''} ${user.apellido ?? ''}`.trim() || undefined,
        });
        // Devuelve token + user safe
        const { password_hash: _ph, ...safe } = user;
        res.status(201).json({ token, user: safe });
    }
    catch (err) {
        if (err?.issues) {
            return res.status(400).json({
                error: { code: 'BAD_REQUEST', message: 'Validación', issues: err.issues },
                requestId: res.locals.ctx?.requestId,
            });
        }
        next(err);
    }
});
/**
 * LOGIN - POST /auth/login
 */
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const emailN = email.trim().toLowerCase();
        const repo = data_source_1.AppDataSource.getRepository(usuario_entity_1.Usuario);
        const user = await repo.findOne({
            where: { email: emailN, eliminado_en: (0, typeorm_1.IsNull)() },
            relations: ['rol', 'institucion'],
        });
        const invalid = () => res.status(401).json({
            error: { code: 'INVALID_CREDENTIALS', message: 'Email o password inválidos' },
            requestId: res.locals.ctx?.requestId,
        });
        if (!user) {
            await sleep(250);
            return invalid();
        }
        const ok = await (0, password_1.verifyPassword)(password, user.password_hash);
        if (!ok) {
            await sleep(250);
            return invalid();
        }
        const fullName = `${user.nombre ?? ''} ${user.apellido ?? ''}`.trim();
        // OJO: signAccessToken espera 'nombre', no 'name'
        const token = (0, jwt_1.signAccessToken)({
            sub: user.usuario_uuid,
            email: user.email || undefined,
            is_admin: !!user.is_admin,
            rol_uuid: user?.rol?.rol_uuid || undefined,
            institucion_uuid: user?.institucion?.institucion_uuid || undefined,
            nombre: fullName || undefined,
        });
        await repo.update({ usuario_uuid: user.usuario_uuid }, { ultimo_login: new Date() });
        res.json({
            token,
            user: {
                usuario_uuid: user.usuario_uuid,
                email: user.email,
                nombre: user.nombre,
                apellido: user.apellido,
                is_admin: user.is_admin,
                rol_uuid: user?.rol?.rol_uuid ?? null,
                institucion_uuid: user?.institucion?.institucion_uuid ?? null,
            },
        });
    }
    catch (err) {
        if (err?.issues) {
            return res.status(400).json({
                error: { code: 'BAD_REQUEST', message: 'Validación', issues: err.issues },
                requestId: res.locals.ctx?.requestId,
            });
        }
        next(err);
    }
});
exports.default = router;
