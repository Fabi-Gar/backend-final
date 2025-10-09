// src/modules/firms/services/firms.service.ts
import { AppDataSource } from '../../../db/data-source'
import env from '../../../config/env'
import { buildFirmsUrls } from '../firms.config'
import { PuntoCalor } from '../entities/punto-calor.entity'
import { AuditoriaEventos } from '../../auditoria/entities/auditoria-eventos.entity'
import { JobRun } from '../../jobs/entities/job-run.entity'

type Row = Record<string, any>

// Aliases/normalización de variables de entorno
const RADIUS_KM = Number(process.env.FIRMS_RADIUS_KM ?? process.env.FIRMS_BUFFER_KM ?? 25)
const WINDOW_H  = Number(process.env.FIRMS_TIME_WINDOW_HOURS ?? process.env.FIRMS_TIME_WINDOW_H ?? 24)

function hashDedupe(
  fuente: string,
  instrument: string,
  satellite: string,
  acq_date: string,
  acq_time: number,
  lat: number,
  lon: number
) {
  const rlat = Math.round(lat * 10000) / 10000
  const rlon = Math.round(lon * 10000) / 10000
  const hh = Math.floor(acq_time / 100)
  const mm = acq_time % 100
  const minute = `${acq_date}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00Z`
  return `${fuente}|${instrument}|${satellite}|${minute}|${rlat}|${rlon}`
}

async function fetchCSV(url: string) {
  const res = await fetch(url)
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`FIRMS fetch failed (${res.status}): ${t.slice(0, 200)}`)
  }

  const text = await res.text()
  const [header, ...rows] = text.trim().split(/\r?\n/)

  // 🔧 Normaliza encabezados: lowercase, trim, y remueve BOM
  const cols = header
    .split(',')
    .map(c => c.replace(/^\ufeff/, '').trim().toLowerCase())

  return rows.map(r => {
    const v = r.split(',')
    const o: Record<string, string> = {}
    for (let i = 0; i < cols.length; i++) {
      // 🔧 Trim por si vienen espacios
      o[cols[i]] = (v[i] ?? '').trim()
    }
    return o as Row
  })
}


async function fetchAllFirms(): Promise<Row[]> {
  const urls = buildFirmsUrls()
  console.log('🌍 [FIRMS] URLs generadas:', urls)
  const batches = await Promise.all(urls.map(async u => {
    try {
      const csv = await fetchCSV(u)
      console.log(`📦 [FIRMS] ${csv.length} filas desde ${u.slice(0,80)}...`)
      return csv
    } catch (err: any) {
      console.error(`❌ [FIRMS] Error al descargar ${u.slice(0,80)}...`, err.message)
      return []
    }
  }))
  return batches.flat()
}




function normalize(items: Row[]) {
  return items
    .map(it => {
      // todas las keys llegan lowercase desde fetchCSV
      const lat = parseFloat(it.latitude ?? it.lat)
      const lon = parseFloat(it.longitude ?? it.lon)

      const acq_date = String(it.acq_date ?? it.date ?? '').slice(0, 10)
      // acq_time puede venir como "0454"; Number("0454") => 454 OK
      const acq_time = Number(it.acq_time ?? it.time ?? 0)

      const fuente = String(it.source ?? 'FIRMS')
      const instrument = String(
        it.instrument ?? it.sensor ?? (String(it.product ?? '').includes('modis') ? 'MODIS' : 'VIIRS')
      )
      const satellite = String(it.satellite ?? it.sat ?? (it.product ?? ''))

      const daynight = it.daynight ? String(it.daynight) : null
      const brightness = it.brightness ?? it.brightness_viirs ?? null
      const frp = it.frp ?? null
      const confidence = it.confidence ?? null

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
      }
    })
    .filter(
      x =>
        x.acq_date?.length === 10 &&
        Number.isFinite(x.acq_time) &&
        Number.isFinite(x.lat) &&
        Number.isFinite(x.lon)
    )
}


async function upsertPuntos(norm: ReturnType<typeof normalize>) {
  if (!norm.length) return { insertados: 0, ignorados: 0, ids: [] as string[] }

  const repo = AppDataSource.getRepository(PuntoCalor)
  const vals = norm.map(n => {
    const geom = () => `SRID=4326;POINT(${n.lon} ${n.lat})`
    const hash = hashDedupe(n.fuente, n.instrument, n.satellite, n.acq_date, n.acq_time, n.lat, n.lon)
    return {
      fuente: n.fuente,
      instrument: n.instrument,
      satellite: n.satellite,
      version: null,
      acq_date: n.acq_date,
      acq_time: n.acq_time,
      daynight: n.daynight,
      confidence: n.confidence,
      frp: n.frp,
      brightness: n.brightness,
      bright_ti4: null,
      bright_ti5: null,
      scan: null,
      track: null,
      geom: () => geom(),
      region: null,
      hash_dedupe: hash
    }
  })

  const batch = Number.isFinite(env.FIRMS_BATCH_SIZE) ? env.FIRMS_BATCH_SIZE : 2000
  let inserted = 0
  let ignored = 0
  const ids: string[] = []

  for (let i = 0; i < vals.length; i += batch) {
    const slice = vals.slice(i, i + batch)
    const r = await repo
      .createQueryBuilder()
      .insert()
      .values(slice)
      .orIgnore(true)
      .returning(['punto_calor_uuid', 'hash_dedupe'])
      .execute()

    const ret = r.raw as Array<{ punto_calor_uuid: string; hash_dedupe: string }>
    inserted += ret.length
    ignored += slice.length - ret.length
    ids.push(...ret.map(x => x.punto_calor_uuid))

    if (ret.length < slice.length) {
      const miss = slice
        .filter(s => !ret.find(x => x.hash_dedupe === s.hash_dedupe))
        .map(m => m.hash_dedupe!)
      if (miss.length) {
        const exist = await repo
          .createQueryBuilder('p')
          .select(['p.punto_calor_uuid', 'p.hash_dedupe'])
          .where('p.hash_dedupe IN (:...h)', { h: miss })
          .getMany()
        ids.push(...exist.map(e => e.punto_calor_uuid))
      }
    }
  }

  return { insertados: inserted, ignorados: ignored, ids }
}

