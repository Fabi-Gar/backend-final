// src/modules/auth/auth.routes.ts
import { Router } from 'express'
import { z } from 'zod'
import { AppDataSource } from '../../db/data-source'
import { Usuario } from '../seguridad/entities/usuario.entity'
import { IsNull } from 'typeorm'
import { verifyPassword } from '../../utils/password'
import { signAccessToken } from '../../utils/jwt'  // ✅ función para firmar tokens JWT

const router = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body)

    const emailN = email.trim().toLowerCase()
    const repo = AppDataSource.getRepository(Usuario)

    // Selecciona el usuario
    const user = await repo.findOne({
      where: { email: emailN, eliminado_en: IsNull() },
      relations: ['rol', 'institucion']
    })

    const invalid = () =>
      res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Email o password inválidos' },
        requestId: res.locals.ctx?.requestId
      })

    if (!user) {
      await sleep(250)
      return invalid()
    }

    const ok = await verifyPassword(password, (user as any).password_hash)
    if (!ok) {
      await sleep(250)
      return invalid()
    }

    // 🔐 Construir el payload del JWT
    const fullName = `${(user as any).nombre ?? ''} ${(user as any).apellido ?? ''}`.trim()
    const payload = {
      sub: user.usuario_uuid,
      email: user.email || undefined,
      is_admin: !!(user as any).is_admin,
      rol_uuid: (user as any)?.rol?.rol_uuid || undefined,
      institucion_uuid: (user as any)?.institucion?.institucion_uuid || undefined,
      name: fullName || undefined,
    }

    // ✨ Firmar JWT
    const access_token = signAccessToken(payload)

    // Actualizar último login
    await repo.update(
      { usuario_uuid: user.usuario_uuid },
      { ultimo_login: new Date() }
    )

    // Respuesta final
    res.json({
      token: access_token,
      user: {
        usuario_uuid: user.usuario_uuid,
        email: user.email,
        nombre: (user as any).nombre,
        apellido: (user as any).apellido,
        is_admin: (user as any).is_admin,
        rol_uuid: (user as any)?.rol?.rol_uuid ?? null,
        institucion_uuid: (user as any)?.institucion?.institucion_uuid ?? null,
      }
    })
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

export default router
