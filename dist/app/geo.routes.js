"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const data_source_1 = require("../db/data-source");
const incendio_entity_1 = require("../modules/incendios/entities/incendio.entity");
const router = (0, express_1.Router)();
router.get('/geo/incendios', async (req, res, next) => {
    try {
        const bbox = String(req.query.bbox || '');
        const lon = req.query.lon ? Number(req.query.lon) : undefined;
        const lat = req.query.lat ? Number(req.query.lat) : undefined;
        const radio_km = req.query.radio_km ? Number(req.query.radio_km) : undefined;
        const solo_publicos = String(req.query.solo_publicos || 'true') === 'true';
        const repo = data_source_1.AppDataSource.getRepository(incendio_entity_1.Incendio);
        const qb = repo.createQueryBuilder('i').where('i.eliminado_en IS NULL');
        if (solo_publicos)
            qb.andWhere('i.visible_publico = true');
        if (bbox) {
            const [minLon, minLat, maxLon, maxLat] = bbox.split(',').map(Number);
            qb.andWhere(`ST_Intersects(i.centroide, ST_MakeEnvelope(:minLon,:minLat,:maxLon,:maxLat,4326))`, { minLon, minLat, maxLon, maxLat });
        }
        else if (lon !== undefined && lat !== undefined && radio_km !== undefined) {
            qb.andWhere(`ST_DWithin(i.centroide::geography, ST_SetSRID(ST_MakePoint(:lon,:lat),4326)::geography, :m)`, { lon, lat, m: radio_km * 1000 });
        }
        qb.orderBy('i.creado_en', 'DESC').limit(500);
        const items = await qb.getMany();
        res.json(items);
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
