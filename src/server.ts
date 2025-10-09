import 'reflect-metadata'
import app from './app'
import env from './config/env'
import { AppDataSource } from './db/data-source'
import pino from 'pino'
import { ensureFirmsCron } from './modules/geoespacial/firms.queue'

const logger = pino({ level: env.LOG_LEVEL })

async function main() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize()
      logger.info('✅ Base de datos conectada')
    }

    if (env.FIRMS_ENABLED) {
      await ensureFirmsCron()
      logger.info(`🛰️ Cron FIRMS programado: ${env.FIRMS_FETCH_CRON}`)
    }

    const port = env.PORT || 4000
    app.listen(port, () => {
      logger.info(`🚀 Servidor escuchando en http://localhost:${port}`)
      logger.info(`🩺 Healthcheck: /health/liveness | /health/readiness`)
    })
  } catch (e) {
    logger.error('❌ Error al iniciar la aplicación')
    logger.error(e)
    process.exit(1)
  }
}

main()
