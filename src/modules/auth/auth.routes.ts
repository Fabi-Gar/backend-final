import { Router } from 'express'
import { z } from 'zod'
import { AppDataSource } from '../../db/data-source'
import { Usuario } from '../seguridad/entities/usuario.entity'
import { IsNull } from 'typeorm'
import { verifyPassword } from '../../utils/password'

const router = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body)

    const repo = AppDataSource.getRepository(Usuario)
    const user = await repo.findOne({ where: { email, eliminado_en: IsNull() } })

    if (!user) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Email o password inválidos' }, requestId: res.locals.ctx?.requestId })
    }

    const ok = await verifyPassword(password, (user as any).password_hash)
    if (!ok) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Email o password inválidos' }, requestId: res.locals.ctx?.requestId })
    }

    // Token MVP = usuario_uuid (tu authMiddleware ya lo soporta como Bearer)
    const token = user.usuario_uuid

    await AppDataSource.getRepository(Usuario).update(
    { usuario_uuid: user.usuario_uuid },
    { ultimo_login: new Date() }
    )

    res.json({
      token,
      user: {
        usuario_uuid: user.usuario_uuid,
        email: user.email,
        nombre: (user as any).nombre,
        apellido: (user as any).apellido,
        is_admin: (user as any).is_admin,
      }
    })
  } catch (err: any) {
    if (err?.issues) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Validación', issues: err.issues }, requestId: res.locals.ctx?.requestId })
    next(err)
  }
})

export default router
