# Sprint Plan · E01 平台基础设施

> 顶层约束：[planning/00-rules.md](../../00-rules.md)
> Epic：[../epics/01-platform-foundation.md](../epics/01-platform-foundation.md)
> 故事：[../story/01-platform-foundation/00-index.md](../story/01-platform-foundation/00-index.md)

## 目标

2 周内：4 业务容器 + 1 worker + redis 在 `115.159.109.23` 一键拉起；外网 4 个端口可访问；Supabase + Redis 通；健康/就绪/指标/日志/Adapter 占位齐套。

## 排期（2 周）

| 周 | Day | Story | Owner | 验收 |
|---|---|---|---|---|
| W1 | D1 | ZY-01-01 Monorepo | dev | typecheck / build 全绿 |
| W1 | D1-D2 | ZY-01-02 风格 + hooks | dev | pre-commit 拦截 lint |
| W1 | D2-D4 | ZY-01-03 compose dev | dev + ops | 4 端口 curl 200 |
| W1 | D4-D5 | ZY-01-04 secrets/zod | dev | 缺 key WARN，必填崩 |
| W2 | D6-D8 | ZY-01-05 Supabase 接入 | dev | `_db/check` JSON 正确 |
| W2 | D8-D10 | ZY-01-06 Redis/BullMQ/健康/日志/Adapter | dev | 全部 curl + Puppeteer 通过 |

## 依赖与并行
- 01 → 02 → 03 串行；03 完成后 04/05/06 可并行
- 不依赖外部 SaaS / 不需任何 API key

## 退出标准（同 Epic DoD）
1. `cd system/docker && docker compose -f docker-compose.dev.yml up -d --build` 一键
2. `curl http://115.159.109.23:{3100,8100,4100,9100}/...` 全 200
3. MCP Puppeteer 烟雾全过
4. `grep -RE "Cloudflare|Render|Doppler|Sentry|PostHog|Better Stack|Dify"` 无业务代码命中
5. backup cron 装好，恢复演练记录留档

## 风险
- supabase 单实例：每日 dump + 月度恢复演练
- 端口被占：up.sh 启动前 `ss -tlnp` 检查
