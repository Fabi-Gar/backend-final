"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultJobOptions = exports.queuePrefix = void 0;
exports.buildQueue = buildQueue;
exports.buildWorker = buildWorker;
// src/queue/bulls.ts
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = __importDefault(require("../config/env"));
// ⚠️ BullMQ v5: ioredis debe tener maxRetriesPerRequest=null (y conviene enableReadyCheck=false)
const connection = new ioredis_1.default(env_1.default.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    // Si tu Redis requiere TLS (Redis Cloud/Upstash), descomenta:
    // tls: { rejectUnauthorized: false },
});
exports.queuePrefix = env_1.default.QUEUE_PREFIX || 'incendios'; // sin ':'
function buildQueue(name) {
    return new bullmq_1.Queue(name, { connection, prefix: exports.queuePrefix });
}
function buildWorker(name, processor) {
    // Worker creará su conexión de bloqueo internamente usando estas opciones
    return new bullmq_1.Worker(name, processor, { connection, prefix: exports.queuePrefix });
}
exports.defaultJobOptions = {
    attempts: 3,
    backoff: { type: 'exponential', delay: 10_000 },
    removeOnComplete: 50,
    removeOnFail: 100,
};
