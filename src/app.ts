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
import departamentosRoutes from './modules/catalogos/entities/departamentos.routes'
import cierreRoutes from './modules/cierre/cierre.routes'  

const logger = pino({ level: env.LOG_LEVEL })
const app = express()

// app.set('trust proxy', 1) // si usas proxy

// ---------------- Middlewares base ----------------
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
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

app.use(contextMiddleware)
app.use(authMiddleware)

app.use(healthRoutes)
app.use('/auth', authRoutes)
app.use('/usuarios', usuariosRoutes)
app.use('/incendios', incendiosRoutes)
app.use('/reportes', reportesRoutes)
app.use('/catalogos', catalogosRoutes)
app.use('/roles', rolesRoutes)
app.use('/firms', firmsRoutes)
app.use('/monitor', monitorRoutes)
app.use('/departamentos', departamentosRoutes)
app.use('/cierre', cierreRoutes)
app.use('/instituciones', institucionesRoutes)
app.use('/puntos-calor', puntosCalorRoutes)
app.use(estadosIncendioRoutes)

app.get('/test-auth', (_req, res) => {
  res.json({ ok: true, user: res.locals.ctx?.user || null })
})

app.use(notFound)
app.use(onError)


export default app
