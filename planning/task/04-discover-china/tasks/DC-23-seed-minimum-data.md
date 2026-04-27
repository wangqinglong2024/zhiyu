# DC-23 · 提供最小开发 Seed 数据

## PRD 原文引用

- `planning/rules.md`：“发现中国 (DC) | 12 类目 × 每类 ≥ 3 篇 = ≥ 36 篇 articles。”
- 同句：“每篇含标题/正文(≥ 300 字含拼音可标注)/封面图占位/4 语 i18n 标题；至少 6 篇带 TTS 占位音频 URL。”

## 需求落实

- 页面：前台 DC 全链路、后台 DC 管理页。
- 组件：无新增。
- API：seed 后所有前台/后台列表可查询。
- 数据表：`content_categories`、`content_articles`、`content_sentences`。
- 状态逻辑：seed 可重复执行，按 slug upsert；不重复插入。
- 范围边界：本任务只满足 Docker dev 联调最小数据，不替代 DC-26 的 W0 600 篇内容上线门槛。
- 验证命令：必须在 Docker dev 环境内运行 `pnpm seed:discover-china`，不得要求主机直接 `pnpm dev`。

## 不明确 / 风险

- 风险：正式内容由后续 AI 批量灌库，开发期不能等待正式内容。
- 处理：最小 seed 用占位但结构完整的内容，保证端到端可验证。

## 技术假设

- seed 内容放在 `system/packages/db/seed/discover-china/`。

## 最终验收清单

- [ ] `pnpm seed:discover-china` 后至少 36 篇文章。
- [ ] 12 类目全覆盖，每类至少 3 篇。
- [ ] 至少 6 篇包含 TTS 占位 URL。
- [ ] 前台能完成列表到详情链路。
- [ ] seed 数据包含前 3 开放类目与第 4 受限类目的门禁测试样本。