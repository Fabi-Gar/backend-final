"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const app_1 = __importDefault(require("./app"));
const env_1 = __importDefault(require("./config/env"));
const data_source_1 = require("./db/data-source");
const pino_1 = __importDefault(require("pino"));
const firms_queue_1 = require("./modules/geoespacial/firms.queue");
const logger = (0, pino_1.default)({ level: env_1.default.LOG_LEVEL });
async function main() {
    try {
        if (!data_source_1.AppDataSource.isInitialized) {
            await data_source_1.AppDataSource.initialize();
            logger.info('✅ Base de datos conectada');
        }
        if (env_1.default.FIRMS_ENABLED) {
            await (0, firms_queue_1.ensureFirmsCron)();
            logger.info(`🛰️ Cron FIRMS programado: ${env_1.default.FIRMS_FETCH_CRON}`);
        }
        const port = env_1.default.PORT || 4000;
        app_1.default.listen(port, () => {
            logger.info(`🚀 Servidor escuchando en http://localhost:${port}`);
            logger.info(`🩺 Healthcheck: /health/liveness | /health/readiness`);
        });
    }
    catch (e) {
        logger.error('❌ Error al iniciar la aplicación');
        logger.error(e);
        process.exit(1);
    }
}
main();
