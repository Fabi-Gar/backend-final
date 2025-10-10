"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const data_source_1 = require("../db/data-source");
const job_run_entity_1 = require("../modules/jobs/entities/job-run.entity");
const auditoria_eventos_entity_1 = require("../modules/auditoria/entities/auditoria-eventos.entity");
const incendio_entity_1 = require("../modules/incendios/entities/incendio.entity");
const reporte_entity_1 = require("../modules/incendios/entities/reporte.entity");
const punto_calor_entity_1 = require("../modules/geoespacial/entities/punto-calor.entity");
const estado_incendio_entity_1 = require("../modules/catalogos/entities/estado-incendio.entity");
const notificacion_entity_1 = require("../modules/notificaciones/entities/notificacion.entity");
const router = (0, express_1.Router)();
// ✅ /monitor/jobs
router.get('/jobs', async (req, res, next) => {
    try {
        const jobName = req.query.job ?? undefined;
        const status = req.query.status ?? undefined;
        const limit = Math.min(Number(req.query.limit) || 20, 200);
        const offset = Number(req.query.offset) || 0;
        const repo = data_source_1.AppDataSource.getRepository(job_run_entity_1.JobRun);
        const qb = repo
            .createQueryBuilder('j')
            .orderBy('j.inicio', 'DESC')
            .take(limit)
            .skip(offset);
        if (jobName)
            qb.andWhere('j.nombre_job = :job', { job: jobName });
        if (status)
            qb.andWhere('j.status = :status', { status });
        const [rows, total] = await qb.getManyAndCount();
        const items = rows.map(r => {
            const durationMs = r.fin && r.inicio ? (new Date(r.fin).getTime() - new Date(r.inicio).getTime()) : null;
            return {
                job_run_uuid: r.job_run_uuid,
                job_name: r.nombre_job,
                status: r.status,
                started_at: r.inicio,
                finished_at: r.fin,
                duration_ms: durationMs,
                metrics: {
                    inserted: r.insertados ?? 0,
                    deduplicated: r.ignorados ?? 0,
                    associated: r.asociados ?? 0,
                },
                errors: r.errores ?? null,
            };
        });
        res.json({ items, count: items.length, total });
    }
    catch (err) {
        next(err);
    }
});
// ✅ /monitor/auditoria
router.get('/auditoria', async (_req, res, next) => {
    try {
        const repo = data_source_1.AppDataSource.getRepository(auditoria_eventos_entity_1.AuditoriaEventos);
        const items = await repo.find({ order: { creado_en: 'DESC' }, take: 50 });
        res.json({ items, count: items.length });
    }
    catch (err) {
        next(err);
    }
});
// ✅ /monitor/stats
router.get('/stats', async (_req, res, next) => {
    try {
        const incendioRepo = data_source_1.AppDataSource.getRepository(incendio_entity_1.Incendio);
        const estadoRepo = data_source_1.AppDataSource.getRepository(estado_incendio_entity_1.EstadoIncendio);
        const reporteRepo = data_source_1.AppDataSource.getRepository(reporte_entity_1.Reporte);
        const puntoRepo = data_source_1.AppDataSource.getRepository(punto_calor_entity_1.PuntoCalor);
        // 1) Incendios por estado (agrupando por FK estado_incendio_uuid)
        const incendiosPorEstadoRaw = await incendioRepo
            .createQueryBuilder('i')
            .select('i.estado_incendio_uuid', 'estado_id')
            .addSelect('COUNT(*)', 'total')
            .where('i.eliminado_en IS NULL')
            .groupBy('i.estado_incendio_uuid')
            .getRawMany();
        // 2) Intentamos mapear a un label legible usando EstadoIncendio
        const estados = await estadoRepo.find();
        // Prioridad de campos posibles para nombre/código
        const labelCandidates = ['nombre', 'codigo', 'name', 'code', 'slug', 'descripcion'];
        // Detecta el primer campo que exista en la entidad EstadoIncendio
        const estadoCols = estadoRepo.metadata.columns.map(c => c.propertyName);
        const labelField = labelCandidates.find(c => estadoCols.includes(c)) ?? null;
        const mapById = {};
        for (const e of estados) {
            // PK se llama estado_incendio_uuid en tu JoinColumn
            const pkCol = estadoRepo.metadata.primaryColumns[0]?.propertyName ?? 'estado_incendio_uuid';
            const id = e[pkCol];
            mapById[id] = {
                id,
                label: labelField ? e[labelField] : null,
            };
        }
        const incendios_por_estado = incendiosPorEstadoRaw.map(r => ({
            estado_uuid: r.estado_id,
            estado: mapById[r.estado_id]?.label ?? r.estado_id,
            total: Number(r.total),
        }));
        // 3) Reportes últimos 7 días (ajusta columna si difiere)
        const reportes_7d = await reporteRepo
            .createQueryBuilder('r')
            .where("r.creado_en >= NOW() - INTERVAL '7 days'")
            .getCount();
        // 4) Puntos FIRMS últimos 3 días (ajusta columna si difiere)
        const puntos_firms_3d = await puntoRepo
            .createQueryBuilder('p')
            .where("p.creado_en >= NOW() - INTERVAL '3 days'")
            .getCount();
        res.json({
            incendios_por_estado,
            reportes_7d,
            puntos_firms_3d: puntos_firms_3d,
        });
    }
    catch (err) {
        next(err);
    }
});
router.get('/notificaciones', async (req, res, next) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 50, 200);
        const repo = data_source_1.AppDataSource.getRepository(notificacion_entity_1.Notificacion);
        const items = await repo.find({
            order: { creado_en: 'DESC' },
            take: limit,
        });
        res.json({ items, count: items.length });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
