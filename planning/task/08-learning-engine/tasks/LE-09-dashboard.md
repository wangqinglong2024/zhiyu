# LE-09 · 学习仪表板

## 任务目标

实现 `/me/dashboard` 学习仪表板，展示今日、本周、累计、掌握度热力图和 streak。

## PRD 原文引用

- `US-LE-03`：“可视化掌握度（哪些 HSK / 主题强 / 弱）”
- `LE-FR-005`：“路径 `/me/dashboard`”
- `LE-FR-005`：“今日：完成题数 / 学习时长 / 知语币”
- `LE-FR-005`：“本周热力图（活跃天数）”
- `LE-FR-005`：“累计：词汇量 / 节数 / 章数 / 阶段数”
- `LE-FR-005`：“掌握度热力图（HSK 1-9 × 主题）”
- `LE-FR-005`：“连续学习日（streak）+ 最长 streak”

## 需求拆解

- 建立 `/me/dashboard` 页面或在个人中心仪表板区域接入学习数据。
- 今日卡片：题数、学习时长、知语币、今日复习入口。
- 本周热力图：按用户时区展示活跃天数。
- 累计统计：词汇量、节、章、阶段。
- 掌握度热力图：HSK 1-9 × 主题，数据只来自课程/游戏 SRS。
- streak 卡片：current、longest、freeze 数量、里程碑。

## 页面 / 组件 / API / 数据表 / 状态逻辑

| 类型 | 要求 |
|---|---|
| 页面 | `/me/dashboard` |
| 组件 | `TodayStatsCard`、`WeeklyHeatmap`、`MasteryHeatmap`、`StreakCard` |
| API | `GET /api/le/dashboard`、`GET /api/le/heatmap?range=30d` |
| 数据表 | `learning_daily_stats`、`learning_streaks`、`srs_cards`、课程进度表 |
| 状态逻辑 | 聚合数据缓存；写操作由 review/quiz/game 事件增量更新 |

## UI 设计要求

- 所有卡片用 shadcn Card + `.zy-glass-panel`。
- 热力图单元格要有文本/tooltip，不只靠颜色。
- 后台/前台均使用“主题”作为维度名。

## 内容规则与边界

- 掌握度不统计发现中国阅读进度。
- 掌握度不统计小说阅读进度。
- 游戏只通过 wrong/miss 与 SRS 状态影响掌握度。

## 不明确 / 不支持 / 风险

- “词汇量”如何从题目级 SRS 推导需要定义：可按已完成课程知识点去重统计。
- daily stats 需要物化或增量写，避免每次 dashboard 做重聚合。

## 技术假设

- 主题维度为 4 个课程主题。
- 热力图 range 默认 30d，可扩展 90d。

## 验收清单

- [ ] 今日、本周、累计、掌握度、streak 均有数据。
- [ ] 掌握度只包含课程主题与游戏错题影响。
- [ ] 空数据用户展示 onboarding/开始学习引导。
- [ ] Dashboard P95 < 500ms。
- [ ] 热力图满足键盘/屏幕阅读器可访问性。
