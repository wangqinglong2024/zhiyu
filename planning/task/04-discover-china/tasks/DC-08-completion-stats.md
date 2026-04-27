# DC-08 · 实现完读判定与阅读统计

## PRD 原文引用

- `DC-FR-005`：“完读判定：滚到末尾 + 停留 > 30s。”
- `DC-FR-015`：“个人中心 `/me/stats` 显示已读文章数、累计字数、收藏数。”

## 需求落实

- 页面：DC 文章页、个人中心统计页。
- 组件：CompletionObserver、ReadingStatsCard。
- API：`POST /api/discover/articles/:id/progress`、`GET /api/me/stats`。
- 数据表：`learning_reading_progress`、`content_articles`。
- 状态逻辑：只有登录用户计入跨设备统计；未登录完读只上报匿名事件。
- 完读阈值：必须同时满足 `progress_pct >= 95`、末尾句子进入视口、停留 > 30s；重复完读不重复累计已读数。
- 统计口径：已读文章数和累计字数来自 `learning_reading_progress` 的 completed article；收藏数来自 `user_favorites`。

## 不明确 / 风险

- 风险：用户快速滑到底刷完读。
- 处理：必须同时满足滚到底、停留 30s、可见句子比例阈值。

## 技术假设

- 字数统计取 `content_articles.word_count`，缺失时由 seed/import 阶段计算。

## 最终验收清单

- [ ] 完读后 `is_completed=true`。
- [ ] 个人中心已读数、累计字数、收藏数准确。
- [ ] 重复阅读同一文章不重复增加已读数。
- [ ] 完读事件写入 `events`。