"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const data_source_1 = require("../../db/data-source");
const notificacion_entity_1 = require("./entities/notificacion.entity");
const router = (0, express_1.Router)();
router.get('/notificaciones', async (req, res, next) => {
    try {
        const usuario_uuid = String(req.query.usuario_uuid);
        const repo = data_source_1.AppDataSource.getRepository(notificacion_entity_1.Notificacion);
        const rows = await repo.createQueryBuilder('n')
            .where('n.usuario_uuid = :u', { u: usuario_uuid })
            .orderBy('n.creado_en', 'DESC')
            .take(50)
            .getMany();
        res.json(rows);
    }
    catch (e) {
        next(e);
    }
});
router.post('/notificaciones/:id/leer', async (req, res, next) => {
    try {
        const id = req.params.id;
        await data_source_1.AppDataSource.getRepository(notificacion_entity_1.Notificacion).update({ notificacion_uuid: id }, { leida_en: new Date() });
        res.json({ ok: true });
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
