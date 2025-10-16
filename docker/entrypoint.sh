#!/bin/sh
set -eu

DB_HOST="${DB_HOST:-pg}"
DB_PORT="${DB_PORT:-5432}"

echo "⏳ Esperando DB en $DB_HOST:$DB_PORT…"
until nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 2
done
echo "✅ DB lista"

# Asegura que estemos en /app
cd /app

echo "🔎 Verificando build (dist)…"
if [ ! -d "dist" ]; then
  echo "❌ No existe la carpeta dist. ¿Ejecutaste el build en la imagen?"
  echo "   Revisa tu Dockerfile (etapa build) y COPY --from=build /app/dist ./dist"
  exit 1
fi

# (Opcional) Verificación de data-source compilado
if [ ! -f "dist/db/data-source.js" ]; then
  echo "⚠️  No se encontró dist/db/data-source.js. Si cambiaste la ruta, ajusta migration:run:dist."
fi

echo "📦 Ejecutando migraciones (dist)…"
if ! npm run migration:run:dist; then
  echo "❌ Error al ejecutar migraciones"
  exit 1
fi

echo "🌱 Ejecutando seeds (dist, idempotentes)…"
if ! npm run seed:dist; then
  echo "⚠️  Seeds retornaron error (posible repetición). Continuando…"
fi

echo "🩺 Healthcheck path: ${HEALTHCHECK_PATH:-/health/liveness}"
echo "🚀 Iniciando API…"
exec npm run start
