"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/notificaciones/testpush.routes.ts
const express_1 = require("express");
const expoPush_service_1 = require("./expoPush.service");
const pushPrefs_repo_1 = require("./pushPrefs.repo");
const auth_1 = require("../../middlewares/auth");
const router = (0, express_1.Router)();
// 🧪 Ruta 1: Test simple con token manual
router.post('/test-push', async (req, res) => {
    try {
        const { token, title, body } = req.body;
        if (!token) {
            return res.status(400).json({
                ok: false,
                error: 'Se requiere el campo "token"'
            });
        }
        console.log('📤 Enviando notificación de prueba a:', token);
        await (0, expoPush_service_1.sendExpoPush)([token], {
            title: title || '🔥 Notificación de prueba',
            body: body || 'Si ves esto, Expo Push funciona correctamente',
            data: {
                test: 'ok',
                timestamp: new Date().toISOString(),
                deeplink: '/test',
            },
        });
        res.json({
            ok: true,
            message: 'Notificación enviada exitosamente',
            sent_to: token.substring(0, 30) + '...',
        });
    }
    catch (e) {
        console.error('❌ Error enviando notificación de prueba:', e);
        res.status(500).json({
            ok: false,
            error: e?.message || 'Error desconocido'
        });
    }
});
// 🧪 Ruta 2: Test a usuario autenticado
router.post('/test-push-me', auth_1.guardAuth, async (req, res) => {
    try {
        const userId = res.locals?.ctx?.user?.usuario_uuid;
        if (!userId) {
            return res.status(401).json({
                ok: false,
                error: 'No autenticado'
            });
        }
        console.log('📤 Buscando tokens del usuario:', userId);
        const prefs = await pushPrefs_repo_1.PushPrefsRepo.getByUserId(userId);
        if (!prefs || !prefs.tokens || prefs.tokens.length === 0) {
            return res.status(404).json({
                ok: false,
                error: 'No tienes tokens registrados. Registra tu dispositivo primero.'
            });
        }
        const activeTokens = prefs.tokens
            .filter(t => t.active)
            .map(t => t.token);
        if (activeTokens.length === 0) {
            return res.status(404).json({
                ok: false,
                error: 'No tienes tokens activos'
            });
        }
        console.log(`📤 Enviando notificación a ${activeTokens.length} dispositivo(s)`);
        await (0, expoPush_service_1.sendExpoPush)(activeTokens, {
            title: '🎉 Test de notificación personal',
            body: 'Tus notificaciones están funcionando correctamente',
            data: {
                test: 'ok',
                user_id: userId,
                timestamp: new Date().toISOString(),
            },
        });
        res.json({
            ok: true,
            message: `Notificación enviada a ${activeTokens.length} dispositivo(s)`,
            devices: activeTokens.length,
        });
    }
    catch (e) {
        console.error('❌ Error enviando notificación personal:', e);
        res.status(500).json({
            ok: false,
            error: e?.message || 'Error desconocido'
        });
    }
});
// 🧪 Ruta 3: Test de notificación por región
router.post('/test-push-region', async (req, res) => {
    try {
        const { municipioCode, departamentoCode } = req.body;
        if (!municipioCode && !departamentoCode) {
            return res.status(400).json({
                ok: false,
                error: 'Se requiere municipioCode o departamentoCode'
            });
        }
        let tokens = [];
        let locationName = '';
        if (municipioCode) {
            tokens = await pushPrefs_repo_1.PushPrefsRepo.getTokensByMunicipio(municipioCode);
            locationName = `municipio ${municipioCode}`;
        }
        else if (departamentoCode) {
            tokens = await pushPrefs_repo_1.PushPrefsRepo.getTokensByDepartamento(departamentoCode);
            locationName = `departamento ${departamentoCode}`;
        }
        if (tokens.length === 0) {
            return res.status(404).json({
                ok: false,
                error: `No hay usuarios suscritos a ${locationName}`
            });
        }
        console.log(`📤 Enviando notificación a ${tokens.length} usuario(s) en ${locationName}`);
        await (0, expoPush_service_1.sendExpoPush)(tokens, {
            title: '🔥 Alerta de prueba regional',
            body: `Test de notificación para ${locationName}`,
            data: {
                test: 'ok',
                region: municipioCode || departamentoCode,
                timestamp: new Date().toISOString(),
            },
        });
        res.json({
            ok: true,
            message: `Notificación enviada a ${tokens.length} usuario(s)`,
            region: locationName,
            recipients: tokens.length,
        });
    }
    catch (e) {
        console.error('❌ Error enviando notificación regional:', e);
        res.status(500).json({
            ok: false,
            error: e?.message || 'Error desconocido'
        });
    }
});
// 🧪 Ruta 4: Verificar configuración del usuario
router.get('/my-push-config', auth_1.guardAuth, async (req, res) => {
    try {
        const userId = res.locals?.ctx?.user?.usuario_uuid;
        if (!userId) {
            return res.status(401).json({
                ok: false,
                error: 'No autenticado'
            });
        }
        const prefs = await pushPrefs_repo_1.PushPrefsRepo.getByUserId(userId);
        if (!prefs) {
            return res.status(404).json({
                ok: false,
                error: 'No tienes configuración de notificaciones'
            });
        }
        const activeTokens = (prefs.tokens || [])
            .filter(t => t.active)
            .map(t => ({
            token: t.token.substring(0, 30) + '...',
            created: t.createdAt,
        }));
        res.json({
            ok: true,
            config: {
                userId: prefs.userId,
                municipiosSuscritos: prefs.municipiosSuscritos,
                departamentosSuscritos: prefs.departamentosSuscritos,
                avisarmeAprobado: prefs.avisarmeAprobado,
                avisarmeActualizaciones: prefs.avisarmeActualizaciones,
                avisarmeCierres: prefs.avisarmeCierres,
                activeDevices: activeTokens.length,
                devices: activeTokens,
            }
        });
    }
    catch (e) {
        console.error('❌ Error obteniendo configuración:', e);
        res.status(500).json({
            ok: false,
            error: e?.message || 'Error desconocido'
        });
    }
});
exports.default = router;
