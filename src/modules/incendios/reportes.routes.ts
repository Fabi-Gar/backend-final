import { Router } from 'express'
import { z } from 'zod'
import { point4326 } from '../../utils/validators'
import { guardAuth } from '../../middlewares/auth'
import { assertCanReport } from '../incendios/incendios.permissions'
import { crearReporte } from './reportes.service'

const router = Router()

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
  reportado_por_nombre: z.string().min(1)
})

router.post('/', guardAuth, async (req, res, next) => {
  try {
    const parsed = reporteSchema.parse(req.body)
    if (parsed.incendio_uuid) await assertCanReport(res.locals.ctx.user, parsed.incendio_uuid)
    const saved = await crearReporte(parsed, res.locals.ctx)
    res.status(201).json(saved)
  } catch (err: any) {
    if (err?.issues) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Validación', issues: err.issues }, requestId: res.locals.ctx?.requestId })
    next(err)
  }
})

export default router