async function associateToIncendios(puntoIds: string[]) {
  if (!puntoIds.length) return { asociados: 0, porIncendio: {} as Record<string, number> }

  const radiusKm = RADIUS_KM
  const deltaH   = WINDOW_H
  const rMeters = radiusKm * 1000

  const raw = await AppDataSource.query(
    `
    with pts as (
      select p.punto_calor_uuid, p.acq_date, p.acq_time, p.geom
      from puntos_calor p
      where p.punto_calor_uuid = ANY($1)
    ),
    pts_dt as (
      select punto_calor_uuid,
             to_timestamp(acq_date || ' ' || lpad((acq_time/100)::int::text,2,'0') || ':' || lpad((acq_time%100)::int::text,2,'0'),'YYYY-MM-DD HH24:MI') at time zone 'UTC' as acq_dt,
             geom
      from pts
    ),
    cand as (
      select i.incendio_uuid, i.creado_en, coalesce(i.centroide, i.geom) as igeom
      from incendios i
      where i.eliminado_en is null and i.estado in ('pendiente','activo')
    ),
    pairs as (
      select
        p.punto_calor_uuid,
        c.incendio_uuid,
        ST_DistanceSphere(p.geom, c.igeom) as dist,
        EXTRACT(EPOCH FROM (p.acq_dt - c.creado_en))/60 as delta_min
      from pts_dt p
      join cand c on ST_DWithin(p.geom::geography, c.igeom::geography, $2)
      where abs(EXTRACT(EPOCH FROM (p.acq_dt - c.creado_en))) <= $3*3600
    ),
    pick as (
      select distinct on (punto_calor_uuid)
        punto_calor_uuid, incendio_uuid, dist, delta_min
      from pairs
      order by punto_calor_uuid, dist asc
    )
    select * from pick
    `,
    [puntoIds, rMeters, deltaH]
  )

  let asociados = 0
  const porIncendio: Record<string, number> = {}
  const repo = AppDataSource.getRepository(PuntoCalor)

  for (const row of raw) {
    const pcId = row.punto_calor_uuid
    const incId = row.incendio_uuid
    const existing = await repo.findOne({ where: { punto_calor_uuid: pcId }, relations: ['incendio'] })
    if (existing && !existing.incendio) {
      await repo.update({ punto_calor_uuid: pcId }, { incendio: { incendio_uuid: incId } as any })
      asociados += 1
      porIncendio[incId] = (porIncendio[incId] || 0) + 1
    }
  }

  return { asociados, porIncendio, regla: `R=${radiusKm}km,Δt=±${deltaH}h` }
}

export async function runFirmsIngest() {
  const jobRepo = AppDataSource.getRepository(JobRun)
  const auditRepo = AppDataSource.getRepository(AuditoriaEventos)
  const job = jobRepo.create({ nombre_job: 'firms:ingest', inicio: new Date(), status: 'RUNNING' })
  await jobRepo.save(job)

  try {
    console.log('🚀 [FIRMS] Iniciando ingesta manual...')
    const items = await fetchAllFirms()
    console.log(`📊 [FIRMS] Total filas brutas: ${items.length}`)

    const norm = normalize(items)
    console.log(`📊 [FIRMS] Normalizadas: ${norm.length}`)

    const up = await upsertPuntos(norm)
    console.log(`💾 [FIRMS] Insertados: ${up.insertados}, Ignorados: ${up.ignorados}`)

    const asoc = await associateToIncendios(up.ids)
    console.log(`🔗 [FIRMS] Asociados: ${asoc.asociados}`)

    job.insertados = up.insertados
    job.ignorados = up.ignorados
    job.asociados = asoc.asociados
    job.status = 'OK'
    job.fin = new Date()
    await jobRepo.save(job)

    return { ok: true, insertados: up.insertados, ignorados: up.ignorados, asociados: asoc.asociados }
  } catch (e: any) {
    console.error('❌ [FIRMS] Error general:', e)
    job.status = 'ERROR'
    job.fin = new Date()
    job.errores = { message: e?.message || String(e) }
    await jobRepo.save(job)
    throw e
  }
}
