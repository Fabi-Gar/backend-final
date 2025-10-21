"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushController = void 0;
const push_service_1 = require("./push.service");
exports.PushController = {
    register: async (req, res) => {
        try {
            // TODO: validar auth (JWT/cookie) y usar req.user.id como userId real
            const saved = await push_service_1.PushService.register(req.body);
            res.json({ ok: true, data: saved });
        }
        catch (e) {
            res.status(400).json({ ok: false, error: e?.message || 'Bad request' });
        }
    },
    prefs: async (req, res) => {
        try {
            const updated = await push_service_1.PushService.updatePrefs(req.body);
            res.json({ ok: true, data: updated });
        }
        catch (e) {
            res.status(400).json({ ok: false, error: e?.message || 'Bad request' });
        }
    },
    unregister: async (req, res) => {
        try {
            const updated = await push_service_1.PushService.unregister(req.body);
            res.json({ ok: true, data: updated });
        }
        catch (e) {
            res.status(400).json({ ok: false, error: e?.message || 'Bad request' });
        }
    },
};
