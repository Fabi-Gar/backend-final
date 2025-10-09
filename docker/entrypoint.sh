#!/bin/sh
set -e

echo "⏳ Esperando a DB en $DB_HOST:$DB_PORT..."
until nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 2
done
echo "✅ DB lista"

echo "📦 Ejecutando migraciones..."
npm run migration:run || {
  echo "❌ Error al ejecutar migraciones"
  exit 1
}

echo "🚀 Iniciando API..."
# Para dev con tsx/watch, usa:
# npm run dev
# Para arranque de build:
npm run start
