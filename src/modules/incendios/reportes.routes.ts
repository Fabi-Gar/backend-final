// src/modules/incendios/reportes.routes.ts
import { Router } from 'express'
import { z } from 'zod'
import { AppDataSource } from '../../db/data-source'
import { guardAuth } from '../../middlewares/auth'
import { point4326 } from '../../utils/validators'
import { assertCanReport } from '../incendios/incendios.permissions'
import { Reporte } from './entities/reporte.entity'
import { FotoReporte } from './entities/foto-reporte.entity'
import { IsNull } from 'typeorm'

const router = Router()

// -------- Schemas --------
const reporteSchema = z.object({
  incendio_uuid: z.string().uuid().optional(),
  institucion_uuid: z.string().uuid().nullable().optional(),
  medio_uuid: z.string().uuid(),
  ubicacion: point4326,
  reportado_en: z.coerce.date(),
  observaciones: z.string().nullish(),
  telefono: z.string().nullish(),
  departamento_uuid: z.string().uuid().nullish(),
  municipio_uuid: z.string().uuid().nullish(),
  lugar_poblado: z.string().nullish(),
  finca: z.string().nullish(),
  reportado_por_nombre: z.string().min(1),
})

const fotoSchema = z.object({
  url: z.string().url(),
  credito: z.string().nullish()
})

// -------- Helpers --------
function pageParams(q: any) {
  const page = Math.max(parseInt(String(q.page || '1'), 10) || 1, 1)
  const pageSize = Math.min(Math.max(parseInt(String(q.pageSize || '20'), 10) || 20, 1), 100)
  return { page, pageSize, take: pageSize, skip: (page - 1) * pageSize }
}

// -------- Rutas --------

// Crear reporte
// POST /reportes
router.post('/', guardAuth, async (req, res, next) => {
  try {
    const parsed = reporteSchema.parse(req.body)

    if (parsed.incendio_uuid) {
      await assertCanReport(res.locals.ctx.user, parsed.incendio_uuid)
    }

    const repo = AppDataSource.getRepository(Reporte)
    const r = repo.create({
      incendio: parsed.incendio_uuid ? ({ incendio_uuid: parsed.incendio_uuid } as any) : undefined,
      institucion: parsed.institucion_uuid ? ({ institucion_uuid: parsed.institucion_uuid } as any) : undefined,
      medio: { medio_uuid: parsed.medio_uuid } as any,
      ubicacion: parsed.ubicacion as any,
      reportado_en: parsed.reportado_en,
      observaciones: parsed.observaciones ?? null,
      telefono: parsed.telefono ?? null,
      lugar_poblado: parsed.lugar_poblado ?? null,
      finca: parsed.finca ?? null,
      reportado_por_nombre: parsed.reportado_por_nombre,
      departamento: parsed.departamento_uuid ? ({ departamento_uuid: parsed.departamento_uuid } as any) : undefined,
      municipio: parsed.municipio_uuid ? ({ municipio_uuid: parsed.municipio_uuid } as any) : undefined,
      reportado_por: { usuario_uuid: res.locals.ctx.user.usuario_uuid } as any
    } as any)

    await repo.save(r)
    res.status(201).json(r)
  } catch (err: any) {
    if (err?.issues) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Validación', issues: err.issues }, requestId: res.locals.ctx?.requestId })
    next(err)
  }
})

// Listar reportes (opcionalmente por incendio)
// GET /reportes?incendio_uuid=&page=&pageSize=
router.get('/', guardAuth, async (req, res, next) => {
  try {
    const { page, pageSize, take, skip } = pageParams(req.query)
    const incendio_uuid = req.query?.incendio_uuid ? String(req.query.incendio_uuid) : undefined

    const repo = AppDataSource.getRepository(Reporte)
    const [items, total] = await repo.findAndCount({
      where: incendio_uuid
        ? { eliminado_en: IsNull(), incendio: { incendio_uuid } }
        : { eliminado_en: IsNull() },
      relations: ['reportado_por', 'incendio', 'medio', 'institucion', 'departamento', 'municipio'],
      order: { reportado_en: 'DESC', creado_en: 'DESC' },
      take, skip
    })
    res.json({ total, page, pageSize, items })
  } catch (e) { next(e) }
})

// Mis reportes
// GET /reportes/mios?page=&pageSize=
router.get('/mios', guardAuth, async (req, res, next) => {
  try {
    const { page, pageSize, take, skip } = pageParams(req.query)
    const repo = AppDataSource.getRepository(Reporte)
    const [items, total] = await repo.findAndCount({
      where: {
        eliminado_en: IsNull(),
        reportado_por: { usuario_uuid: res.locals.ctx.user.usuario_uuid }
      },
      relations: ['medio', 'incendio', 'institucion', 'departamento', 'municipio'],
      order: { reportado_en: 'DESC', creado_en: 'DESC' },
      take, skip
    })
    res.json({ total, page, pageSize, items })
  } catch (e) { next(e) }
})

// Detalle de un reporte
// GET /reportes/:reporte_uuid
router.get('/:reporte_uuid', guardAuth, async (req, res, next) => {
  try {
    const repo = AppDataSource.getRepository(Reporte)
    const item = await repo.findOne({
      where: { reporte_uuid: req.params.reporte_uuid, eliminado_en: IsNull() },
      relations: ['reportado_por', 'incendio', 'medio', 'institucion', 'departamento', 'municipio']
    })
    if (!item) return res.status(404).json({ code: 'NOT_FOUND' })
    res.json(item)
  } catch (e) { next(e) }
})

// Subir foto a un reporte
// POST /reportes/:reporte_uuid/fotos
router.post('/:reporte_uuid/fotos', guardAuth, async (req, res, next) => {
  try {
    const { url, credito } = fotoSchema.parse(req.body)

    // existe el reporte?
    const repRepo = AppDataSource.getRepository(Reporte)
    const rep = await repRepo.findOne({ where: { reporte_uuid: req.params.reporte_uuid, eliminado_en: IsNull() } })
    if (!rep) return res.status(404).json({ code: 'NOT_FOUND', message: 'Reporte no encontrado' })

    const repo = AppDataSource.getRepository(FotoReporte)
    const f = repo.create({ url, credito: credito ?? null, reporte: { reporte_uuid: req.params.reporte_uuid } as any })
    await repo.save(f)
    res.status(201).json(f)
  } catch (err: any) {
    if (err?.issues) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Validación', issues: err.issues }, requestId: res.locals.ctx?.requestId })
    next(err)
  }
})

export default router
