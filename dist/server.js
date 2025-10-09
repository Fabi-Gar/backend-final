"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
;
(function forceNoSSL() {
    delete process.env.PGSSLMODE;
    delete process.env.PGSSLROOTCERT;
    delete process.env.PGSSLCERT;
    delete process.env.PGSSLKEY;
    delete process.env.PGSSLPASSWORD;
    delete process.env.DATABASE_URL;
})();
const app_1 = __importDefault(require("./app"));
const env_1 = __importDefault(require("./config/env"));
const data_source_1 = require("./db/data-source");
async function main() {
    if (!data_source_1.AppDataSource.isInitialized)
        await data_source_1.AppDataSource.initialize();
    app_1.default.listen(env_1.default.PORT, () => {
        const base = `http://localhost:${env_1.default.PORT}`;
        console.log(`up: ${base}  liveness: ${base}/health/liveness  readiness: ${base}/health/readiness`);
    });
}
main().catch((e) => {
    console.error('startup_error', e);
    process.exit(1);
});
