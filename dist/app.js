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
// Middlewares personalizados
const context_1 = require("./middlewares/context");
const auth_1 = require("./middlewares/auth");
// Módulos
const firms_routes_1 = __importDefault(require("./modules/geoespacial/firms.routes"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const usuarios_routes_1 = __importDefault(require("./modules/seguridad/usuarios.routes"));
const incendios_routes_1 = __importDefault(require("./modules/incendios/incendios.routes"));
const reportes_routes_1 = __importDefault(require("./modules/incendios/reportes.routes"));
const catalogos_routes_1 = __importDefault(require("./app/catalogos.routes"));
const roles_routes_1 = __importDefault(require("./modules/seguridad/roles.routes"));
const instituciones_routes_1 = __importDefault(require("./modules/seguridad/instituciones.routes"));
const estados_incendio_routes_1 = __importDefault(require("./app/estados-incendio.routes"));
const puntos_calor_routes_1 = __importDefault(require("./modules/geoespacial/puntos-calor.routes"));
const monitor_routes_1 = __importDefault(require("./app/monitor.routes"));
const departamentos_routes_1 = __importDefault(require("./modules/catalogos/entities/departamentos.routes"));
const cierre_routes_1 = __importDefault(require("./modules/cierre/cierre.routes"));
const logger = (0, pino_1.default)({ level: env_1.default.LOG_LEVEL });
const app = (0, express_1.default)();
// app.set('trust proxy', 1) // si usas proxy
// ---------------- Middlewares base ----------------
app.use((0, helmet_1.default)({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use((0, cors_1.default)({
    origin(origin, cb) {
        if (!origin)
            return cb(null, true);
        if (env_1.default.CORS_ALLOWED_ORIGINS_LIST.includes(origin))
            return cb(null, true);
        const e = new Error('CORS blocked');
        e.status = 403;
        e.code = 'CORS_BLOCKED';
        return cb(e);
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
app.use(context_1.contextMiddleware);
app.use(auth_1.authMiddleware);
app.use(health_routes_1.default);
app.use('/auth', auth_routes_1.default);
app.use('/usuarios', usuarios_routes_1.default);
app.use('/incendios', incendios_routes_1.default);
app.use('/reportes', reportes_routes_1.default);
app.use('/catalogos', catalogos_routes_1.default);
app.use('/roles', roles_routes_1.default);
app.use('/firms', firms_routes_1.default);
app.use('/monitor', monitor_routes_1.default);
app.use('/departamentos', departamentos_routes_1.default);
app.use('/cierre', cierre_routes_1.default);
app.use('/instituciones', instituciones_routes_1.default);
app.use('/puntos-calor', puntos_calor_routes_1.default);
app.use(estados_incendio_routes_1.default);
app.get('/test-auth', (_req, res) => {
    res.json({ ok: true, user: res.locals.ctx?.user || null });
});
app.use(error_1.notFound);
app.use(error_1.onError);
exports.default = app;
