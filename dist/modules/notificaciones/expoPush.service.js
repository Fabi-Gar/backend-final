"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendExpoPush = sendExpoPush;
// src/services/expoPush.ts
const node_fetch_1 = __importDefault(require("node-fetch"));
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
function chunk(arr, size = 100) {
    const out = [];
    for (let i = 0; i < arr.length; i += size)
        out.push(arr.slice(i, i + size));
    return out;
}
async function sendExpoPush(to, payload) {
    if (!to.length)
        return;
    for (const batch of chunk(to, 100)) {
        const messages = batch.map((token) => ({
            to: token,
            title: payload.title,
            body: payload.body,
            data: payload.data ?? {},
            sound: payload.sound ?? 'default',
            channelId: 'default',
        }));
        const res = await (0, node_fetch_1.default)(EXPO_PUSH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messages),
        });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            console.error('[ExpoPush] error', res.status, text);
        }
        else {
            // opcional: manejar receipts
            // const json = await res.json();
        }
    }
}
