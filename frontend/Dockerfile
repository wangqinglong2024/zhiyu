# ======================================================
# 多阶段构建
# Stage 1: 构建用户端 React SPA
# Stage 2: 构建管理后台 React SPA
# Stage 3: Nginx 托管静态文件
# ======================================================

FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline
COPY . .
RUN npm run build

# ======================================================
FROM node:20-alpine AS admin-builder

WORKDIR /app/admin
COPY admin/package.json admin/package-lock.json* ./
RUN npm ci --prefer-offline
COPY admin/ .
RUN npm run build

# ======================================================
FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/app.conf

# 用户端静态文件
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# 管理后台（放在 /admin/ 子目录）
COPY --from=admin-builder /app/admin/dist /usr/share/nginx/html/admin

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
