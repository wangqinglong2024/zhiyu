# ZY-01-06 · Redis + BullMQ + 健康端点 + 日志 + Adapter 占位

> Epic：E01 · 估算：M · 状态：ready-for-dev
>
> 顶层约束：[planning/00-rules.md](../../00-rules.md) §4 / §6 / spec/10

## User Story
**As a** 平台维护者
**I want** 队列 + 健康检查 + 日志 + Adapter 占位齐套
**So that** 后续业务 epic 不必再处理基础设施，且可观测性从第一天就在线

## Acceptance Criteria

### A. Redis + BullMQ
- [ ] `zhiyu-redis` 容器（redis:7-alpine）已在 ZY-01-03 中启动；本 story 在 worker 中接入
- [ ] `apps/worker` 启动 BullMQ 消费者，注册 queue `noop`
- [ ] BE `/api/v1/_ping/queue` POST 触发一个 `noop` job
- [ ] worker 处理完打 INFO 日志：`{ msg: "noop_processed", job_id, duration_ms }`

### B. 健康/就绪/指标端点
- [ ] `GET /health` → `{ status: "ok", version: <git sha or pkg version>, uptime: <sec> }`
- [ ] `GET /ready` → 检查 DB（select 1）+ Redis（ping）+ supabase-kong（GET /）；任一 fail → 503，body 列出失败项
- [ ] `GET /metrics` → `prom-client` 默认指标 + 自定义 `http_request_duration_seconds`、`queue_jobs_total`
- [ ] `/metrics` 仅在 `ALLOW_METRICS=true` 或源 IP 在内网时暴露；nginx 上层（如已挂）拒绝外部
- [ ] 容器 `HEALTHCHECK` 走 `/health`

### C. 日志
- [ ] `pino` 全局 logger；字段 `ts/level/service/env/version/req_id/user_id?/msg`
- [ ] request_id 中间件：从 header `X-Request-Id` 取或生成 nanoid，回写响应头
- [ ] 错误中间件：未处理异常 → pino error + 写入表 `error_events`
- [ ] 表 `dev_zhiyu.error_events(id, ts, env, service, version, level, fingerprint, message, stack, context jsonb)` 在迁移中创建
- [ ] FE 全局 `window.onerror` + `unhandledrejection` POST `/api/v1/_telemetry/error`
- [ ] 敏感字段中间件：黑名单（password/token/secret/card/id_no）写入前替换 `***`

### D. Adapter 占位
- [ ] `packages/sdk/adapters/` 下定义接口与 fake 实现：
  - `EmailAdapter`（fake = console）
  - `SmsAdapter`（fake = console）
  - `PushAdapter`（fake = console）
  - `PaymentAdapter`（fake = always-success，写 `payments` 表占位）
  - `CaptchaAdapter`（fake = always-pass）
  - `LLMAdapter`（fake = 返回固定 fixture）
  - `TTSAdapter`（fake = 返回固定 wav 路径）
  - `ASRAdapter`（fake = 返回固定文本）
  - `WorkflowAdapter`（fake = 调 fixture）
  - `WebSearchAdapter`（fake = 返回固定结果；真实由 agent 侧 Tavily MCP 提供）
- [ ] 每个 adapter 工厂根据 env 是否含对应 key 决定用真实还是 fake；缺 key 时 WARN 日志一次

## 技术参考
- spec/10（可观测性）
- spec/02 §五~§七（AI / 第三方 / 观测）

## 测试方法
```bash
# 健康
curl -fsS http://115.159.109.23:8100/health | jq
curl -fsS http://115.159.109.23:8100/ready  | jq

# 指标（容器内访问）
docker exec zhiyu-app-be wget -qO- http://localhost:8080/metrics | head

# 队列
curl -fsSX POST http://115.159.109.23:8100/api/v1/_ping/queue
docker logs zhiyu-worker | grep noop_processed

# 错误上报
curl -fsSX POST http://115.159.109.23:8100/api/v1/_telemetry/error \
  -H 'Content-Type: application/json' \
  -d '{"message":"test","stack":"at fake.js:1"}'
docker exec supabase-db psql -U postgres -d postgres -c "select count(*) from dev_zhiyu.error_events;"
```

MCP Puppeteer：在 `http://115.159.109.23:3100/_debug/throw` 触发未捕获错误，断言后端 `error_events` +1。

## DoD
- [ ] 上述全部测试通过
- [ ] 删除 `ANTHROPIC_API_KEY` 启动后日志中出现 "LLMAdapter -> fake" WARN
- [ ] `/metrics` 公网访问被拒（401/403）
- [ ] 不引用 Sentry/PostHog/Better Stack/PagerDuty 等关键词
