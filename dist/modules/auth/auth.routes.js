"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/auth/auth.routes.ts
const express_1 = require("express");
const zod_1 = require("zod");
const data_source_1 = require("../../db/data-source");
const usuario_entity_1 = require("../seguridad/entities/usuario.entity");
const typeorm_1 = require("typeorm");
const password_1 = require("../../utils/password");
const jwt_1 = require("../../utils/jwt"); // ✅ función para firmar tokens JWT
const router = (0, express_1.Router)();
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1)
});
const sleep = (ms) => new Promise(res => setTimeout(res, ms));
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const emailN = email.trim().toLowerCase();
        const repo = data_source_1.AppDataSource.getRepository(usuario_entity_1.Usuario);
        // Selecciona el usuario
        const user = await repo.findOne({
            where: { email: emailN, eliminado_en: (0, typeorm_1.IsNull)() },
            relations: ['rol', 'institucion']
        });
        const invalid = () => res.status(401).json({
            error: { code: 'INVALID_CREDENTIALS', message: 'Email o password inválidos' },
            requestId: res.locals.ctx?.requestId
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
        // 🔐 Construir el payload del JWT
        const fullName = `${user.nombre ?? ''} ${user.apellido ?? ''}`.trim();
        const payload = {
            sub: user.usuario_uuid,
            email: user.email || undefined,
            is_admin: !!user.is_admin,
            rol_uuid: user?.rol?.rol_uuid || undefined,
            institucion_uuid: user?.institucion?.institucion_uuid || undefined,
            name: fullName || undefined,
        };
        // ✨ Firmar JWT
        const access_token = (0, jwt_1.signAccessToken)(payload);
        // Actualizar último login
        await repo.update({ usuario_uuid: user.usuario_uuid }, { ultimo_login: new Date() });
        // Respuesta final
        res.json({
            token: access_token,
            user: {
                usuario_uuid: user.usuario_uuid,
                email: user.email,
                nombre: user.nombre,
                apellido: user.apellido,
                is_admin: user.is_admin,
                rol_uuid: user?.rol?.rol_uuid ?? null,
                institucion_uuid: user?.institucion?.institucion_uuid ?? null,
            }
        });
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
