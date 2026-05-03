# GEO 总策略：让 AI 把"知语"写进答案

> **核心命题**：在 2026 年，**用户问 AI "最好的中文学习 APP" 时，AI 第一个推荐的名字 = 这个赛道的赢家**。我们要让那个名字是 Zhiyu。

---

## 1. GEO 是什么、不是什么

| GEO 是 | GEO 不是 |
|-------|---------|
| 让 AI 在生成答案时**引用**你的网站/品牌 | 让 AI 把你"加进训练数据"（你做不到，OpenAI 决定） |
| 一种**多渠道**信任工程（自有站 + 第三方） | 单纯改改官网就能搞定的事 |
| 与 SEO **共用底层基建**的营销升级 | 与 SEO 互斥的"新流派" |
| **波动性 5x 于 SEO** 的高风险高回报赛道 | "做了就稳赚"的成熟营销 |
| **6-12 周**就能见效的快速通道 | 一蹴而就的银弹 |

---

## 2. 三道护城河（这是知语的战略基石）

### 护城河 1：实体协同（Entity Harmonization）

**定义**：确保"知语 / Zhiyu"这个数字实体，在全网每一个高权重节点（自有站、维基、Reddit、Quora、PR、YouTube）的描述完全一致。

**为什么是护城河**：
- LLM 见到不一致信息会**直接屏蔽该实体**避免幻觉
- 一旦在 50+ 节点形成一致信号 → LLM 训练 + RAG 双重收割
- **竞品想瓦解需要重写所有节点**，几乎不可能

详见 [07-entity-harmonization.md](./07-entity-harmonization.md)

### 护城河 2：5 万结构化词条 + 360 文化长文的语料密度

**定义**：用知语的天然内容资产生成全网最高密度的"中文学习事实块"。

**为什么是护城河**：
- 一个词条页 = 1 个"事实原子"，AI 引擎眼里的最优引用源
- 5 万词条 = LLM 做 RAG 时几乎绕不开的语料层
- 竞品要追上需 12 个月以上

### 护城河 3：东南亚母语本地化的不对称优势

**定义**：5 万知识点天然带越南语 / 泰语翻译 → AI 引擎在 vi/th 语种 GEO 几乎零竞争。

**为什么是护城河**：
- Duolingo 在东南亚弱
- vi-VN / th-TH 的 Perplexity / ChatGPT 用户在 2026 H2 暴增
- 知语在这两个市场是 GEO **天然垄断者**

---

## 3. 关于"广告会不会让 GEO 白费"的最终回答

**结论**：不会，且广告反而是 GEO 的乘法器。

| 论据 | 数据 / 依据 |
|------|------------|
| **Perplexity 永久无广告** | 2026.02 OpenAI 系决策；2000 万+ MAU 是纯自然流量池 |
| **AI 广告 + 自然引用 = 91% CTR 提升** | 2026 行业研究；自然 GEO 是付费乘法器 |
| **AI 引用流量转化 14.2% vs 传统 2.8%** | 单条 AI 引用 ≈ 5 条传统点击 |
| **黄金窗口 6-12 个月** | 广告全量化前的信任沉淀期，沉淀进 LLM 语料层不可逆 |
| **Sponsored Citations 不可能买全部位置** | 一个查询有 3-5 个引用位、广告主只能买 1-2 个 |

> **战略含义**：知语的 GEO 不是"防御广告"，而是"占领广告打不到的位置"——比如 Perplexity 全部、ChatGPT 长尾问、Claude 全部。

---

## 4. 关于"传统运营能不能做 GEO"的最终回答

**结论**：分层。技术护城河存在，但运营层可经过培训胜任。

| GEO 工种 | 是否需技术 | 知语怎么做 |
|---------|----------|----------|
| 站内技术改造（SSR/Schema/llms.txt） | 必须工程师 | 1 个 Next.js 工程师专职 |
| BLUF + 语义分块改写 | 内容编辑可（培训 1 周） | 模板 + 培训手册 + 抽样 review |
| 第三方平台分发（Reddit/Quora/YT） | 运营可（培训 + SOP） | 详见 [04-citation-platforms-reddit-wikipedia.md](./04-citation-platforms-reddit-wikipedia.md) |
| Wikipedia 词条编辑 | 需懂规则（NPOV / 引用） | 外包给专业 Wiki Editor 或培训 1 人 |
| Prompt 测试 + 引用监测 | 必须工程化 | 用 Python 脚本批跑（详见 [09-ai-citation-monitoring.md](./09-ai-citation-monitoring.md)） |
| 数据报告撰写（Linkable Asset） | 数据分析 + 写作 | 营销负责人 + 数据 1 季度 1 篇 |

