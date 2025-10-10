// src/modules/incendios/incendios.routes.ts
import { Router } from 'express'
import { z } from 'zod'
import { AppDataSource } from '../../db/data-source'
import { Incendio } from './entities/incendio.entity'
import { Usuario } from '../seguridad/entities/usuario.entity'
import { FindOptionsWhere, ILike, IsNull, Between } from 'typeorm'
import { guardAuth, guardAdmin } from '../../middlewares/auth'
import { auditRecord } from '../auditoria/auditoria.service'
import { EstadoIncendio } from '../catalogos/entities/estado-incendio.entity'
import { IncendioEstadoHistorial } from './entities/incendio-estado-historial.entity'

const router = Router()

// --- helpers ---
const point4326 = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)])
})

// helper para default:
async function getDefaultEstadoUuid() {
  const repo = AppDataSource.getRepository(EstadoIncendio)
  // 1) intenta por codigo 'REPORTADO'
  const byCode = await repo.createQueryBuilder('e')
    .where('e.eliminado_en IS NULL AND e.codigo = :c', { c: 'REPORTADO' })
    .getOne()
  if (byCode) return (byCode as any).estado_incendio_uuid

  // 2) cae al de menor orden
  const byOrden = await repo.createQueryBuilder('e')
    .where('e.eliminado_en IS NULL')
    .orderBy('e.orden', 'ASC')
    .getOne()
  if (byOrden) return (byOrden as any).estado_incendio_uuid

  return null
}

const createIncendioSchema = z.object({
  titulo: z.string().min(1),
  descripcion: z.string().nullish(),
  centroide: point4326.nullish(),
  estado_incendio_uuid: z.string().uuid().optional(), // server pone default si no viene
})

// ⚠️ Importante: NO permitir null; si permites null aquí, romperás el NOT NULL en DB.
const updateIncendioSchema = z.object({
  titulo: z.string().min(1).optional(),
  descripcion: z.string().optional(),
  centroide: point4326.nullish().optional(),
  estado_incendio_uuid: z.string().uuid().optional(), // <-- sin nullish
})

// -------------------- LISTAR --------------------
router.get('/', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim()
    const desde = req.query.desde ? new Date(String(req.query.desde)) : undefined
    const hasta = req.query.hasta ? new Date(String(req.query.hasta)) : undefined

    const page = Math.max(parseInt(String(req.query.page || '1'), 10) || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(String(req.query.pageSize || '20'), 10) || 20, 1), 100)

    const where: FindOptionsWhere<Incendio> = { eliminado_en: IsNull(), aprobado: true }
    if (q) (where as any).titulo = ILike(`%${q}%`)
    if (desde && hasta) (where as any).creado_en = Between(desde, hasta)

    const repo = AppDataSource.getRepository(Incendio)
    const [items, total] = await repo.findAndCount({
      where,
      order: { creado_en: 'DESC' },
      take: pageSize,
      skip: (page - 1) * pageSize
    })

    res.json({ total, page, pageSize, items })
  } catch (err) { next(err) }
})

// -------------------- DETALLE --------------------
router.get('/:uuid', async (req, res, next) => {
  try {
    const { uuid } = z.object({ uuid: z.string().uuid() }).parse(req.params)
    const repo = AppDataSource.getRepository(Incendio)
    const item = await repo.findOne({
      where: { incendio_uuid: uuid, eliminado_en: IsNull() },
      relations: { creado_por: true }
    })
    const u = res.locals?.ctx?.user
    const puedeVer = item && (item.aprobado || (u?.is_admin || u?.usuario_uuid === (item as any).creado_por_uuid))
    if (!item || !puedeVer) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Incendio no disponible' }, requestId: res.locals.ctx?.requestId })
    }
    res.json(item)
  } catch (err) { next(err) }
})

