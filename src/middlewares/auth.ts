// src/middlewares/auth.ts
import { Request, Response, NextFunction } from 'express'
import { AppDataSource } from '../db/data-source'
import { Usuario } from '../modules/seguridad/entities/usuario.entity'
import { IsNull } from 'typeorm'
import { randomUUID } from 'crypto'

function isUuid(v: string) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(v)
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Asegura que res.locals.ctx exista
  if (!res.locals.ctx) {
    res.locals.ctx = {
      requestId: (req as any).id || randomUUID(),
      ip: req.ip,
      ua: req.headers['user-agent'] || '',
      user: null,
    }
  }

  const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim()
  const headerUserId = (req.headers['x-user-id'] as string | undefined)?.trim()
  const candidate = bearer || headerUserId || ''
  let user: Usuario | null = null

  // --- TEMPORAL: modo desarrollo (para pruebas en Postman sin login) ---
  if (process.env.NODE_ENV !== 'production' && !candidate) {
    res.locals.ctx.user = { usuario_uuid: 'demo-user', is_admin: true } as any
    return next()
  }

  if (isUuid(candidate)) {
    const repo = AppDataSource.getRepository(Usuario)
    user = await repo.findOne({
      where: { usuario_uuid: candidate, eliminado_en: IsNull() },
    })
  }

  res.locals.ctx.user = user
  next()
}

export function guardAuth(_req: Request, res: Response, next: NextFunction) {
  if (!res.locals.ctx?.user)
    return res.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'Auth requerido' },
      requestId: res.locals.ctx?.requestId,
    })
  next()
}

export function guardAdmin(_req: Request, res: Response, next: NextFunction) {
  const u = res.locals.ctx?.user as Usuario | null
  if (!u?.is_admin)
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Solo admin' },
      requestId: res.locals.ctx?.requestId,
    })
  next()
}
