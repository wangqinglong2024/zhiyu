# ZY-01-04 · Secrets 与启动校验

> Epic：E01 · 估算：S · 状态：ready-for-dev
>
> 顶层约束：[planning/00-rules.md](../../00-rules.md) §8

## User Story
**As a** 后端开发
**I want** 启动时强校验环境变量
**So that** 错配/缺配可立即被发现，且缺非关键 key 不阻塞本地开发

## Acceptance Criteria
- [ ] `system/docker/.env.example` 涵盖：
  - 必填：`POSTGRES_PASSWORD`、`SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`、`JWT_SECRET`、`SUPABASE_URL`、`DATABASE_URL`、`REDIS_URL`
  - 可选：`RESEND_API_KEY`、`ONESIGNAL_KEY`、`PADDLE_KEY`、`TURNSTILE_SECRET`、`ANTHROPIC_API_KEY`、`DEEPSEEK_API_KEY`、`TAVILY_API_KEY`
- [ ] `.env` 在 `.gitignore`
- [ ] `packages/config/env.ts`：Zod schema 校验：
  - 必填缺失 → 抛错并 `process.exit(1)`，错误信息包含 key 名
  - 可选缺失 → WARN log + 标记适配器走 fake
- [ ] BE 启动入口最先调用 `loadEnv()`
- [ ] FE 通过 vite `define` 仅注入 `VITE_*` 前缀变量

## 测试方法
```bash
# 删除一个可选 key
sed -i 's/^RESEND_API_KEY=.*/RESEND_API_KEY=/' system/docker/.env
docker compose restart zhiyu-app-be
docker logs zhiyu-app-be | grep -i 'fake email adapter'   # 应有 WARN

# 删除一个必填 key
sed -i 's/^JWT_SECRET=.*/JWT_SECRET=/' system/docker/.env
docker compose restart zhiyu-app-be
docker compose ps zhiyu-app-be    # 应 unhealthy / restarting
docker logs zhiyu-app-be | grep -i 'JWT_SECRET'           # 应有清晰报错
```

## DoD
- [ ] 上述两个负向测试均符合预期
- [ ] 仓库不含真实 secrets