// -------------------- CREAR --------------------
router.post('/', guardAuth, async (req, res, next) => {
  try {
    const body = createIncendioSchema.parse(req.body)
    const user = res.locals.ctx.user as Usuario
    const repo = AppDataSource.getRepository(Incendio)

    const estadoUuid =
      body.estado_incendio_uuid ??
      (await getDefaultEstadoUuid())

    if (!estadoUuid) {
      return res.status(500).json({
        error: { code: 'DEFAULT_STATE_MISSING', message: 'No existe estado por defecto en catálogo' },
        requestId: res.locals.ctx?.requestId
      })
    }

    const ent = repo.create({
      titulo: body.titulo,
      descripcion: body.descripcion ?? null,
      centroide: body.centroide ?? null,
      requiere_aprobacion: true,
      aprobado: false,
      creado_por: { usuario_uuid: user.usuario_uuid } as any,
      estado_incendio: { estado_incendio_uuid: estadoUuid } as any, // nunca null
    } as Partial<Incendio>) as Incendio

    const saved = await repo.save(ent)

    // historial inicial
    await AppDataSource.getRepository(IncendioEstadoHistorial).save({
      incendio: { incendio_uuid: saved.incendio_uuid } as any,
      estado_incendio: { estado_incendio_uuid: estadoUuid } as any,
      cambiado_por: { usuario_uuid: user.usuario_uuid } as any,
      observacion: 'Estado inicial',
    })

    await auditRecord({
      tabla: 'incendios',
      registro_uuid: saved.incendio_uuid,
      accion: 'INSERT',
      despues: saved,
      ctx: res.locals.ctx
    })

    res.status(201).json(saved)
  } catch (err: any) {
    if (err?.issues) {
      return res.status(400).json({
        error: { code: 'BAD_REQUEST', message: 'Validación', issues: err.issues },
        requestId: res.locals.ctx?.requestId
      })
    }
    next(err)
  }
})

// -------------------- ACTUALIZAR --------------------
router.patch('/:uuid', guardAuth, async (req, res, next) => {
  try {
    const { uuid } = z.object({ uuid: z.string().uuid() }).parse(req.params)
    const body = updateIncendioSchema.parse(req.body)
    const user = res.locals.ctx.user as Usuario

    const repo = AppDataSource.getRepository(Incendio)

    // obtén el estado previo directamente de la tabla (columna FK)
    const prevRow = await AppDataSource.query(
      `SELECT estado_incendio_uuid FROM incendios WHERE incendio_uuid = $1 AND eliminado_en IS NULL`,
      [uuid],
    )
    if (!prevRow.length) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Incendio no existe' }, requestId: res.locals.ctx?.requestId })
    }
    const prevEstadoUuid: string = prevRow[0].estado_incendio_uuid

    const inc = await repo.findOne({ where: { incendio_uuid: uuid, eliminado_en: IsNull() } })
    if (!inc) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Incendio no existe' }, requestId: res.locals.ctx?.requestId })
    }

    const esCreador = (inc as any).creado_por_uuid === user.usuario_uuid
    if (!user.is_admin && !esCreador) {
      return res.status(403).json({ error: { code: 'PERMISSION_DENIED' }, requestId: res.locals.ctx?.requestId })
    }

    const before = { titulo: inc.titulo, descripcion: inc.descripcion, centroide: (inc as any).centroide }

    if (typeof body.titulo === 'string') inc.titulo = body.titulo
    if (typeof body.descripcion === 'string') (inc as any).descripcion = body.descripcion
    if (typeof body.centroide !== 'undefined') (inc as any).centroide = body.centroide ?? null

    // si viene estado_incendio_uuid, lo seteamos (NO permitir null aquí)
    let nuevoEstadoUuid: string | null = null
    if (typeof body.estado_incendio_uuid !== 'undefined') {
      nuevoEstadoUuid = body.estado_incendio_uuid
      ;(inc as any).estado_incendio = { estado_incendio_uuid: body.estado_incendio_uuid } as any
    }

    const saved = await repo.save(inc)

    // si cambió el estado, guarda historial
    if (nuevoEstadoUuid && nuevoEstadoUuid !== prevEstadoUuid) {
      await AppDataSource.getRepository(IncendioEstadoHistorial).save({
        incendio: { incendio_uuid: saved.incendio_uuid } as any,
        estado_incendio: { estado_incendio_uuid: nuevoEstadoUuid } as any,
        cambiado_por: { usuario_uuid: user.usuario_uuid } as any,
        observacion: 'Cambio de estado por edición',
      })
    }

    await auditRecord({
      tabla: 'incendios',
      registro_uuid: saved.incendio_uuid,
      accion: 'UPDATE',
      antes: before,
      despues: {
        titulo: saved.titulo,
        descripcion: (saved as any).descripcion,
        centroide: (saved as any).centroide,
        estado_incendio_uuid: nuevoEstadoUuid ?? prevEstadoUuid,
      },
      ctx: res.locals.ctx
    })

    res.json(saved)
  } catch (err: any) {
    if (err?.issues) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Validación', issues: err.issues }, requestId: res.locals.ctx?.requestId })
    next(err)
  }
})

