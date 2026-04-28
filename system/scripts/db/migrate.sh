#!/usr/bin/env bash
# 在 docker compose 启动后顺序执行 supabase/migrations/*.sql。
set -euo pipefail
: "${DATABASE_URL:?need DATABASE_URL}"

DIR="$(cd "$(dirname "$0")/../.." && pwd)/supabase/migrations"
echo "[migrate] applying SQL from $DIR"
for f in "$DIR"/*.sql; do
  echo "[migrate] -> $f"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done
echo "[migrate] done."