---

## 5. 关于"零赞内容能否被 AI 引用"的最终回答

**结论**：完全可以，且这正是 GEO 与社交算法的根本差异。

数据（YouTube 被 AI 引用视频特征统计）：
- **40.83%** 播放量 < 1000
- **36%** 点赞 < 15
- **35%** 频道订阅 < 10000

**含义**：知语在第三方平台（YouTube/Quora/Medium/Reddit）发硬核教学内容时，**不要为社交算法写**（不要堆 hashtag、不要标题党、不要 hook），要"事实优先 + 数据嵌入 + 实体一致"。

---

## 6. GEO 优先级矩阵（资源怎么投）

```
              引用价值高 ↑
                  │
   Perplexity     │     ChatGPT
   (Tier 1)       │     (Tier 1)
   纯自然，必抢    │     全球流量最大，必抢
                  │
   ─────────────  ┼  ─────────────
   引用难度低         引用难度高
                  │
   Claude         │     Google AI Overviews
   (Tier 2)       │     (Tier 1)
   学术/政府偏好   │     占 SERP 70%
                  │
                  ↓
              引用价值低
```

**资源分配**：ChatGPT + Perplexity + Google AI Overviews 共占 70% 精力，Claude + Gemini + Copilot + 豆包共 30%。

---

## 7. GEO 与 SEO 的协同表

| 资产 | SEO 用 | GEO 用 |
|-----|-------|-------|
| BLUF 短答 | Featured Snippet | RAG 抽取首选 |
| Schema | Rich Result | 实体识别锚 |
| llms.txt | - | AI 爬虫快速通道 |
| Wikipedia | DR 95 外链 | 实体网络锚点 #1 |
| Reddit AMA | 社交流量 | AI 引用源 #2（占 40%） |
| YouTube 字幕 | YouTube SERP | AI 引用 |
| 数据报告 | Linkable Asset | LLM 引用首选 |
| 作者 sameAs | E-E-A-T | 实体协同 |
| Last Updated | Freshness | RAG 优先 |
| 多语言 | 多语 SERP | 多模型多语种引用 |

**结论**：90% 的 SEO 工作 = GEO 工作。GEO 与 SEO 团队不分家。

---

## 8. 风险预警

| 风险 | 缓解 |
|------|-----|
| LLM 微调，引用份额周级别波动 | 分散到多平台、多内容形态、不依赖单一引擎 |
| ChatGPT 广告全量化挤压自然位 | 进入 Perplexity / Claude 等无广告池 + 黄金窗口期内沉淀语料 |
| Wikipedia 条目被删 | 严格遵守 Notability + Reliable Sources 规则 |
| Reddit 算法封品牌账号 | 用真实编辑账号 + 长期价值贡献 + 不刷链接 |
| 第三方平台政策变（如 Perplexity 收购、政策变） | 多平台分散；每月扫描各平台政策更新 |
| LLM 训练数据截断后再无机会进训练集 | 持续做 RAG 友好的实时检索（不依赖训练数据） |
| 合规风险（虚假宣传/夸大） | 所有数据可验证、教师资质可查 |

---

## 9. 90 天 GEO 战略路线图

```
W1-2  地基   llms.txt + 全 Schema + Cloudflare 放行 AI Bot
W3-4  改写   20 篇高优先级页 BLUF + 语义分块改写
W5-6  外播   Reddit AMA + Wikipedia 词条 + Quora 100 答
W7-8  视频   YouTube 30 条 + TikTok 90 条 + 全字幕
W9-10 矩阵   200 prompt 测试矩阵搭建 + 周报
W11-12 协同  全网实体一致性审计 + 数据报告 PR
W13   复盘   AI 引用率突破 30% prompt 覆盖
```

详见 [12-90day-execution-plan.md](./12-90day-execution-plan.md)
