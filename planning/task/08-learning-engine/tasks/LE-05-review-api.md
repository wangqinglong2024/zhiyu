# LE-05 · 复习 API

## 任务目标

实现学习引擎复习 API：今日题目、评分提交、预览统计，并保证鉴权、限流、事务和性能。

## PRD 原文引用

- `planning/prds/07-learning-engine/02-data-model-api.md`：“GET /api/le/review/today?limit=20 — 返回今日到期题（按优先级排序）”
- `planning/prds/07-learning-engine/02-data-model-api.md`：“POST /api/le/review/:card_id/rate — {rating, duration_ms} → 用 ts-fsrs 计算 + 更新 card + 记录 review”
- `planning/prds/07-learning-engine/02-data-model-api.md`：“GET /api/le/review/preview — {due_today, due_overdue, new_available}”

## 需求拆解

- 建立 `learning/routes.ts` 中 review router。
- `today` 接口按用户、due、source 边界、调度优先级返回题目，limit 最大 100。
- `rate` 接口校验 card 属于当前用户，rating 在 1-4，duration 合理。
- `preview` 接口返回今日到期、逾期、新题可用数。
- 所有接口返回统一 `{data, meta, error}` 格式。
- 所有写操作记录 request_id 与结构化日志。

## 页面 / 组件 / API / 数据表 / 状态逻辑

| 类型 | 要求 |
|---|---|
| 页面 | `/learn/review`、`/me/dashboard` |
| 组件 | `ReviewQueue`、`DashboardReviewCard` |
| API | `/api/le/review/today`、`/api/le/review/:card_id/rate`、`/api/le/review/preview` |
| 数据表 | `srs_cards`、`srs_reviews`、`learning_daily_stats` |
| 状态逻辑 | GET 只读；POST rate 在事务中更新 card/review/daily stats |

## 内容规则与边界

- API 层必须过滤 source，不返回小说/发现中国。
- `manual_course` 只允许课程题库问题。

## 不明确 / 不支持 / 风险

- PRD 路径写 `/api/le`，后端规范可能使用 `/api/v1`；实现时可挂载为 `/api/v1/le` 并保持 SDK alias。
- 今日题接口需要避免把答案泄露给前端；题目选项可返回，正确答案只在提交后返回。
- 评分接口需要幂等或防重复提交策略。

## 技术假设

- 鉴权使用 Supabase JWT 中间件。
- rate limit 复用项目 Express/Redis 限流。
- duration_ms 小于 0 或异常大值会被拒绝或截断。

## 验收清单

- [ ] 未登录访问返回 401。
- [ ] 用户无法评分别人的 card。
- [ ] `today?limit=999` 被限制到 100。
- [ ] `rate` 同时更新 card、插入 review、增加 daily stats。
- [ ] 题目响应不泄露正确答案。
