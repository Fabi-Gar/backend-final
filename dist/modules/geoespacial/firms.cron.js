"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startFirmsCron = startFirmsCron;
// src/modules/geoespacial/firms.cron.ts
const node_cron_1 = __importDefault(require("node-cron"));
const firms_service_1 = require("./services/firms.service");
let started = false;
function startFirmsCron() {
    if (started)
        return;
    started = true;
    // Cada 2 horas (ajusta si quieres horarios fijos)
    node_cron_1.default.schedule('0 */2 * * *', async () => {
        try {
            console.log('⏰ [cron] FIRMS ingest...');
            await (0, firms_service_1.runFirmsIngest)();
            console.log('✅ [cron] FIRMS OK');
        }
        catch (e) {
            console.error('❌ [cron] FIRMS error:', e?.message || e);
        }
    }, { timezone: 'America/Guatemala' });
    (async () => {
        try {
            console.log('🚀 [boot] FIRMS ingest inicial...');
            await (0, firms_service_1.runFirmsIngest)();
            console.log('✅ [boot] FIRMS OK');
        }
        catch (e) {
            console.error('❌ [boot] FIRMS error:', e?.message || e);
        }
    })();
}
