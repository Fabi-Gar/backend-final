"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// config/env.ts
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
const dotenv_expand_1 = __importDefault(require("dotenv-expand"));
dotenv_expand_1.default.expand(dotenv_1.default.config());
const schema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    PORT: zod_1.z.coerce.number().int().positive().default(4000),
    APP_TIMEZONE: zod_1.z.string().min(1).default('America/Guatemala'),
    LOG_LEVEL: zod_1.z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    DB_HOST: zod_1.z.string().min(1),
    DB_PORT: zod_1.z.coerce.number().int().positive().default(5432),
    DB_NAME: zod_1.z.string().min(1),
    DB_USER: zod_1.z.string().min(1),
    DB_PASSWORD: zod_1.z.string().min(1),
    DB_SSL: zod_1.z.coerce.boolean().default(false),
    DB_POOL_MIN: zod_1.z.coerce.number().int().nonnegative().default(2),
    DB_POOL_MAX: zod_1.z.coerce.number().int().positive().default(10),
    DB_POOL_IDLE_MS: zod_1.z.coerce.number().int().nonnegative().default(10000),
    HASH_ALGO: zod_1.z.enum(['argon2id', 'bcrypt']).default('argon2id'),
    ARGON2_MEMORY: zod_1.z.coerce.number().int().positive().default(65536),
    ARGON2_TIME: zod_1.z.coerce.number().int().positive().default(3),
    ARGON2_PARALLELISM: zod_1.z.coerce.number().int().positive().default(1),
    JWT_SECRET: zod_1.z.string().min(1),
    JWT_ISSUER: zod_1.z.string().min(1).default('app-incendios'),
    JWT_AUDIENCE: zod_1.z.string().min(1).default('usuarios-app'),
    JWT_EXPIRES_IN: zod_1.z.string().min(1).default('2h'),
    CORS_ALLOWED_ORIGINS: zod_1.z.string().default('http://localhost:3000'),
    RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().int().positive().default(60000),
    RATE_LIMIT_MAX: zod_1.z.coerce.number().int().positive().default(60),
    PAYLOAD_LIMIT_MB: zod_1.z.coerce.number().int().positive().default(10),
    STORAGE_BUCKET_BASE_URL: zod_1.z.string().url().optional(),
    MEDIA_BASE_URL: zod_1.z.string().url().optional(),
    FIRMS_ENABLED: zod_1.z.coerce.boolean().default(true),
    FIRMS_API_KEY: zod_1.z.string().min(1),
    FIRMS_COUNTRY: zod_1.z.string().min(2).default('GTM'),
    FIRMS_PRODUCTS: zod_1.z.string().default('VIIRS_SNPP_NRT,VIIRS_NOAA20_NRT,MODIS_NRT')
        .transform(s => s.split(',').map(x => x.trim()).filter(Boolean)),
    FIRMS_DAYS: zod_1.z.coerce.number().int().positive().default(3),
    FIRMS_BBOX_GTM: zod_1.z.string().default(''),
    FIRMS_USE_AREA_FALLBACK: zod_1.z.coerce.boolean().default(true),
    FIRMS_FETCH_CRON: zod_1.z.string().default('0 */2 * * *'),
    FIRMS_BUFFER_KM: zod_1.z.coerce.number().positive().default(25),
    FIRMS_TIME_WINDOW_H: zod_1.z.coerce.number().int().positive().default(48),
    FIRMS_BATCH_SIZE: zod_1.z.coerce.number().int().positive().default(2000),
    REDIS_URL: zod_1.z.string().default('redis://localhost:6379'),
    QUEUE_PREFIX: zod_1.z.string().default('incendios'),
    SSE_HEARTBEAT_MS: zod_1.z.coerce.number().int().positive().default(15000),
    HEALTHCHECK_PATH: zod_1.z.string().min(1).default('/health/liveness'),
    HEALTHCHECK_INTERVAL: zod_1.z.string().min(1).default('30s'),
    HEALTHCHECK_TIMEOUT: zod_1.z.string().min(1).default('5s'),
    TZ: zod_1.z.string().min(1).default('America/Guatemala'),
});
const raw = schema.parse(process.env);
const DEFAULT_BASE = `http://localhost:${raw.PORT}`;
const env = {
    ...raw,
    MEDIA_BASE_URL: raw.MEDIA_BASE_URL ?? DEFAULT_BASE,
    CORS_ALLOWED_ORIGINS_LIST: raw.CORS_ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean),
};
exports.default = env;
