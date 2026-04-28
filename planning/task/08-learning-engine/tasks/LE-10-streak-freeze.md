# LE-10 · Streak 与 Freeze

## 任务目标

实现连续学习日、冻结道具使用、7/30/100 天里程碑奖励，保证跨时区准确。

## PRD 原文引用

- `US-LE-04`：“连续学习日（streak）激励”
- `LE-FR-006`：“当日完成 ≥ 1 次 review / quiz / lesson 算 1 天”
- `LE-FR-006`：“跨时区按用户时区”
- `LE-FR-006`：“中断保护：streak freeze 道具（EC，50 币 / 张）”
- `LE-FR-006`：“7 / 30 / 100 天里程碑奖励币 + 徽章”
- `planning/prds/07-learning-engine/02-data-model-api.md`：“POST /api/le/streak/freeze/use — 使用冻结道具（消耗 50 币）”

## 需求拆解

- 在 review、quiz、lesson 完成事件后调用 `StreakService.recordActivity(userId, occurredAt)`。
- 按用户时区计算本地日期，更新 current/longest/last_active_date。
- 漏一天时可使用 freeze，调用经济模块扣 50 知语币。
- 7/30/100 天首次达成时发奖励币与徽章。
- 重复活动同一天只计一次 streak，但可继续累积 daily stats。

## 页面 / 组件 / API / 数据表 / 状态逻辑

| 类型 | 要求 |
|---|---|
| 页面 | `/me/dashboard`、设置/商城 freeze 展示 |
| 组件 | `StreakCard`、`FreezeUseDialog`、`MilestoneBadge` |
| API | `POST /api/le/streak/freeze/use`、dashboard streak 数据 |
| 数据表 | `learning_streaks`、`learning_daily_stats`、`coins_ledger`、徽章表 |
| 状态逻辑 | inactive → active_today；missed_one_day + freeze → preserved；missed_without_freeze → reset |

## 内容规则与边界

- review、课程 quiz、课程 lesson 可计 streak。
- 游戏是否计 streak 按 PRD LE-FR-006 原文未列，若要计入需产品另行明确；本任务不默认计入 streak，只计 game daily stats。
- 小说/发现中国阅读不计学习引擎 streak。

## 不明确 / 不支持 / 风险

- “quiz” 是否包含游戏内答题：PRD 未明确；为避免扩大 LE，默认只包括课程 quiz 与 review。
- freeze 道具库存表与经济模块可能未完成；需要 fake economy service 使 Docker 验证不阻塞。

## 技术假设

- 用户 profile 有 timezone，缺省按国家或 UTC+7 兜底。
- 里程碑奖励通过 economy service 发币，失败可重试且幂等。

## 验收清单

- [ ] 同一用户同一天多次学习只增加一次 streak。
- [ ] GMT+7 23:50 学习按当地日期计入。
- [ ] 漏一天不用 freeze 时 streak 重置。
- [ ] 使用 freeze 成功扣 50 币并保留 streak。
- [ ] 7/30/100 天奖励幂等，不重复发放。
