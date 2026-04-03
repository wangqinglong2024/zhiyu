#!/bin/bash
# ==============================================================================
# 内观 AI 认知镜 - 一键重建部署脚本
# 用法：bash rebuild.sh [backend|frontend|all]
# ==============================================================================
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "=== 内观 AI 认知镜 部署脚本 ==="
echo "项目目录: $PROJECT_DIR"

TARGET="${1:-all}"

# 检查外部网络是否存在
ensure_networks() {
    for net in gateway_net global-data-link; do
        if ! docker network ls --format '{{.Name}}' | grep -q "^${net}$"; then
            echo "创建网络: $net"
            docker network create "$net" 2>/dev/null || true
        fi
    done
}

rebuild_backend() {
    echo ""
    echo "--- 重建后端 ---"
    docker compose build --no-cache backend
    docker compose up -d backend
    echo "等待后端健康检查..."
    sleep 5
    for i in $(seq 1 12); do
        if curl -sf http://localhost:8080/health >/dev/null 2>&1 || \
           docker compose exec backend python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/health')" 2>/dev/null; then
            echo "✓ 后端健康检查通过"
            break
        fi
        sleep 5
        echo "  等待中... ($i/12)"
    done
}

rebuild_frontend() {
    echo ""
    echo "--- 重建前端 ---"
    docker compose build --no-cache frontend
    docker compose up -d frontend
    echo "✓ 前端重建完成"
}

ensure_networks

case "$TARGET" in
    backend)
        rebuild_backend
        ;;
    frontend)
        rebuild_frontend
        ;;
    all|*)
        rebuild_backend
        rebuild_frontend
        ;;
esac

echo ""
echo "=== 部署完成 ==="
echo "后端健康: curl -s https://ideas.top/api/health"
echo "前端访问: https://ideas.top"
echo "管理后台: https://ideas.top/admin/"
echo "管理员账号: admin / ideas2026"