// -------------------- APROBAR --------------------
router.patch('/:uuid/aprobar', guardAuth, guardAdmin, async (req, res, next) => {
  try {
    const { uuid } = z.object({ uuid: z.string().uuid() }).parse(req.params)
    const repo = AppDataSource.getRepository(Incendio)
    const inc = await repo.findOne({ where: { incendio_uuid: uuid, eliminado_en: IsNull() } })
    if (!inc) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Incendio no existe' }, requestId: res.locals.ctx?.requestId })

    const before = { aprobado: inc.aprobado, requiere_aprobacion: inc.requiere_aprobacion }
    inc.aprobado = true
    inc.requiere_aprobacion = false
    inc.aprobado_en = new Date()
    ;(inc as any).aprobado_por = { usuario_uuid: (res.locals.ctx.user as Usuario).usuario_uuid } as any
    ;(inc as any).rechazado_en = null
    ;(inc as any).rechazado_por = null
    ;(inc as any).motivo_rechazo = null

    const saved = await repo.save(inc)
    await auditRecord({
      tabla: 'incendios',
      registro_uuid: saved.incendio_uuid,
      accion: 'UPDATE',
      antes: before,
      despues: { aprobado: saved.aprobado, requiere_aprobacion: saved.requiere_aprobacion, aprobado_en: saved.aprobado_en, aprobado_por: (saved as any).aprobado_por },
      ctx: res.locals.ctx
    })

    res.json(saved)
  } catch (err) { next(err) }
})

// -------------------- RECHAZAR --------------------
router.patch('/:uuid/rechazar', guardAuth, guardAdmin, async (req, res, next) => {
  try {
    const { uuid } = z.object({ uuid: z.string().uuid() }).parse(req.params)
    const { motivo_rechazo } = z.object({ motivo_rechazo: z.string().min(1) }).parse(req.body)

    const repo = AppDataSource.getRepository(Incendio)
    const inc = await repo.findOne({ where: { incendio_uuid: uuid, eliminado_en: IsNull() } })
    if (!inc) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Incendio no existe' }, requestId: res.locals.ctx?.requestId })

    const before = { aprobado: inc.aprobado, requiere_aprobacion: inc.requiere_aprobacion }
    inc.aprobado = false
    inc.requiere_aprobacion = false
    inc.rechazado_en = new Date()
    ;(inc as any).rechazado_por = { usuario_uuid: (res.locals.ctx.user as Usuario).usuario_uuid } as any
    ;(inc as any).motivo_rechazo = motivo_rechazo

    const saved = await repo.save(inc)
    await auditRecord({
      tabla: 'incendios',
      registro_uuid: saved.incendio_uuid,
      accion: 'UPDATE',
      antes: before,
      despues: { aprobado: saved.aprobado, requiere_aprobacion: saved.requiere_aprobacion, rechazado_en: saved.rechazado_en, rechazado_por: (saved as any).rechazado_por, motivo_rechazo: (saved as any).motivo_rechazo },
      ctx: res.locals.ctx
    })

    res.json(saved)
  } catch (err: any) {
    if (err?.issues) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Validación', issues: err.issues }, requestId: res.locals.ctx?.requestId })
    next(err)
  }
})

export default router
