import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import pino from 'pino'
import pinoHttp from 'pino-http'
import rateLimit from 'express-rate-limit'
import env from './config/env'
import healthRoutes from './app/health.routes'
import { notFound, onError } from './app/error'

// Middlewares personalizados
import { contextMiddleware } from './middlewares/context'
import { authMiddleware } from './middlewares/auth'

// Módulos (solo los que ya tienes)
import incendiosRoutes from './modules/incendios/incendios.routes'
import reportesRoutes from './modules/incendios/reportes.routes'
import authRoutes from './modules/auth/auth.routes'
import usuariosRoutes from './modules/seguridad/usuarios.routes'

const logger = pino({ level: env.LOG_LEVEL })
const app = express()

app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true)
    if (env.CORS_ALLOWED_ORIGINS_LIST.includes(origin)) return cb(null, true)
    const e: any = new Error('CORS blocked')
    e.status = 403
    e.code = 'CORS_BLOCKED'
    return cb(e)
  },
  credentials: true,
}))
app.use(pinoHttp({ logger }))
app.use(express.json({ limit: `${env.PAYLOAD_LIMIT_MB}mb` }))
app.use(rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
}))

// ⚠️ NO inicializar la BD aquí; se hace en src/server.ts


// ---------- Rutas ----------
app.use(healthRoutes)
app.use('/auth', authRoutes)
app.use('/usuarios', usuariosRoutes)

// Contexto antes de auth para garantizar res.locals.ctx
app.use(contextMiddleware)

// Ruta de prueba del middleware de autenticación
app.get('/test-auth', authMiddleware, (_req, res) => {
  res.json({ ok: true, user: res.locals.ctx?.user || null })
})

// Módulos activos
app.use('/incendios', incendiosRoutes)
app.use('/reportes', reportesRoutes)

// ---------- Manejo de errores ----------
app.use(notFound)
app.use(onError)

export default app
