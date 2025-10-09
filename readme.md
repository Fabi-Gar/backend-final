Backend Incendios · README
Visión general






Recrea todas las imágenes definidas en docker-compose.dev.yml

docker compose -f docker-compose.dev.yml up -d --build

solo api

docker compose -f docker-compose.dev.yml build api
docker compose -f docker-compose.dev.yml up -d api



Limpiar y iniciar

docker compose -f docker-compose.dev.yml build --no-cache api
docker compose -f docker-compose.dev.yml up -d api


API en Node 20 + Express + TypeORM (PostgreSQL), con Docker para desarrollo y despliegue. Incluye seguridad base (Helmet, CORS, rate limit), logs con Pino y healthchecks.

Requisitos

Node.js 20.x (para correr en local sin Docker)

Docker + Docker Compose (para entorno reproducible)

PostgreSQL (en Docker o externo)

(Opcional) Redis

Ejecucion de seed dentro de docker

docker compose -f docker-compose.dev.yml exec api node dist/db/seeds/171004_seed_inicial.js


Configuración de entorno

Crea un .env con variables clave:

App: PORT, LOG_LEVEL, APP_TIMEZONE, CORS_ALLOWED_ORIGINS

DB: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_SSL

Auth: JWT_SECRET (+ parámetros de hash: HASH_ALGO, ARGON2_*)

FIRMS: FIRMS_*

Redis (opcional): REDIS_URL

Validación automática de entorno con Zod (archivo src/config/env.ts).

Scripts NPM
Desarrollo (watch)
npm run dev


Levanta el servidor en modo desarrollo con recarga en caliente.

Compilación TypeScript → JS
npm run build


Genera dist/.

Producción (sin Docker)
npm start


Ejecuta node dist/server.js. Requiere npm run build previo.

Migraciones (TypeORM) — local (TS)
npm run migration:run
npm run migration:revert


Aplica/revierte migraciones desde src/db/migrations usando TypeScript.

Migraciones (TypeORM) — dist (JS)
npm run migration:run:dist
npm run migration:revert:dist


Aplica/revierte migraciones desde dist/db/migrations (útil en Docker/producción).

Docker
Desarrollo con Postgres + Redis + API
docker compose -f docker-compose.dev.yml up --build


Servicios: db (PostgreSQL), redis y api.

API: http://localhost:4000.

Migraciones dentro del contenedor (JS)
docker compose exec api npm run migration:run:dist
# revertir:
docker compose exec api npm run migration:revert:dist


La imagen de DB usa postgis/postgis, por lo que puedes habilitar extensiones geoespaciales.

Endpoints de salud

Liveness: GET /health/liveness → confirma que el proceso está vivo.

Readiness: GET /health/readiness → verifica conexión a Postgres (y Redis si está configurado).

Flujo de trabajo recomendado

Local sin Docker

Configura .env.

npm run dev

npm run migration:run al agregar/actualizar migraciones.

Verifica /health/liveness y /health/readiness.

Con Docker

docker compose -f docker-compose.dev.yml up --build

docker compose exec api npm run migration:run:dist

Verifica endpoints de salud.

Migraciones: buenas prácticas

Nombra las migraciones con timestamp en milisegundos y usa el mismo valor en:

nombre del archivo: 1759611263993-MyMigration.ts

nombre de la clase: export class MyMigration1759611263993 ...

Asegura que el DataSource incluya globs híbridos:

entities: ['src/modules/**/entities/*.{ts,js}', 'dist/modules/**/entities/*.js']

migrations: ['src/db/migrations/*.{ts,js}', 'dist/db/migrations/*.js']

Para entornos Cloud, corre migraciones en CI/CD antes de arrancar la app.

Solución de problemas

El servidor intenta SSL en local

Asegura ssl: false en el DataSource y DB_SSL=false en .env.

Borra variables del sistema como PGSSLMODE, DATABASE_URL si fuerzan SSL.

“No migrations are pending” pero hay archivos

Revisa el timestamp en el nombre de archivo y clase.

Confirma rutas del DataSource (globs *.{ts,js}).

En Docker usa los scripts :dist tras npm run build.

Windows: error con ts-node/cross-env

Usa los scripts con tsx (ya incluidos):
tsx node_modules/typeorm/cli.js migration:run -d src/db/data-source.ts

CORS bloqueado

Agrega tu origen a CORS_ALLOWED_ORIGINS (coma-separado) en .env.

Despliegue en Cloud (resumen)

Construye imagen con el Dockerfile multi-stage.

Usa variables de entorno seguras (secret manager).

Ejecuta migraciones antes del arranque (job/pipeline o :dist).

En managed DB, habilita extensiones (p. ej., pgcrypto, postgis, btree_gist) con permisos adecuados.