"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = notFound;
exports.onError = onError;
const crypto_1 = require("crypto");
function notFound(_req, res) {
    const traceId = res.locals?.ctx?.requestId || (0, crypto_1.randomUUID)();
    res.status(404).json({ traceId, code: 'NOT_FOUND', message: 'Recurso no encontrado' });
}
function onError(err, req, res, _next) {
    // Mapea errores comunes
    // Zod
    if (err?.issues && !err.status) {
        err.status = 400;
        err.code = err.code || 'BAD_REQUEST';
    }
    // CORS (asegúrate de setear status=403 cuando lo creas en el middleware de CORS)
    if (err?.message === 'CORS blocked' && !err.status) {
        err.status = 403;
        err.code = err.code || 'CORS_BLOCKED';
    }
    const status = err.status || 500;
    const code = err.code || (status === 400 ? 'BAD_REQUEST' : 'INTERNAL_ERROR');
    const traceId = res.locals?.ctx?.requestId || err.traceId || req.id || (0, crypto_1.randomUUID)();
    const isProd = process.env.NODE_ENV === 'production';
    const payload = {
        traceId,
        code,
        message: status >= 500 ? 'Error interno' : (err.message || 'Error'),
    };
    // Adjunta contexto útil en dev
    if (!isProd) {
        if (err.stack)
            payload.stack = err.stack;
        if (err.issues)
            payload.issues = err.issues;
        if (err.details)
            payload.details = err.details;
    }
    else if (err.details) {
        // En prod, solo pasa detalles si los seteaste explícitamente (opc.)
        payload.details = err.details;
    }
    res.status(status).json(payload);
}
