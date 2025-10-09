import { Router } from 'express'
import { AppDataSource } from '../../db/data-source'
import { Incendio } from './entities/incendio.entity'
import { guardAuth, guardAdmin } from '../../middlewares/auth'
import { activeFind, softRemoveById } from '../../utils/repo'

const router = Router()

router.get('/', async (_req, res) => {
  const repo = AppDataSource.getRepository(Incendio)
  const items = await activeFind(repo, { order: { creado_en: 'DESC' } })
  res.json({ total: items.length, page: 1, pageSize: items.length, items })
})

router.delete('/:uuid', guardAuth, guardAdmin, async (req, res) => {
  const repo = AppDataSource.getRepository(Incendio)
  const ok = await softRemoveById(repo, 'incendio_uuid', req.params.uuid)
  if (!ok) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No existe' }, requestId: res.locals.ctx?.requestId })
  res.status(204).end()
})

export default router
