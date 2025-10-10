#!/bin/sh
set -eu

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"

echo "⏳ Esperando DB en $DB_HOST:$DB_PORT…"
until nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 2
done
echo "✅ DB lista"

echo "📦 Ejecutando migraciones (dist)…"
npm run migration:run:dist || {
  echo "❌ Error al ejecutar migraciones"; exit 1;
}

echo "🌱 Ejecutando seeds (dist, idempotentes)…"
npm run seed:dist || echo "⚠️ Seeds retornaron error (posible repetición) — continuando…"

echo "🚀 Iniciando API…"
npm run start
