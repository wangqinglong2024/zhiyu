# ======================================================
# 多阶段构建
# Stage 1: 构建用户端 React SPA
# Stage 2: 构建管理后台 React SPA
# Stage 3: Nginx 托管静态文件
# ======================================================

FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY package.json package-lock.json* ./
# 先安装依赖，再显式安装 Alpine(musl) 平台的 Tailwind CSS v4 原生绑定
# （npm 有 optional dependencies bug，需手动补装平台包）
RUN npm install && npm install @tailwindcss/oxide-linux-x64-musl --no-save
COPY . .
RUN npm run build

# ======================================================
FROM node:20-alpine AS admin-builder

WORKDIR /app/admin
COPY admin/package.json ./
RUN npm install
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
