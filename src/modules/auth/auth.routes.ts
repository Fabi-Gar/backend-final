import { Router } from 'express'
import { z } from 'zod'
import { AppDataSource } from '../../db/data-source'
import { Usuario } from '../seguridad/entities/usuario.entity'
import { IsNull } from 'typeorm'
import { verifyPassword, hashPassword } from '../../utils/password'
import { signAccessToken } from '../../utils/jwt'

const router = Router()

// ===== Schemas =====
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const publicRegisterSchema = z.object({
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  telefono: z.string().optional().nullable(),
  email: z.string().email(),
  password: z.string().min(6),
  institucion_uuid: z.string().uuid().optional().nullable(),
})

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

/**
 * REGISTRO público - POST /auth/register
 * - No requiere token
 * - Asigna rol "USUARIO" del seed
 * - Devuelve { token, user }
 */
router.post('/register', async (req, res, next) => {
  try {
    const body = publicRegisterSchema.parse(req.body)
    const repo = AppDataSource.getRepository(Usuario)

    const emailN = body.email.trim().toLowerCase()

    // Unicidad de email
    const exists = await repo.findOne({ where: { email: emailN, eliminado_en: IsNull() } })
    if (exists) {
      return res.status(409).json({ error: { code: 'EMAIL_IN_USE', message: 'El email ya está registrado' } })
    }

    // Rol por defecto: USUARIO
    const row = await AppDataSource.manager.query(
      `SELECT rol_uuid FROM roles WHERE UPPER(nombre)=UPPER($1) LIMIT 1`,
      ['USUARIO']
    )
    const defaultRoleUuid: string | undefined = row?.[0]?.rol_uuid
    if (!defaultRoleUuid) {
      return res.status(500).json({
        error: { code: 'PUBLIC_ROLE_NOT_FOUND', message: 'No se encontró el rol "USUARIO". Verifica el seed.' },
      })
    }

    const password_hash = await hashPassword(body.password)

    const user = repo.create({
      nombre: body.nombre,
      apellido: body.apellido,
      telefono: body.telefono || null,
      email: emailN,
      password_hash,
      rol: { rol_uuid: defaultRoleUuid } as any,
      institucion: body.institucion_uuid ? ({ institucion_uuid: body.institucion_uuid } as any) : null,
      is_admin: false,
    })

    await repo.save(user)

    const token = signAccessToken({
      sub: user.usuario_uuid,
      is_admin: false,
      rol_uuid: defaultRoleUuid,
      institucion_uuid: (user as any)?.institucion?.institucion_uuid ?? null,
      email: user.email ?? undefined,
      nombre: `${user.nombre ?? ''} ${user.apellido ?? ''}`.trim() || undefined,
    })

    // Devuelve token + user safe
    const { password_hash: _ph, ...safe } = user as any
    res.status(201).json({ token, user: safe })
  } catch (err: any) {
    if (err?.issues) {
      return res.status(400).json({
        error: { code: 'BAD_REQUEST', message: 'Validación', issues: err.issues },
        requestId: res.locals.ctx?.requestId,
      })
    }
    next(err)
  }
})

/**
 * LOGIN - POST /auth/login
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body)

    const emailN = email.trim().toLowerCase()
    const repo = AppDataSource.getRepository(Usuario)

    const user = await repo.findOne({
      where: { email: emailN, eliminado_en: IsNull() },
      relations: ['rol', 'institucion'],
    })

    const invalid = () =>
      res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Email o password inválidos' },
        requestId: res.locals.ctx?.requestId,
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

    const fullName = `${(user as any).nombre ?? ''} ${(user as any).apellido ?? ''}`.trim()

    // OJO: signAccessToken espera 'nombre', no 'name'
    const token = signAccessToken({
      sub: user.usuario_uuid,
      email: user.email || undefined,
      is_admin: !!(user as any).is_admin,
      rol_uuid: (user as any)?.rol?.rol_uuid || undefined,
      institucion_uuid: (user as any)?.institucion?.institucion_uuid || undefined,
      nombre: fullName || undefined,
    })

    await repo.update({ usuario_uuid: user.usuario_uuid }, { ultimo_login: new Date() })

    res.json({
      token,
      user: {
        usuario_uuid: user.usuario_uuid,
        email: user.email,
        nombre: (user as any).nombre,
        apellido: (user as any).apellido,
        is_admin: (user as any).is_admin,
        rol_uuid: (user as any)?.rol?.rol_uuid ?? null,
        institucion_uuid: (user as any)?.institucion?.institucion_uuid ?? null,
      },
    })
  } catch (err: any) {
    if (err?.issues) {
      return res.status(400).json({
        error: { code: 'BAD_REQUEST', message: 'Validación', issues: err.issues },
        requestId: res.locals.ctx?.requestId,
      })
    }
    next(err)
  }
})

export default router
