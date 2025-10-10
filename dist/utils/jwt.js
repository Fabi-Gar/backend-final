"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.verifyAccessToken = verifyAccessToken;
// src/utils/jwt.ts
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = __importDefault(require("../config/env"));
// Asegura tipos compatibles con jsonwebtoken
const secret = String(env_1.default.JWT_SECRET); // fuerza string, evita overload "none"
const issuer = env_1.default.JWT_ISSUER || undefined;
const audience = env_1.default.JWT_AUDIENCE || undefined;
const expiresIn = env_1.default.JWT_EXPIRES_IN || '2h'; // puede ser string ("2h") o number (3600)
function signAccessToken(payload) {
    const body = {
        is_admin: payload.is_admin,
        rol_uuid: payload.rol_uuid ?? null,
        institucion_uuid: payload.institucion_uuid ?? null,
        email: payload.email,
        nombre: payload.nombre,
    };
    // No seteamos algorithm (HS256 es default para secreto HMAC)
    const token = jsonwebtoken_1.default.sign(body, secret, {
        issuer,
        audience,
        expiresIn, // string o number
        subject: payload.sub, // usuario_uuid
    });
    return token;
}
function verifyAccessToken(token) {
    const decoded = jsonwebtoken_1.default.verify(token, secret, {
        issuer,
        audience,
        // algorithms: ['HS256'] // opcional, puedes fijarlo si quieres
    });
    return decoded;
}
