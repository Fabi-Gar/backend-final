"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crearCierre = crearCierre;
// src/modules/cierre/cierre.service.ts
const data_source_1 = require("../../db/data-source");
const typeorm_1 = require("typeorm");
const cierre_operaciones_entity_1 = require("./entities/cierre-operaciones.entity");
const cierre_topografia_entity_1 = require("./entities/cierre-topografia.entity");
const cierre_superficie_entity_1 = require("./entities/cierre-superficie.entity");
const cierre_tecnicas_extincion_entity_1 = require("./entities/cierre-tecnicas-extincion.entity");
const incendio_entity_1 = require("../incendios/entities/incendio.entity");
const auditoria_service_1 = require("../auditoria/auditoria.service");
async function crearCierre(input, ctx) {
    const cierreRepo = data_source_1.AppDataSource.getRepository(cierre_operaciones_entity_1.CierreOperaciones);
    const topoRepo = data_source_1.AppDataSource.getRepository(cierre_topografia_entity_1.CierreTopografia);
    const supRepo = data_source_1.AppDataSource.getRepository(cierre_superficie_entity_1.CierreSuperficie);
    const tecRepo = data_source_1.AppDataSource.getRepository(cierre_tecnicas_extincion_entity_1.CierreTecnicasExtincion);
    const incRepo = data_source_1.AppDataSource.getRepository(incendio_entity_1.Incendio);
    const incendio = await incRepo.findOne({ where: { incendio_uuid: input.incendio_uuid, eliminado_en: (0, typeorm_1.IsNull)() } });
    if (!incendio) {
        const e = new Error('Incendio no existe');
        e.status = 404;
        e.code = 'NOT_FOUND';
        throw e;
    }
    // 1) Cierre general
    const cierreToCreate = cierreRepo.create({ incendio: { incendio_uuid: input.incendio_uuid } });
    const cierre = await cierreRepo.save(cierreToCreate);
    // 2) Topografía (1:1 por incendio)
    let topo = await topoRepo.findOne({ where: { incendio_uuid: input.incendio_uuid, eliminado_en: (0, typeorm_1.IsNull)() } });
    if (!topo) {
        const topoNew = topoRepo.create({
            incendio_uuid: input.incendio_uuid,
            incendio: { incendio_uuid: input.incendio_uuid },
            plano_pct: '0',
            ondulado_pct: '0',
            quebrado_pct: '0'
        });
        topo = await topoRepo.save(topoNew);
        await (0, auditoria_service_1.auditRecord)({
            tabla: 'cierre_topografia',
            registro_uuid: input.incendio_uuid,
            accion: 'INSERT',
            despues: { incendio_uuid: input.incendio_uuid, plano_pct: '0', ondulado_pct: '0', quebrado_pct: '0' },
            ctx
        });
    }
    let sup = await supRepo.findOne({ where: { incendio_uuid: input.incendio_uuid, eliminado_en: (0, typeorm_1.IsNull)() } });
    if (!sup) {
        const supDefaults = {
            bosque_pct: '0',
            matorral_pct: '0',
            pastizal_pct: '0',
            agricola_pct: '0',
            urbana_pct: '0'
        };
        const supNew = supRepo.create({
            incendio_uuid: input.incendio_uuid,
            incendio: { incendio_uuid: input.incendio_uuid }
        });
        for (const [k, v] of Object.entries(supDefaults)) {
            ;
            supNew[k] = v;
        }
        sup = await supRepo.save(supNew);
        await (0, auditoria_service_1.auditRecord)({
            tabla: 'cierre_superficie',
            registro_uuid: input.incendio_uuid,
            accion: 'INSERT',
            despues: { incendio_uuid: input.incendio_uuid, ...supDefaults },
            ctx
        });
    }
    let tec = await tecRepo.findOne({ where: { incendio_uuid: input.incendio_uuid, eliminado_en: (0, typeorm_1.IsNull)() } });
    if (!tec) {
        const tecDefaults = {
            ataque_directo_pct: '0',
            ataque_indirecto_pct: '0',
            contrafuego_pct: '0',
            vigilancia_pct: '0'
        };
        const tecNew = tecRepo.create({
            incendio_uuid: input.incendio_uuid,
            incendio: { incendio_uuid: input.incendio_uuid }
        });
        for (const [k, v] of Object.entries(tecDefaults)) {
            ;
            tecNew[k] = v;
        }
        tec = await tecRepo.save(tecNew);
        await (0, auditoria_service_1.auditRecord)({
            tabla: 'cierre_tecnicas_extincion',
            registro_uuid: input.incendio_uuid,
            accion: 'INSERT',
            despues: { incendio_uuid: input.incendio_uuid, ...tecDefaults },
            ctx
        });
    }
    const cierreUuid = cierre.cierre_operaciones_uuid ??
        cierre.cierre_uuid ??
        input.incendio_uuid;
    await (0, auditoria_service_1.auditRecord)({
        tabla: 'cierre_operaciones',
        registro_uuid: cierreUuid,
        accion: 'INSERT',
        despues: { cierre_uuid: cierreUuid, incendio_uuid: input.incendio_uuid },
        ctx
    });
    return { cierre, topografia: topo, superficie: sup, tecnicas: tec };
}
