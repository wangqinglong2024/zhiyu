# 10 · 可观测性（Observability，本地栈）

> **本文档受 [planning/00-rules.md](../00-rules.md) §6 强约束**：禁用 Sentry / PostHog / Better Stack / PagerDuty / UptimeRobot 等托管服务，全部本地化。

---

## 一、三大支柱

| 支柱 | 选型 | 备注 |
|---|---|---|
| Logs | `pino` JSON → docker logs / 落盘 `/var/log/zhiyu/` | 可选 Loki + Promtail（v1.5）|
| Metrics | `prom-client` 暴露 `/metrics` | 可选 Prometheus + Grafana docker（v1.5）|
| Traces | request_id 贯穿前后端 | OpenTelemetry deferred |

---

## 二、日志

### 2.1 后端（pino）

```ts
import pino from 'pino';
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: { service: process.env.ROLE ?? 'app-be', env: process.env.APP_ENV },
  timestamp: pino.stdTimeFunctions.isoTime,
});
```

字段约定：

```json
{
  "ts":"2026-04-26T10:00:00Z","level":"info","service":"app-be","env":"dev",
  "version":"<git sha>","req_id":"abc","user_id":"u_123",
  "method":"POST","path":"/api/v1/lessons/start","status":200,"duration_ms":87,
  "msg":"lesson_started"
}
```

### 2.2 前端

- `console.error` 全局拦截（`window.onerror` + `unhandledrejection`）→ POST `/api/v1/_telemetry/error`。
- 字段：`ts / route / user_agent / user_id? / message / stack / app_version / req_id?`。
- 后端写入 `error_events` 表，按 `app_version + message hash` 分组。

### 2.3 敏感字段脱敏

- 中间件按字段名黑名单（`password`、`token`、`secret`、`card`、`id_no`）替换为 `***`。
- 落表前执行；日志同步处理。

### 2.4 保留

- Docker logs：依赖 `json-file` driver，单文件 100MB，保留 5 个。
- 落盘日志（`/var/log/zhiyu/*.log`）：logrotate 30 天。
- `error_events` 表：90 天 TTL（cron 清理）。

---

## 三、指标

### 3.1 应用指标

| 指标 | 类型 | label |
|---|---|---|
| `http_request_total` | counter | route, method, status |
| `http_request_duration_seconds` | histogram | route, method |
| `queue_jobs_total` | counter | queue, result |
| `queue_depth` | gauge | queue |
| `db_pool_in_use` | gauge | — |
| `cache_hits_total` | counter | key |

### 3.2 业务指标（v1 简单计数）

- `users_registered_total`
- `lessons_completed_total`
- `payment_success_total` / `payment_failure_total`
- `ai_task_total{ status }`（mock 期间）

### 3.3 暴露

- `GET /metrics` → Prometheus 文本，**仅 docker 内部网络**；nginx 上层禁止 `/metrics` 外部访问。

---

## 四、健康检查

| 路径 | 含义 |
|---|---|
| `/health` | 进程存活；返回 `{ status, version, uptime }` |
| `/ready` | 依赖检查：DB / Redis / supabase-kong 连通；任一 fail → 503 |
| `/metrics` | Prometheus 指标（内网） |

容器 `HEALTHCHECK` 走 `/health`；编排级就绪走 `/ready`。

---

## 五、错误监控（自建）

- 表：`error_events { id, ts, env, service, version, level, fingerprint, count, last_seen, message, stack, context }`。
- 后端中间件统一捕获未处理错误 → 写表 + pino error。
- 后台管理界面可查询近 24h / 7d 错误趋势（admin-fe 内嵌简单页面，v1 极简）。
- 告警（v1）：cron 每 5 分钟统计「过去 5 分钟新增 fingerprint 数量」，超阈值 → 写入 `alert_events` + 控制台 WARN（v1.5 接邮件/IM）。

---

## 六、行为分析（自建）

- 表：`events { id, ts, user_id?, anon_id, type, props jsonb }`。
- 前端调用 `track(type, props)` → 队列后批量上报。
- 后端服务端事件直接 `INSERT`。
- 报表：v1 用 SQL 视图 + 后台管理简单看板；v1.5 评估自托管 Metabase docker。

---

## 七、SLO（v1 目标）

| 服务 | 指标 | 目标 |
|---|---|---|
| app-be | 可用性 | 99.5% / 月 |
| app-be | P95 延迟 | < 300ms |
| app-be | 错误率 | < 1% |
| admin-be | 可用性 | 99% / 月 |
| 学习引擎核心 | 成功率 | > 99% |
| 支付 webhook | 处理时延 | < 30s |

错误预算：超预算冻结新功能；P0 阶段不强制。

---

## 八、告警（最小可用）

| 规则 | 通道 |
|---|---|
| `/ready` 连续 3 次 fail | docker stdout WARN + email（v1.5）|
| 5 分钟内 5xx > 5% | 同上 |
| `error_events` 5 分钟新 fingerprint > N | 同上 |
| Redis OOM / DB 连接耗尽 | 同上 |

> v1 告警先用日志文本 + cron 邮件占位（`EmailAdapter` 默认 console）；v1.5 可接外部 IM。

---

## 九、用户反馈

- 应用内「反馈」表单 → 写表 `feedback`；后台管理可读。
- NPS / 应用商店评分：deferred（v1.5）。

---

## 十、事故响应

| 阶段 | 动作 |
|---|---|
| 检测 | 健康检查 / 用户报告 / 日志告警 |
| 通报 | 写入 `incidents` 表；后台公告位 |
| 处理 | runbook（仓库 `docs/runbooks/`）|
| 恢复 | 验证 `/ready`、smoke test |
| 复盘 | RCA 模板写入 `docs/postmortems/` |

---

## 十一、性能预算

- 前端 bundle 主包 < 250KB gz；超 5% PR 阻断（本地 `size-limit` + husky）。
- 首屏 LCP < 2.5s（dev 容器内自测）；RUM 上报到 `events` 表，字段 `web_vital`。

---

## 十二、检查清单

- [ ] pino 配置正确，字段齐全
- [ ] `/health` `/ready` `/metrics` 三端点齐
- [ ] 容器 healthcheck 启用
- [ ] `error_events` 表与上报接口可用
- [ ] `events` 表与前端 SDK 可用
- [ ] `/metrics` 不暴露公网
- [ ] 不引用 Sentry / PostHog / Better Stack / PagerDuty / UptimeRobot
