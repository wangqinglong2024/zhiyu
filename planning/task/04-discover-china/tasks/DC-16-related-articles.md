# DC-16 · 实现相关推荐

## PRD 原文引用

- `DC-FR-012`：“单篇底部‘你可能还喜欢’显示 4 篇同类目其他热门文章。”
- `DC-FR-012`：“算法 v1：同类目 + 相近 HSK 难度 + 高评分。”

## 需求落实

- 页面：DC 文章详情页。
- 组件：RelatedArticlesRail。
- API：`GET /api/discover/articles/:id/related` 或随详情返回。
- 数据表：`content_articles`、`content_ratings`。
- 状态逻辑：相关推荐只推荐用户有权限打开的文章；未登录优先推荐前 3 类目文章。
- 排序：同类目优先，其次 HSK 接近，再按 `rating_avg`、`rating_count`、`view_count` 回退。

## 不明确 / 风险

- 风险：冷启动评分为空。
- 处理：评分为空时按同类目发布时间和 view_count 回退。

## 技术假设

- v1 不做协同过滤。

## 最终验收清单

- [ ] 每篇已发布文章底部展示最多 4 篇推荐。
- [ ] 不推荐当前文章本身。
- [ ] 未登录不会被推荐引导到不可读文章而无提示。
- [ ] HSK 相近排序生效。
- [ ] 推荐结果只包含 `status='published'` 且对当前用户可打开的文章。