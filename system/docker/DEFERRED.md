# 已知延后项（M0 阶段未交付，后续迭代补齐）

> 决策依据：先用最小可工作子集打通 Docker + 浏览器测试通路；下面项目都不影响 M0 关键流程（登录/注册/发现/管理）。

| 项 | 状态 | 备注 |
|----|------|------|
| Supabase Storage / Realtime / Studio / Edge Functions | 未启用 | 容器接入官方 image 即可，本期 4 个核心 app 不依赖 |
| Tailwind 4 | 未引入 | M0 仅用 ui-kit/tokens.css；后续替换 ui-kit 内部实现，不影响业务 |
| Google OAuth 真实接入 | mock | 鉴别在登录页隐藏入口（缺 Key） |
| Paddle 支付 | mock | adapter 已落地，缺 Key 自动 mock |
| Email 真实发送 | mock-mailbox | 写入 `.dev/mailbox/inbox.log` |
| 二步验证 | **永久取消** | PM 决策（grules/G3 §99 Q9） |
| LangGraph / AI workflow | 仅 mock LLM | adapter 工厂已就绪，未接入实际 SDK |
| Game engine（PixiJS）| 未引入 | apps/web-app 暂无游戏页 |
| BullMQ worker / cron | 未启动 | redis 已起，留给下次迭代 |
| pgTAP RLS 测试 | 未编写 | RLS policy 已最小化落地 |
| nginx 反向代理（生产）| 未交付 | dev 直接 IP:端口（用户偏好） |

## 升级路径

1. 引入官方 `supabase/docker` 子集（storage / realtime / studio / functions）作为 compose include；
2. 用 `@tailwindcss/vite` 4.x plugin 替换 ui-kit 内部样式；
3. 在 `packages/ai-adapters/llm/` 增加 claude.ts / deepseek.ts；env 有 Key 时自动启用；
4. 在 `apps/api-app/src/jobs/` 落 BullMQ + worker 容器；
5. 在 `supabase/tests/rls/` 落 pgTAP 测试，由 `db-migrate` 之后的 `db-test` oneshot 执行。
