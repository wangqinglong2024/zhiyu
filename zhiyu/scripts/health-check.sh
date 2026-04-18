#!/bin/bash
set -e

echo "===== 知语 Zhiyu 集成验证 ====="
echo ""

# A. Docker 容器状态
echo "[A] Docker 容器状态检查..."
docker compose ps
echo ""

# B. API 联通验证
echo "[B1] 后端健康检查 (直接访问)..."
curl -sf http://localhost:8100/api/v1/health || echo "❌ 后端健康检查失败"
echo ""

echo "[B2] Nginx 代理健康检查..."
curl -sf http://localhost:3100/api/v1/health || echo "❌ Nginx 代理健康检查失败"
echo ""

echo "[B3] 404 路由测试..."
curl -sf http://localhost:8100/api/v1/nonexistent || echo "(预期 404)"
echo ""

# C. 前端页面
echo "[C1] 前端首页..."
STATUS=$(curl -so /dev/null -w "%{http_code}" http://localhost:3100/)
echo "首页 HTTP 状态码: $STATUS"
echo ""

echo "[C2] SPA 路由回退..."
STATUS=$(curl -so /dev/null -w "%{http_code}" http://localhost:3100/any-deep-route)
echo "SPA 路由 HTTP 状态码: $STATUS (应为 200)"
echo ""

# D. 安全头
echo "[D] 安全头检查..."
curl -sI http://localhost:3100/ | grep -iE "x-frame-options|x-content-type-options|x-xss-protection"
echo ""

# E. 设计系统合规
echo "[E1] 检查 tailwind.config.js (应不存在)..."
if find /opt/projects/ideas_ai/zhiyu -name "tailwind.config.js" | grep -q .; then
  echo "❌ 发现 tailwind.config.js！"
else
  echo "✅ 无 tailwind.config.js"
fi

echo "[E2] 检查紫色 (应不存在)..."
if grep -r "purple\|violet\|#7c3aed\|#8b5cf6" /opt/projects/ideas_ai/zhiyu/frontend/src/ 2>/dev/null; then
  echo "❌ 发现紫色！"
else
  echo "✅ 无紫色元素"
fi

echo ""
echo "===== 验证完成 ====="
