# ===== 阶段 1: 构建 =====
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline

COPY . .
RUN npm run build

# ===== 阶段 2: 生产运行 =====
FROM node:22-alpine AS production

# 安全：使用非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001

WORKDIR /app

# 只复制生产依赖
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline --omit=dev && npm cache clean --force

# 复制编译产物
COPY --from=builder /app/dist ./dist

# 安装健康检查工具
RUN apk add --no-cache wget

USER appuser

EXPOSE 3000

CMD ["node", "dist/main.js"]
