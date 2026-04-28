# 知语 Zhiyu · 战略规划文档总索引

> **项目**：知语 Zhiyu — 面向东南亚的本土化中文学习平台
> **流程**：bmad-brainstorming → bmad-domain-research → bmad-market-research → bmad-technical-research → bmad-product-brief
> **生成日期**：2026-04-25
> **执行模式**：自主模式（Autonomous / Yolo），AI 全权决策
> **语言**：所有文档使用中文输出
> **拆分规则**：单文件 ≤ 800 行，超限则拆分到子文件夹

---

## 一、文档结构

| 编号 | 模块 | 目录 | 关键产出 |
|:---:|---|---|---|
| 01 | 头脑风暴 | [`01-brainstorming/`](./01-brainstorming/00-index.md) | 100+ 创意、技法应用、收敛优先级、行动清单 |
| 02 | 领域研究 | [`02-domain-research/`](./02-domain-research/00-index.md) | 行业概览、趋势、政策合规、价值链、洞察 |
| 03 | 市场研究 | [`03-market-research/`](./03-market-research/00-index.md) | TAM/SAM/SOM、人群画像、竞品对标、定价、GTM、风险机会 |
| 04 | 技术研究 | [`04-technical-research/`](./04-technical-research/00-index.md) | 架构、前后端、AI 管线、数据模型、支付合规、反爬、SRS、游戏端 |
| 05 | 产品愿景纲要 | [`05-product-brief/`](./05-product-brief/00-index.md) | Executive Summary、问题、用户、愿景、MVP、商业模式、路线图、风险、指标、LLM 蒸馏 |

---

## 二、阅读顺序建议

1. **决策者 / 投资人**：直接看 [`05-product-brief/01-executive-summary.md`](./05-product-brief/01-executive-summary.md) → [`04-product-vision-strategy.md`](./05-product-brief/04-product-vision-strategy.md) → [`06-business-model.md`](./05-product-brief/06-business-model.md)
2. **产品 / 运营负责人**：先看 [`03-market-research/`](./03-market-research/00-index.md) → [`05-product-brief/`](./05-product-brief/00-index.md) → [`01-brainstorming/07-action-plan.md`](./01-brainstorming/07-action-plan.md)
3. **技术负责人 / 工程师**：直接进入 [`04-technical-research/`](./04-technical-research/00-index.md)，配合 [`05-product-brief/05-mvp-scope.md`](./05-product-brief/05-mvp-scope.md) 落地实现
4. **下游 PRD / 架构 Agent**：以 [`05-product-brief/10-llm-distillate.md`](./05-product-brief/10-llm-distillate.md) 作为单一上下文输入

---

## 三、关键决策摘要（AI 自主决策）

| 维度 | 决策 |
|---|---|
| 产品定位 | 东南亚母语本土化 + AI 一次性内容生产的中文学习平台 |
| 首发市场 | 越南 → 泰国 → 印尼（按市场容量与人口红利排序） |
| 商业模式 | 订阅会员（$4/月、$12/半年首发促销、$40/年）+ 单门类课程 $4/段 |
| 关键差异 | ① 母语原生（越/泰/印尼语）讲解 ② AI 一次性生成 + 永久分发 ③ 4 模块闭环（发现中国/系统课程/游戏/小说）④ 知语币 + 二级分销裂变 |
| 技术栈 | Vite+React+TS / Express+TS / Supabase（DB+Auth+Vector）/ LangGraph(TS) / Vercel AI SDK / Paddle |
| MVP 范围 | 直接做完整版（用户原话），1 个月内由 AI 工程师团队推进 |
| 关键风险 | ① 冷启动获客 ② 数据格式与多端展示一致性 ③ 内容质量与本地化精度 |

---

## 四、与现有资产的衔接

- 课程体系已就绪：[`/course/`](../course/00-index.md)（4 轨道 × 12 阶段 × 12 章 × 12 节 × 12 知识点）
- 文化内容已就绪：[`/china/`](../china/00-index.md)（12 类目，文章短文形式）
- 游戏规划已就绪：[`/games/`](../games/00-index.md)（12 款游戏，强制横屏）
- 小说规划已就绪：[`/novels/`](../novels/00-index.md)（12 类目，分篇章节形式）
- 推广方案已就绪：[`/research/`](../research/市场调研.md)（TikTok / Facebook / YouTube 三平台）

> 本套文档负责把上述"内容资产 + 已有想法" 沉淀为可执行的战略与技术蓝图，供后续 PRD、架构、Sprint 拆解使用。
