// src/modules/geoespacial/puntos-calor.routes.ts
import { Router } from 'express'
import { AppDataSource } from '../../db/data-source'
import { z } from 'zod'
// si usas guards: import { guardAuth } from '../../middlewares/auth'

const router = Router()

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  incendio_uuid: z.string().uuid().optional(),
  min_confidence: z.coerce.number().min(0).max(100).optional(),
  hours: z.coerce.number().min(1).max(168).optional(),           // ej. últimas N horas
})

router.get('/', /*guardAuth,*/ async (req, res, next) => {
  try {
    const q = querySchema.parse(req.query)
    const where: string[] = ['eliminado_en IS NULL']
    const values: any[] = []
    let i = 1

    if (q.incendio_uuid) { where.push(`incendio_uuid = $${i++}`); values.push(q.incendio_uuid) }
    if (typeof q.min_confidence === 'number') { where.push(`confianza >= $${i++}`); values.push(q.min_confidence) }
    if (q.hours) { where.push(`fecha_evento >= now() - ($${i++} || ' hours')::interval`); values.push(q.hours) }

    const countSql = `SELECT COUNT(*)::int AS total FROM puntos_calor WHERE ${where.join(' AND ')}`
    const total = (await AppDataSource.query(countSql, values))?.[0]?.total ?? 0

    const selectSql = `
      SELECT punto_calor_uuid AS id,
             satelite, confianza, fecha_evento,
             ST_Y(geom) AS lat, ST_X(geom) AS lon,
             incendio_uuid, creado_en, actualizado_en
      FROM puntos_calor
      WHERE ${where.join(' AND ')}
      ORDER BY fecha_evento DESC
      LIMIT $${i} OFFSET $${i+1}
    `
    const items = await AppDataSource.query(selectSql, [...values, q.pageSize, (q.page - 1) * q.pageSize])

    res.json({ total, page: q.page, pageSize: q.pageSize, items })
  } catch (e) { next(e) }
})

export default router
