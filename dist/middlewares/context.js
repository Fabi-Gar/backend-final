"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contextMiddleware = contextMiddleware;
const crypto_1 = require("crypto");
function contextMiddleware(req, res, next) {
    const requestId = res.locals?.ctx?.requestId ||
        req.id || // pino-http genera un id si está configurado
        (0, crypto_1.randomUUID)();
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.socket.remoteAddress
        || '';
    const ua = req.headers['user-agent'] || '';
    res.locals.ctx = { requestId, ip, ua, user: null };
    next();
}
