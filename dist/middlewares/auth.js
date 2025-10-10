"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.guardAuth = guardAuth;
exports.guardAdmin = guardAdmin;
const data_source_1 = require("../db/data-source");
const usuario_entity_1 = require("../modules/seguridad/entities/usuario.entity");
const typeorm_1 = require("typeorm");
const crypto_1 = require("crypto");
const jwt_1 = require("../utils/jwt");
function isUuid(v) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}
async function findUser(usuario_uuid) {
    return data_source_1.AppDataSource.getRepository(usuario_entity_1.Usuario).findOne({
        where: { usuario_uuid, eliminado_en: (0, typeorm_1.IsNull)() },
        relations: ['rol', 'institucion'],
    });
}
async function authMiddleware(req, res, next) {
    // Contexto base
    if (!res.locals.ctx) {
        res.locals.ctx = {
            requestId: req.id || (0, crypto_1.randomUUID)(),
            ip: req.ip,
            ua: req.headers['user-agent'] || '',
            user: null,
        };
    }
    // 🟢 Rutas públicas (no requieren token)
    const publicPaths = new Set([
        '/auth/login',
        '/health/liveness',
        '/health/readiness',
    ]);
    if (publicPaths.has(req.path)) {
        return next();
    }
    // A partir de aquí, token requerido
    const authHeader = (req.headers.authorization || '').trim();
    const bearer = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!bearer) {
        return res.status(401).json({
            error: { code: 'UNAUTHENTICATED', message: 'Falta token Bearer' },
            requestId: res.locals.ctx?.requestId,
        });
    }
    try {
        const claims = (0, jwt_1.verifyAccessToken)(bearer);
        const sub = String(claims.sub || '').trim();
        if (!isUuid(sub)) {
            return res.status(401).json({
                error: { code: 'INVALID_TOKEN', message: 'Sub inválido en token' },
                requestId: res.locals.ctx?.requestId,
            });
        }
        const user = await findUser(sub);
        if (!user) {
            return res.status(401).json({
                error: { code: 'INVALID_TOKEN', message: 'Usuario no encontrado' },
                requestId: res.locals.ctx?.requestId,
            });
        }
        // Inyecta usuario en el contexto
        res.locals.ctx.user = {
            usuario_uuid: user.usuario_uuid,
            email: user.email,
            nombre: user.nombre,
            apellido: user.apellido,
            is_admin: !!user.is_admin,
            rol_uuid: user?.rol?.rol_uuid ?? null,
            institucion_uuid: user?.institucion?.institucion_uuid ?? null,
        };
        next();
    }
    catch (err) {
        const code = err?.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
        return res.status(401).json({
            error: { code, message: err?.message || 'Token inválido' },
            requestId: res.locals.ctx?.requestId,
        });
    }
}
// Requiere login
function guardAuth(_req, res, next) {
    if (!res.locals.ctx?.user)
        return res.status(401).json({
            error: { code: 'UNAUTHENTICATED', message: 'Auth requerido' },
            requestId: res.locals.ctx?.requestId,
        });
    next();
}
// Solo admin
function guardAdmin(_req, res, next) {
    const u = res.locals.ctx?.user;
    if (!u?.is_admin)
        return res.status(403).json({
            error: { code: 'FORBIDDEN', message: 'Solo admin' },
            requestId: res.locals.ctx?.requestId,
        });
    next();
}
