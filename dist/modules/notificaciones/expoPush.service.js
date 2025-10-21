"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendExpoPush = sendExpoPush;
// src/services/expoPush.service.ts
// Ahora usa Firebase internamente
const firebasePush_service_1 = require("./firebasePush.service");
async function sendExpoPush(to, payload) {
    if (!to || to.length === 0) {
        console.log('⏭️ No hay tokens para enviar');
        return;
    }
    console.log(`📤 Enviando a ${to.length} dispositivo(s)`);
    await (0, firebasePush_service_1.sendFirebasePush)(to, {
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
    });
}
