"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/push.routes.ts
const express_1 = require("express");
const push_controller_1 = require("./push.controller");
const router = (0, express_1.Router)();
// Registrar token y preferencias
router.post('/push/register', push_controller_1.PushController.register);
// Actualizar solo preferencias
router.put('/push/prefs', push_controller_1.PushController.prefs);
// Desactivar token
router.post('/push/unregister', push_controller_1.PushController.unregister);
exports.default = router;
