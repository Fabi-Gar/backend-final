"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/app/testPush.routes.ts
const express_1 = require("express");
const expoPush_service_1 = require("./expoPush.service");
const router = (0, express_1.Router)();
router.post('/test-push', async (req, res) => {
    try {
        const { token } = req.body;
        await (0, expoPush_service_1.sendExpoPush)([token], {
            title: '🔥 Notificación de prueba',
            body: 'Si ves esto, Expo Push funciona bien',
            data: { test: 'ok' },
        });
        res.json({ ok: true });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ ok: false });
    }
});
exports.default = router;
