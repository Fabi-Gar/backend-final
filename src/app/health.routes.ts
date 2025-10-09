// src/app/health.routes.ts
import { Router } from 'express'
import { AppDataSource } from '../db/data-source'
import env from '../config/env'
import Redis from 'ioredis'

const router = Router()

let redis: Redis | null = null
function getRedis(): Redis | null {
  if (!env.REDIS_URL) return null
  if (!redis) {
    redis = new Redis(env.REDIS_URL, { lazyConnect: true })
    redis.on('error', () => {}) // silencia errores de conexión
  }
  return redis
}

router.get('/health/liveness', (_req, res) => {
  res.json({ status: 'ok', env: env.NODE_ENV })
})

router.get('/health/readiness', async (_req, res) => {
  try {
    if (!AppDataSource.isInitialized) await AppDataSource.initialize()
    await AppDataSource.query('select 1')

    const r = getRedis()
    if (r) {
      if (!r.status || r.status === 'end' || r.status === 'wait') await r.connect()
      const pong = await r.ping()
      if (pong !== 'PONG') throw new Error('Redis no responde')
    }

    res.json({ status: 'ready' })
  } catch (e: any) {
    res.status(503).json({ status: 'not-ready', reason: e?.message || 'unknown' })
  }
})

export default router
