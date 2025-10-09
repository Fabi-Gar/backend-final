#!/bin/sh
set -eu

# Defaults por si faltan vars
DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"

echo "⏳ Esperando a DB en $DB_HOST:$DB_PORT..."
# Requiere netcat dentro de la imagen
until nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 2
done
echo "✅ DB lista"

echo "📦 Ejecutando migraciones..."
# Usa el script correcto según cómo inicias la API en el contenedor:
# - Si corres compilado (node dist/server.js) -> migration:run:dist
# - Si corres TS (ts-node/tsx) -> migration:run
npm run migration:run:dist || {
  echo "❌ Error al ejecutar migraciones"
  exit 1
}

echo "🚀 Iniciando API..."
npm run start
