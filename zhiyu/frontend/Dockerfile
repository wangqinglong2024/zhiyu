# ===== 阶段 1: 构建 =====
FROM node:22-alpine AS builder

WORKDIR /app

# 利用 Docker 缓存层：先复制依赖文件
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline

# 复制源码并构建
COPY . .
RUN npm run build

# ===== 阶段 2: 生产运行 =====
FROM nginx:1.27-alpine AS production

# 复制构建产物到 Nginx 默认目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制自定义 Nginx 配置（T01-003 提供）
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
