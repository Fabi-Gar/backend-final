"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const pino_1 = __importDefault(require("pino"));
const pino_http_1 = __importDefault(require("pino-http"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = __importDefault(require("./config/env"));
const health_routes_1 = __importDefault(require("./app/health.routes"));
const error_1 = require("./app/error");
const logger = (0, pino_1.default)({ level: env_1.default.LOG_LEVEL });
const app = (0, express_1.default)();
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: false }));
app.use((0, cors_1.default)({
    origin(origin, cb) {
        if (!origin)
            return cb(null, true);
        if (env_1.default.CORS_ALLOWED_ORIGINS_LIST.includes(origin))
            return cb(null, true);
        cb(new Error('CORS blocked'));
    },
    credentials: true,
}));
app.use((0, pino_http_1.default)({ logger }));
app.use(express_1.default.json({ limit: `${env_1.default.PAYLOAD_LIMIT_MB}mb` }));
app.use((0, express_rate_limit_1.default)({
    windowMs: env_1.default.RATE_LIMIT_WINDOW_MS,
    limit: env_1.default.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
}));
app.use(health_routes_1.default);
app.use(error_1.notFound);
app.use(error_1.onError);
exports.default = app;
