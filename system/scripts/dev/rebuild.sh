#!/usr/bin/env bash
# 一键重建并启动 zhiyu dev 栈
#
# 用法：
#   bash system/scripts/dev/rebuild.sh           # 增量构建 + 重启
#   bash system/scripts/dev/rebuild.sh --fresh   # --no-cache --pull 重建
#
# 等价的手动命令（如果你不想用脚本）：
#   cd system/docker
#   docker compose --env-file env/.env.dev build --no-cache --pull
#   docker compose --env-file env/.env.dev up -d
#
# 注：本仓库已在 system/docker/.env 创建了指向 env/.env.dev 的软链，
# 所以 `docker compose ...` 在该目录下不带 --env-file 也能加载变量。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT/docker"

ENV_FILE="env/.env.dev"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "[rebuild] missing $ENV_FILE" >&2
  exit 1
fi

if [[ ! -e .env ]]; then
  ln -sfn env/.env.dev .env
  echo "[rebuild] created .env -> env/.env.dev"
fi

FRESH=0
for arg in "$@"; do
  [[ "$arg" == "--fresh" ]] && FRESH=1
done

if [[ "$FRESH" -eq 1 ]]; then
  echo "[rebuild] full rebuild (--no-cache --pull)"
  docker compose --env-file "$ENV_FILE" build --no-cache --pull
else
  echo "[rebuild] incremental build"
  docker compose --env-file "$ENV_FILE" build
fi

echo "[rebuild] up -d"
docker compose --env-file "$ENV_FILE" up -d

echo "[rebuild] db-migrate logs:"
docker compose --env-file "$ENV_FILE" logs --no-color db-migrate | tail -40 || true

echo "[rebuild] done. ps:"
docker compose --env-file "$ENV_FILE" ps
