"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const env_1 = __importDefault(require("../config/env"));
// Fuerza que jamás se use SSL sin importar el entorno
delete process.env.PGSSLMODE;
delete process.env.PGSSLROOTCERT;
delete process.env.PGSSLCERT;
delete process.env.PGSSLKEY;
delete process.env.PGSSLPASSWORD;
delete process.env.DATABASE_URL;
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: env_1.default.DB_HOST,
    port: env_1.default.DB_PORT,
    username: env_1.default.DB_USER,
    password: env_1.default.DB_PASSWORD,
    database: env_1.default.DB_NAME,
    ssl: false,
    extra: {
        ssl: false,
        min: env_1.default.DB_POOL_MIN,
        max: env_1.default.DB_POOL_MAX,
        idleTimeoutMillis: env_1.default.DB_POOL_IDLE_MS,
    },
    synchronize: false,
    logging: false,
    entities: ['dist/modules/**/entities/*.js'],
    migrations: ['dist/db/migrations/*.js'],
    migrationsTableName: 'migrations',
});
