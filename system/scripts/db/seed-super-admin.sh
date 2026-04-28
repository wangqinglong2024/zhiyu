#!/usr/bin/env bash
# 在 docker compose 启动后调用：往 Postgres 插入超级管理员（idempotent）。
set -euo pipefail

: "${SUPER_ADMIN_EMAIL:?need SUPER_ADMIN_EMAIL}"
: "${SUPER_ADMIN_PASSWORD:?need SUPER_ADMIN_PASSWORD}"
: "${DATABASE_URL:?need DATABASE_URL}"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -v "admin_email=$SUPER_ADMIN_EMAIL" \
  -v "admin_pwd=$SUPER_ADMIN_PASSWORD" \
  -f supabase/seed.sql

echo "[seed-super-admin] done."
