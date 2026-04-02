# 工程文档：部署配置（Docker + Nginx）

> 部署方式：单服务器 Docker Compose
> 所有服务通过 Docker 内网通信，仅 Nginx 对外暴露 80/443

---

## 一、Docker Compose 总体结构

```
┌──────────────────────────────────────────────┐
│  宿主机                                        │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │  docker-compose 网络: ideas_net          │ │
│  │                                         │ │
│  │  ┌───────────┐    ┌───────────────────┐ │ │
│  │  │  nginx    │    │  frontend (静态)   │ │ │
│  │  │  :80/:443 │    │  构建产物挂载到     │ │ │
│  │  │           │────│  nginx/html       │ │ │
│  │  └─────┬─────┘    └───────────────────┘ │ │
│  │        │ /api/*                          │ │
│  │  ┌─────▼─────┐                          │ │
│  │  │  backend  │                          │ │
│  │  │ FastAPI   │                          │ │
│  │  │ :8000     │                          │ │
│  │  └───────────┘                          │ │
│  └─────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘

外部依赖（不在 Docker 内）：
  - Supabase（MCP 访问，无需本地）
  - Dify（HTTP API）
  - 微信支付 / 支付宝（HTTP API）
  - 阿里云/腾讯云 SMS（HTTP API）
```

---

## 二、docker-compose.yml

```yaml
version: '3.9'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro       # SSL 证书（Let's Encrypt）
      - ./frontend/dist:/usr/share/nginx/html:ro  # 前端构建产物
    depends_on:
      - backend
    networks:
      - ideas_net
    restart: always

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    env_file:
      - .env
    expose:
      - "8000"           # 仅内网暴露，不对外
    networks:
      - ideas_net
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  ideas_net:
    driver: bridge
```

---

## 三、Nginx 配置

```nginx
# nginx/nginx.conf

events {
    worker_connections 1024;
}

http {
    include mime.types;
    default_type application/octet-stream;
    gzip on;
    gzip_types text/plain text/css application/javascript application/json;

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate     /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols       TLSv1.2 TLSv1.3;

        # 前端静态文件（SPA 兜底）
        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files $uri $uri/ /index.html;  # SPA 路由兜底
        }

        # 管理端静态文件
        location /admin/ {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /admin/index.html;
        }

        # API 反向代理
        location /api/ {
            proxy_pass http://backend:8000/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # 支付回调超时适当延长
            proxy_read_timeout 120s;
            proxy_connect_timeout 10s;
        }

        # 支付 Webhook（独立处理，不走同一超时）
        location /api/webhooks/ {
            proxy_pass http://backend:8000/webhooks/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_read_timeout 30s;
        }
    }
}
```

---

## 四、Dockerfile（Backend）

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# 依赖层（利用 Docker 缓存）
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 应用代码
COPY . .

# 非 root 用户运行
RUN adduser --disabled-password --gecos '' appuser
USER appuser

EXPOSE 8000

# 生产环境用 uvicorn，4 worker（单核服务器用 2）
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

---

## 五、前端构建流程

```bash
# 本地构建
cd frontend
npm run build        # 输出到 frontend/dist/

# 构建管理端
cd admin
npm run build        # 输出到 admin/dist/，需复制到 frontend/dist/admin/

# 合并到 Nginx 服务目录（已在 docker-compose volumes 中配置）
```

---

## 六、部署流程（每次更新）

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 构建前端
cd frontend && npm run build
cd ../admin && npm run build
mkdir -p ../frontend/dist/admin && cp -r dist/* ../frontend/dist/admin/
cd ..

# 3. 重启后端（前端由 Nginx 直接读取静态文件，无需重启）
docker-compose up -d --build backend

# 4. 验证
docker-compose ps
docker-compose logs backend --tail=50
```

---

## 七、SSL 证书（Let's Encrypt）

```bash
# 首次申请（在宿主机，非 Docker 内）
certbot certonly --standalone -d your-domain.com

# 证书路径
/etc/letsencrypt/live/your-domain.com/fullchain.pem
/etc/letsencrypt/live/your-domain.com/privkey.pem

# 挂载到 nginx/ssl/ 目录
ln -s /etc/letsencrypt/live/your-domain.com/fullchain.pem ./nginx/ssl/fullchain.pem
ln -s /etc/letsencrypt/live/your-domain.com/privkey.pem ./nginx/ssl/privkey.pem

# 自动续期（crontab）
0 3 * * * certbot renew --quiet && docker-compose exec nginx nginx -s reload
```
