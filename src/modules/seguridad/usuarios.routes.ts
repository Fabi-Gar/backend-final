import { Router } from 'express'
import { guardAuth } from '../../middlewares/auth'

const router = Router()

router.get('/me', guardAuth, (req, res) => {
  res.json(res.locals.ctx.user)
})

export default router
