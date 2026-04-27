# DC-07 · 实现阅读进度保存与恢复

## PRD 原文引用

- `DC-FR-005`：“滚动到第 N 句时自动保存（防抖 5s），未登录则用 localStorage。”
- `DC-FR-005`：“返回文章时自动滚到上次位置。”

## 需求落实

- 页面：DC 文章页。
- 组件：ReadingProgressTracker、ResumeReadingAnchor。
- API：`POST /api/discover/articles/:id/progress`。
- 数据表：`learning_reading_progress`。
- 状态逻辑：登录用户写表；未登录仅开放类目内 localStorage 暂存；防抖 5s。
- API 限流：服务端按 PRD 执行 1/2s/user 限流，前端防抖不能作为唯一保护。
- 恢复规则：优先按 `last_sentence_id` 定位；句子不存在时用 `progress_pct` 回退到最近句子。

## 不明确 / 风险

- 风险：滚动位置和句子 id 可能因内容重排失效。
- 处理：以 last_sentence_id 为主，百分比为回退。

## 技术假设

- 阅读进度表由 DC/NV 共用，target_type 区分 article/novel_chapter。

## 最终验收清单

- [ ] 登录用户跨设备恢复阅读位置。
- [ ] 未登录开放类目文章本机恢复阅读位置。
- [ ] 频繁滚动不会产生过量请求。
- [ ] 关闭页面再打开自动滚动到上次句子或最接近百分比位置。
- [ ] 删除/归档文章后进度不影响其它内容。