"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app/health.routes.ts
const express_1 = require("express");
const data_source_1 = require("../db/data-source");
const env_1 = __importDefault(require("../config/env"));
const ioredis_1 = __importDefault(require("ioredis"));
const router = (0, express_1.Router)();
let redis = null;
function getRedis() {
    if (!env_1.default.REDIS_URL)
        return null;
    if (!redis) {
        redis = new ioredis_1.default(env_1.default.REDIS_URL, { lazyConnect: true });
        redis.on('error', () => { }); // silencia errores de conexión
    }
    return redis;
}
router.get('/health/liveness', (_req, res) => {
    res.json({ status: 'ok', env: env_1.default.NODE_ENV });
});
router.get('/health/readiness', async (_req, res) => {
    try {
        if (!data_source_1.AppDataSource.isInitialized)
            await data_source_1.AppDataSource.initialize();
        await data_source_1.AppDataSource.query('select 1');
        const r = getRedis();
        if (r) {
            if (!r.status || r.status === 'end' || r.status === 'wait')
                await r.connect();
            const pong = await r.ping();
            if (pong !== 'PONG')
                throw new Error('Redis no responde');
        }
        res.json({ status: 'ready' });
    }
    catch (e) {
        res.status(503).json({ status: 'not-ready', reason: e?.message || 'unknown' });
    }
});
exports.default = router;
