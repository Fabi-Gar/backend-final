"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
exports.loggerMiddleware = loggerMiddleware;
// src/middlewares/logger.ts
const pino_1 = __importDefault(require("pino"));
exports.log = (0, pino_1.default)({
    level: process.env.LOG_LEVEL || 'info',
    redact: { paths: ['req.headers.authorization', '*.password', '*.password_hash', '*.token', '*.cookie'], censor: '[redacted]' }
});
function loggerMiddleware(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        exports.log.info({
            msg: 'http',
            requestId: res.locals.ctx?.requestId,
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            ms: Date.now() - start,
            ip: res.locals.ctx?.ip,
            ua: res.locals.ctx?.ua,
            userId: res.locals.ctx?.user?.usuario_uuid || null
        });
    });
    next();
}
