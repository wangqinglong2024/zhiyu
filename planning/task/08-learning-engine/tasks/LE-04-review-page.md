# LE-04 · 温故知新页面

## 任务目标

实现 `/learn/review` 温故知新复习页，用户每天打开能看到今日待复习题，并完成 FSRS 四档评分。

## PRD 原文引用

- `US-LE-01`：“每天打开能看到今日复习推荐”
- `LE-FR-001`：“路径 `/learn/review`”
- `LE-FR-001`：“入口：dashboard ‘今日待复习 N 张’”
- `LE-FR-001`：“每日上限默认 20，可在偏好调到 50 / 100”

## 需求拆解

- 建立应用端路由 `/learn/review`。
- 页面加载 `GET /api/le/review/preview` 展示 due、overdue、new_available。
- 点击开始后加载 `GET /api/le/review/today?limit=用户偏好`。
- 单题展示题面、选项、提交、即时反馈、解释、KP 跳转。
- 答题后展示 FSRS 四档评分，评分成功后进入下一题。
- 完成后展示总结：正确率、用时、复习数、下一次到期概览。

## 页面 / 组件 / API / 数据表 / 状态逻辑

| 类型 | 要求 |
|---|---|
| 页面 | `/learn/review` |
| 组件 | `ReviewShell`、`QuestionRenderer`、`FsrsRatingBar`、`ReviewSummary` |
| API | `GET /api/le/review/preview`、`GET /api/le/review/today`、`POST /api/le/review/:card_id/rate` |
| 数据表 | `srs_cards`、`srs_reviews`、`learning_daily_stats` |
| 状态逻辑 | idle → loading → answering → feedback → rating → next → summary |

## UI 设计要求

- 使用 shadcn/ui Card、Button、Progress、Dialog、Toast，全部接入 `zy-glass-*`。
- 题目正文使用 `.zy-glass-strong`，避免毛玻璃影响拼音和翻译可读性。
- 移动端底部固定操作区，按钮命中区不低于 44px。
- 错误、空态、离线态都有明确反馈。

## 内容规则与边界

- 页面只展示来自课程与游戏错误的卡片。
- 如果用户没有到期题，推荐进入课程今日新题或游戏复习，但不推荐小说/发现中国。

## 不明确 / 不支持 / 风险

- PRD 未定义复习中断恢复；实现假设本地 route state 可恢复当前题 index，但最终以服务器记录为准。
- 大量音频题需要预加载策略，避免题目切换卡顿。

## 技术假设

- 问题渲染复用课程 QuestionRenderer。
- 用户复习上限偏好保存在 settings/profile 中，缺省 20。

## 验收清单

- [ ] dashboard 今日待复习入口能跳到 `/learn/review`。
- [ ] 默认最多 20 张，设置 50/100 后生效。
- [ ] 完成一题后必须评分才能进入下一题。
- [ ] 完成总结显示正确率、用时、复习数。
- [ ] 空态不显示小说/发现中国推荐。
