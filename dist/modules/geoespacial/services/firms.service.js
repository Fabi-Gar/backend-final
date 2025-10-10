"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runFirmsIngest = runFirmsIngest;
// src/modules/geoespacial/services/firms.service.ts
const data_source_1 = require("../../../db/data-source");
const env_1 = __importDefault(require("../../../config/env"));
const firms_config_1 = require("../firms.config");
const punto_calor_entity_1 = require("../entities/punto-calor.entity");
const auditoria_eventos_entity_1 = require("../../auditoria/entities/auditoria-eventos.entity");
const job_run_entity_1 = require("../../jobs/entities/job-run.entity");
// --- Aliases/normalización de entorno ---
const RADIUS_KM = Number(process.env.FIRMS_RADIUS_KM ?? process.env.FIRMS_BUFFER_KM ?? 25);
const WINDOW_H = Number(process.env.FIRMS_TIME_WINDOW_HOURS ?? process.env.FIRMS_TIME_WINDOW_H ?? 24);
// --- Helpers de parsing seguros ---
function toNum(x) {
    const s = String(x ?? '').trim().replace(/^"(.*)"$/, '$1');
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
}
function toFloat(x) {
    const s = String(x ?? '').trim().replace(/^"(.*)"$/, '$1');
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : NaN;
}
// Hash de deduplicación por minuto + posición redondeada (1e-4°)
function hashDedupe(fuente, instrument, satellite, acq_date, acq_time, lat, lon) {
    const rlat = Math.round(lat * 10000) / 10000;
    const rlon = Math.round(lon * 10000) / 10000;
    const hh = Math.floor(acq_time / 100);
    const mm = acq_time % 100;
    const minute = `${acq_date}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00Z`;
    return `${fuente}|${instrument}|${satellite}|${minute}|${rlat}|${rlon}`;
}
// --- Descarga CSV FIRMS (API key en el path) ---
async function fetchCSV(url) {
    const res = await fetch(url);
    if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(`FIRMS fetch failed (${res.status}): ${t.slice(0, 200)}`);
    }
    const text = await res.text();
    const lines = text.trim().split(/\r?\n/);
    if (!lines.length)
        return [];
    // Header minificado → lowercase, sin BOM
    const header = lines[0].replace(/^\ufeff/, '').trim();
    const cols = header.split(',').map(c => c.trim().toLowerCase());
    // Debug útil en runtime
    console.log('🧩 [FIRMS] Headers:', cols);
    const unquote = (s) => (s != null ? s.replace(/^"(.*)"$/, '$1').trim() : '');
    const rows = lines.slice(1).map(line => {
        const v = line.split(',').map(unquote);
        const o = {};
        for (let i = 0; i < cols.length; i++)
            o[cols[i]] = v[i] ?? '';
        return o;
    });
    // Log sample para detectar cambios de esquema rápido
    if (rows.length) {
        const it = rows[0];
        console.log('🧪 [FIRMS] Primera fila (subset):', {
            lat: it.latitude ?? it.lat,
            lon: it.longitude ?? it.lon,
            date: it.acq_date ?? it.date,
            time: it.acq_time ?? it.time,
            product: it.product,
            instrument: it.instrument,
            satellite: it.satellite,
        });
    }
    return rows;
}
async function fetchAllFirms() {
    const urls = (0, firms_config_1.buildFirmsUrls)();
    console.log('🌍 [FIRMS] URLs generadas:', urls);
    const batches = await Promise.all(urls.map(async (u) => {
        try {
            const csv = await fetchCSV(u);
            console.log(`📦 [FIRMS] ${csv.length} filas desde ${u.slice(0, 80)}...`);
            return csv;
        }
        catch (err) {
            console.error(`❌ [FIRMS] Error al descargar ${u.slice(0, 80)}...`, err.message);
            return [];
        }
    }));
    return batches.flat();
}
// --- Normalización de filas CSV a estructura interna ---
function normalize(items) {
    return items
        .map(it => {
        const lat = toFloat(it.latitude ?? it.lat);
        const lon = toFloat(it.longitude ?? it.lon);
        const acq_date = String(it.acq_date ?? it.date ?? '').slice(0, 10);
        const acq_time = toNum(it.acq_time ?? it.time ?? 0); // soporta "0454"
        const fuente = String(it.source ?? 'FIRMS');
        const instrument = String(it.instrument ?? it.sensor ?? (String(it.product ?? '').toLowerCase().includes('modis') ? 'MODIS' : 'VIIRS'));
        const satellite = String(it.satellite ?? it.sat ?? (it.product ?? ''));
        const daynight = it.daynight ? String(it.daynight) : null;
        const brightness = it.brightness != null && it.brightness !== '' ? toFloat(it.brightness) : null;
        const frp = it.frp != null && it.frp !== '' ? toFloat(it.frp) : null;
        // En VIIRS confidence puede ser porcentaje o letra (n,l,h); aquí lo intentamos como número
        const confidenceParsed = it.confidence != null && it.confidence !== '' ? toFloat(it.confidence) : null;
        const confidence = Number.isFinite(confidenceParsed) ? confidenceParsed : null;
        return {
            fuente,
            instrument,
            satellite,
            acq_date,
            acq_time,
            lat,
            lon,
            daynight,
            brightness,
            frp,
            confidence,
            raw: it
        };
    })
        .filter(x => x.acq_date?.length === 10 &&
        Number.isFinite(x.acq_time) &&
        Number.isFinite(x.lat) &&
        Number.isFinite(x.lon));
}
// --- UPSERT: inserta o actualiza si ya existe el hash_dedupe ---
async function upsertPuntos(norm) {
    if (!norm.length)
        return { insertados: 0, actualizados: 0, ignorados: 0, ids: [] };
    const repo = data_source_1.AppDataSource.getRepository(punto_calor_entity_1.PuntoCalor);
    const vals = norm.map(n => {
        const geomExpr = `ST_SetSRID(ST_MakePoint(${n.lon}, ${n.lat}), 4326)`;
        const hash = hashDedupe(n.fuente, n.instrument, n.satellite, n.acq_date, n.acq_time, n.lat, n.lon);
        return {
            fuente: n.fuente,
            instrument: n.instrument,
            satellite: n.satellite,
            version: null,
            acq_date: n.acq_date,
            acq_time: n.acq_time,
            daynight: n.daynight,
            // ⚠️ tu entity tipa NUMERIC como string|null → mandamos string
            confidence: n.confidence == null ? null : String(n.confidence),
            frp: n.frp == null ? null : String(n.frp),
            brightness: n.brightness == null ? null : String(n.brightness),
            bright_ti4: null,
            bright_ti5: null,
            scan: null,
            track: null,
            geom: () => geomExpr, // raw SQL
            region: null,
            hash_dedupe: hash
        };
    });
    const batch = Number.isFinite(env_1.default.FIRMS_BATCH_SIZE) ? env_1.default.FIRMS_BATCH_SIZE : 2000;
    let insertados = 0;
    let actualizados = 0;
    const ids = [];
    for (let i = 0; i < vals.length; i += batch) {
        const slice = vals.slice(i, i + batch);
        // Estimación de existentes antes del UPSERT (para métricas)
        const existed = await repo.createQueryBuilder('p')
            .select(['p.hash_dedupe'])
            .where('p.hash_dedupe IN (:...h)', { h: slice.map(s => s.hash_dedupe) })
            .getMany();
        const existedSet = new Set(existed.map(e => e.hash_dedupe));
        const r = await repo
            .createQueryBuilder()
            .insert()
            .values(slice)
            .onConflict(`("hash_dedupe") DO UPDATE SET
          daynight       = EXCLUDED.daynight,
          confidence     = EXCLUDED.confidence,
          frp            = EXCLUDED.frp,
          brightness     = EXCLUDED.brightness,
          bright_ti4     = EXCLUDED.bright_ti4,
          bright_ti5     = EXCLUDED.bright_ti5,
          scan           = EXCLUDED.scan,
          track          = EXCLUDED.track,
          region         = EXCLUDED.region,
          actualizado_en = now()`)
            .returning(['punto_calor_uuid', 'hash_dedupe'])
            .execute();
        const ret = r.raw;
        ids.push(...ret.map(x => x.punto_calor_uuid));
        // Métricas: los que ya existían → actualizados; resto → insertados
        const sliceHashes = slice.map(s => s.hash_dedupe);
        let preExisting = 0;
        for (const h of sliceHashes)
            if (existedSet.has(h))
                preExisting++;
        actualizados += preExisting;
        insertados += Math.max(0, slice.length - preExisting);
    }
    return { insertados, actualizados, ignorados: 0, ids };
}
// --- Asociación puntos ↔ incendios cercanos en espacio/tiempo ---
async function associateToIncendios(puntoIds) {
    if (!puntoIds.length)
        return { asociados: 0, porIncendio: {} };
    const radiusKm = RADIUS_KM;
    const deltaH = WINDOW_H;
    const rMeters = radiusKm * 1000;
    const raw = await data_source_1.AppDataSource.query(`
    with pts as (
      select p.punto_calor_uuid, p.acq_date, p.acq_time, p.geom
      from puntos_calor p
      where p.punto_calor_uuid = ANY($1)
    ),
    pts_dt as (
      select punto_calor_uuid,
             to_timestamp(
               acq_date || ' ' ||
               lpad((acq_time/100)::int::text,2,'0') || ':' ||
               lpad((acq_time%100)::int::text,2,'0'),
               'YYYY-MM-DD HH24:MI'
             ) at time zone 'UTC' as acq_dt,
             geom
      from pts
    ),
    cand as (
      select i.incendio_uuid, i.creado_en, i.centroide as igeom
      from incendios i
      join estado_incendio e on e.estado_incendio_uuid = i.estado_incendio_uuid
      where i.eliminado_en is null
        and i.centroide is not null
        and e.codigo in ('pendiente','activo')
    ),
    pairs as (
      select
        p.punto_calor_uuid,
        c.incendio_uuid,
        ST_DistanceSphere(p.geom, c.igeom) as dist,
        EXTRACT(EPOCH FROM (p.acq_dt - c.creado_en))/60 as delta_min
      from pts_dt p
      join cand c
        on ST_DWithin(p.geom::geography, c.igeom::geography, $2)
      where abs(EXTRACT(EPOCH FROM (p.acq_dt - c.creado_en))) <= $3*3600
    ),
    pick as (
      select distinct on (punto_calor_uuid)
        punto_calor_uuid, incendio_uuid, dist, delta_min
      from pairs
      order by punto_calor_uuid, dist asc
    )
    select * from pick
    `, [puntoIds, rMeters, deltaH]);
    let asociados = 0;
    const porIncendio = {};
    const repo = data_source_1.AppDataSource.getRepository(punto_calor_entity_1.PuntoCalor);
    for (const row of raw) {
        const pcId = row.punto_calor_uuid;
        const incId = row.incendio_uuid;
        const existing = await repo.findOne({ where: { punto_calor_uuid: pcId }, relations: ['incendio'] });
        if (existing && !existing.incendio) {
            await repo.update({ punto_calor_uuid: pcId }, { incendio: { incendio_uuid: incId } });
            asociados += 1;
            porIncendio[incId] = (porIncendio[incId] || 0) + 1;
        }
    }
    return { asociados, porIncendio, regla: `R=${radiusKm}km,Δt=±${deltaH}h` };
}
// --- Orquestador principal ---
async function runFirmsIngest() {
    const jobRepo = data_source_1.AppDataSource.getRepository(job_run_entity_1.JobRun);
    const auditRepo = data_source_1.AppDataSource.getRepository(auditoria_eventos_entity_1.AuditoriaEventos);
    const job = jobRepo.create({ nombre_job: 'firms:ingest', inicio: new Date(), status: 'RUNNING' });
    await jobRepo.save(job);
    try {
        console.log('🚀 [FIRMS] Iniciando ingesta manual...');
        const items = await fetchAllFirms();
        console.log(`📊 [FIRMS] Total filas brutas: ${items.length}`);
        const norm = normalize(items);
        console.log(`📊 [FIRMS] Normalizadas: ${norm.length}`);
        const up = await upsertPuntos(norm);
        console.log(`💾 [FIRMS] Insertados: ${up.insertados}, Actualizados: ${up.actualizados}, Ignorados: ${up.ignorados}`);
        const asoc = await associateToIncendios(up.ids);
        console.log(`🔗 [FIRMS] Asociados: ${asoc.asociados}`);
        job.insertados = up.insertados;
        job.ignorados = up.ignorados;
        job.actualizados = up.actualizados; // si tienes la columna, guárdalo; si no, ignora esta línea
        job.asociados = asoc.asociados;
        job.status = 'OK';
        job.fin = new Date();
        await jobRepo.save(job);
        return { ok: true, insertados: up.insertados, actualizados: up.actualizados, ignorados: up.ignorados, asociados: asoc.asociados };
    }
    catch (e) {
        console.error('❌ [FIRMS] Error general:', e);
        job.status = 'ERROR';
        job.fin = new Date();
        job.errores = { message: e?.message || String(e) };
        await jobRepo.save(job);
        throw e;
    }
}
