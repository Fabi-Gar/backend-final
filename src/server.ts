;(function forceNoSSL() {
  delete (process.env as any).PGSSLMODE
  delete (process.env as any).PGSSLROOTCERT
  delete (process.env as any).PGSSLCERT
  delete (process.env as any).PGSSLKEY
  delete (process.env as any).PGSSLPASSWORD
  delete (process.env as any).DATABASE_URL
})()

import 'reflect-metadata'
import app from './app'
import env from './config/env'
import { AppDataSource } from './db/data-source'
import pino from 'pino'

const logger = pino({ level: env.LOG_LEVEL })

async function main() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize()
      logger.info('✅ Base de datos conectada')
    }

    const port = env.PORT || 4000
    app.listen(port, () => {
      logger.info(`🚀 Servidor escuchando en http://localhost:${port}`)
      logger.info(`🩺 Healthcheck: /health/liveness | /health/readiness`)
    })
  } catch (e) {
    logger.error('❌ Error al iniciar la aplicación')
    process.exit(1)
  }
}

main()
