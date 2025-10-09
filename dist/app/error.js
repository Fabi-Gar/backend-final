"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = notFound;
exports.onError = onError;
const crypto_1 = require("crypto");
function notFound(_req, res) {
    res.status(404).json({ traceId: (0, crypto_1.randomUUID)(), code: 'NOT_FOUND', message: 'Recurso no encontrado' });
}
function onError(err, _req, res, _next) {
    const status = err.status || 500;
    const code = err.code || 'INTERNAL_ERROR';
    const traceId = err.traceId || (0, crypto_1.randomUUID)();
    const message = status >= 500 ? 'Error interno' : err.message || 'Error';
    res.status(status).json({ traceId, code, message, details: err.details });
}
