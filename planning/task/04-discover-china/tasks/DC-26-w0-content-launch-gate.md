# DC-26 · 实现 W0 内容上线门槛校验

## PRD 原文引用

- `planning/prds/02-discover-china/00-index.md`：“每类目 ≥ 50 篇短文（首发 600 篇）。”
- `DC 内容验收`：“600 篇文章上架（每类目 ≥ 50）。”
- `DC 内容验收`：“每篇含完整：标题 + 摘要 + 句子 + 关键点 + TTS + 4 语翻译。”
- `DC 内容验收`：“红线词 0 触发；母语审校通过率 100%；HSK 难度自动计算 + 标注。”

## 需求落实

- 页面：后台导入结果页、审校工作台、前台抽检链路。
- 组件：LaunchContentGateReport、CategoryContentCoverageTable。
- API：`GET /admin/api/content/discover/launch-readiness`，可选 CLI `pnpm validate:discover-china-content`。
- 数据表：`content_categories`、`content_articles`、`content_sentences`、`content_review_workflow`。
- 状态逻辑：开发期最小 seed 只满足联调；W0 发布前必须使用正式内容包或 AI 工厂导入包通过本任务校验。
- 红线门槛：launch readiness 必须调用 DC-22 的红线规则引擎，按规则版本重新扫描 published 候选内容。
- TTS 门槛：正式内容包必须为每篇文章提供可播放 TTS、可重试生成状态或明确的阻断项；不能用缺失音频伪装通过 W0。

## 不明确 / 风险

- 风险：只实现 36 篇开发 seed 会让前后台功能可跑，但不满足 PRD 的 W0 上线内容验收。
- 处理：把“开发联调 seed”和“W0 内容上线门槛”分开验收，任何上线检查不得用 36 篇 seed 冒充 600 篇正式内容。

## 技术假设

- 正式内容可通过 ADC-08 后台导入或 `pnpm seed:from-file <path.json>` 导入，二者共用 DC-24 的统一 upsert 与校验逻辑。
- 本任务只定义校验能力与上线门槛，不要求在代码仓库内提交 600 篇正式内容正文。

## 最终验收清单

- [ ] 12 类目均有封面、主题色、4 语描述，且每类 published 文章 ≥ 50。
- [ ] 全库 published DC 文章总数 ≥ 600。
- [ ] 每篇文章都有标题、摘要、句子级正文、3-5 条关键点、HSK 标注、4 语翻译。
- [ ] 每篇句子包含中文、拼音、数字声调或可生成字段；每篇至少有 TTS 音频或明确的 TTS 占位状态。
- [ ] TTS 缺失、生成失败、音频私有对象缺失均进入 W0 校验报告并阻断对应文章发布。
- [ ] 红线检测 0 阻断项，母语审校通过率 100%。
- [ ] W0 校验报告列出红线规则版本、扫描时间、阻断项数量、警告项数量和人工确认人。
- [ ] 抽检每个类目至少 1 篇文章，可完成列表 → 详情 → 音频 → CTA → 搜索回流链路。