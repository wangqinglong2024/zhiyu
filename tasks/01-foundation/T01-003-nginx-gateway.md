# T01-003: Nginx 网关配置

> 分类: 01-基础架构搭建 (Foundation Infrastructure)
> 状态: 📋 待开发
> 复杂度: S(简单)
> 预估文件数: 2

## 需求摘要

配置前端容器内的 Nginx 以托管 SPA 静态资源，并实现反向代理将 `/api/` 请求转发到后端服务。包含 CORS 头配置、gzip 压缩、SPA 路由回退（history fallback）、安全头（X-Frame-Options、CSP 等）、静态资源缓存策略。

## 相关上下文

- 环境配置: `grules/env.md` §6 — 网关与域名配置
- 架构白皮书: `grules/01-rules.md` §三 — 网关意识（所有流量经 Nginx）
- 测试规范: `grules/08-qa-testing.md` §一.3 — Docker Compose 测试配置
- 关联任务: 前置 T01-002（Docker 配置） → 后续 T01-012（集成验证）

## 技术方案

### frontend/nginx.conf

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # --- Gzip 压缩 ---
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/javascript
        application/json
        application/xml
        image/svg+xml;

    # --- 安全头 ---
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # --- 静态资源缓存（Vite 带 hash 的构建产物） ---
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # --- API 反向代理到后端容器 ---
    location /api/ {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";

        # 超时配置
        proxy_connect_timeout 10s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # --- SPA 路由回退（React Router history 模式） ---
    location / {
        try_files $uri $uri/ /index.html;
    }

    # --- 禁止访问隐藏文件 ---
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

### docker-compose.yml 更新（确认网络互通）

前端容器通过 Docker 内部 DNS 名 `backend` 访问后端服务，需确保同一 `app-net` 网络。

### 关键设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 反向代理目标 | `http://backend:3000` | Docker 内部 DNS，容器名即域名 |
| SPA 回退 | `try_files $uri $uri/ /index.html` | React Router 需要所有路由返回 index.html |
| 压缩级别 | 6 | 平衡压缩率与 CPU 开销 |
| 缓存策略 | assets/ 1年 | Vite 构建产物带 hash，可长期缓存 |
| SSL | 暂不配置 | dev 环境用 HTTP，生产环境由外层网关处理 |

## 范围（做什么）

- 创建 `frontend/nginx.conf` Nginx 配置文件
- 配置反向代理（`/api/` → 后端）
- 配置 SPA history fallback
- 配置 gzip 压缩
- 配置安全头
- 配置静态资源缓存策略

## 边界（不做什么）

- 不配置 SSL/HTTPS（dev 环境不需要，生产由外层网关负责）
- 不配置外层网关（`/opt/gateway/` 是服务器全局网关，非本项目范围）
- 不写后端 CORS 中间件（T01-008）
- 不配置 WebSocket 代理（后续实时功能需要时再加）

## 涉及文件

- 新建: `zhiyu/frontend/nginx.conf`
- 修改: `zhiyu/frontend/Dockerfile`（确认 COPY nginx.conf 正确）

## 依赖

- 前置: T01-002（Dockerfile 中引用 nginx.conf）
- 后续: T01-012（集成验证时需要 Nginx 正常代理）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** nginx.conf 已创建且 Docker 已构建  
   **WHEN** 浏览器访问 `http://localhost:3100`  
   **THEN** 返回前端 index.html，HTTP 200

2. **GIVEN** Nginx 反向代理配置完成  
   **WHEN** 浏览器访问 `http://localhost:3100/api/v1/health`  
   **THEN** 请求被代理到后端，返回健康检查 JSON

3. **GIVEN** SPA 路由回退配置  
   **WHEN** 浏览器访问 `http://localhost:3100/any-route`  
   **THEN** 返回 index.html（不是 404），React Router 接管路由

4. **GIVEN** 安全头配置  
   **WHEN** 检查响应头  
   **THEN** 包含 X-Frame-Options、X-Content-Type-Options、X-XSS-Protection

5. **GIVEN** Gzip 配置  
   **WHEN** 请求 JS/CSS 资源并检查 Content-Encoding  
   **THEN** 响应头包含 `Content-Encoding: gzip`

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认 frontend 容器 Running
3. `curl -I http://localhost:3100` — 检查响应状态码和安全头
4. `curl -I http://localhost:3100/api/v1/health` — 检查反向代理
5. `curl -I http://localhost:3100/nonexistent-route` — 检查 SPA 回退（应返回 200）
6. `curl -H "Accept-Encoding: gzip" -I http://localhost:3100` — 检查 gzip

### 测试通过标准

- [ ] 前端静态资源正常响应
- [ ] API 反向代理正常转发
- [ ] SPA 路由回退正常
- [ ] 安全头存在
- [ ] Gzip 压缩生效
- [ ] 容器日志无 Error

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新全量验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/01-foundation/T01-003-nginx-gateway.md`

## 自检重点

- [ ] 安全：安全头配置完整
- [ ] 安全：隐藏文件（.env 等）不可访问
- [ ] 性能：gzip 压缩开启
- [ ] 性能：静态资源缓存 1 年（带 hash）
- [ ] 功能：SPA 路由回退正常
