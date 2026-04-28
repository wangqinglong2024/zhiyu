#!/usr/bin/env bash
# 释放本项目固定占用的端口；占用即 kill，无询问。
set -euo pipefail

PORTS=(3100 4100 8100 9100 8000 5432 6379)

for p in "${PORTS[@]}"; do
  pids=$(lsof -ti :"$p" 2>/dev/null || true)
  if [[ -n "$pids" ]]; then
    echo "[free-ports] killing pid(s) on :$p -> $pids"
    kill -9 $pids 2>/dev/null || true
  fi
done

echo "[free-ports] done."
