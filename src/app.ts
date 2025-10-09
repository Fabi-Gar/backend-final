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

// Módulos
import firmsRoutes from './modules/geoespacial/firms.routes'
import authRoutes from './modules/auth/auth.routes'
import usuariosRoutes from './modules/seguridad/usuarios.routes'
import incendiosRoutes from './modules/incendios/incendios.routes'
import reportesRoutes from './modules/incendios/reportes.routes'
import catalogosRoutes from './app/catalogos.routes'
import rolesRoutes from './modules/seguridad/roles.routes'
import institucionesRoutes from './modules/seguridad/instituciones.routes'
import estadosIncendioRoutes from './app/estados-incendio.routes'
import puntosCalorRoutes from './modules/geoespacial/puntos-calor.routes'
import monitorRoutes from './app/monitor.routes'

const logger = pino({ level: env.LOG_LEVEL })
const app = express()

// app.set('trust proxy', 1) // si usas proxy

// ---------------- Middlewares base ----------------
app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true)
      if (env.CORS_ALLOWED_ORIGINS_LIST.includes(origin)) return cb(null, true)
      const e: any = new Error('CORS blocked')
      e.status = 403
      e.code = 'CORS_BLOCKED'
      return cb(e)
    },
    credentials: true,
  })
)
app.use(pinoHttp({ logger }))
app.use(express.json({ limit: `${env.PAYLOAD_LIMIT_MB}mb` }))

app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  })
)

// ---------------- Inicialización del contexto ----------------
app.use(contextMiddleware)

// 🔐 Auth hydration
app.use(authMiddleware)

// ---------------- Rutas ----------------
app.use(healthRoutes)                         // /health/liveness, /health/readiness
app.use('/auth', authRoutes)                  // /auth/login
app.use('/usuarios', usuariosRoutes)          // /usuarios, /usuarios/me, etc.
app.use('/incendios', incendiosRoutes)        // /incendios/*
app.use('/reportes', reportesRoutes)          // /reportes/*
app.use('/catalogos', catalogosRoutes)        // /catalogos/*
app.use('/roles', rolesRoutes)                // /roles/*
app.use('/firms', firmsRoutes)            // /api/firms/run, /api/firms/puntos, etc.
app.use('/monitor', monitorRoutes)

app.use('/instituciones', institucionesRoutes)// /instituciones/*
app.use('/puntos-calor', puntosCalorRoutes)   // /puntos-calor/*
app.use(estadosIncendioRoutes)                // /estados_incendio, etc. (SIN prefijo)

// Ruta de prueba
app.get('/test-auth', (_req, res) => {
  res.json({ ok: true, user: res.locals.ctx?.user || null })
})

// ---------------- Manejo de errores ----------------
app.use(notFound)
app.use(onError)

export default app
