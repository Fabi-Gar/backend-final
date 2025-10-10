"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.firmsQueue = void 0;
exports.ensureFirmsCron = ensureFirmsCron;
// src/modules/geoespacial/firms.queue.ts
const env_1 = __importDefault(require("../../config/env"));
const bulls_1 = require("../../queue/bulls");
const firms_service_1 = require("./services/firms.service");
const QUEUE_NAME = 'firms_ingest';
const JOB_NAME = 'firms:ingest';
exports.firmsQueue = (0, bulls_1.buildQueue)(QUEUE_NAME);
(0, bulls_1.buildWorker)(QUEUE_NAME, async () => {
    await (0, firms_service_1.runFirmsIngest)();
});
async function ensureFirmsCron() {
    if (!env_1.default.FIRMS_ENABLED)
        return;
    await exports.firmsQueue.add(JOB_NAME, {}, { ...bulls_1.defaultJobOptions, repeat: { pattern: env_1.default.FIRMS_FETCH_CRON } });
}
