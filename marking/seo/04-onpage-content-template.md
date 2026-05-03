# On-Page 内容模板：5 大页面类型双工友好规范

> **核心**：每个模板都同时满足 Google E-E-A-T 与 LLM RAG 抽取要求。
>
> **铁律**：BLUF 短答 + 表格 + FAQ + 时间戳 + 作者署名 + 内链 + Schema → 缺一不可。

---

## 模板 1：HSK 词条页 / 单字页（Programmatic 主力，5 万 +）

### 信息架构

```
┌─────────────────────────────────────────────┐
│  H1: [汉字] (pinyin) — meaning, examples,   │
│      stroke order | HSK [N] | Zhiyu         │
├─────────────────────────────────────────────┤
│  BLUF 段（40-60 字）：                       │
│  "[汉字] (pinyin) means [definition].       │
│  It is a HSK [N] [词性] commonly used in    │
│  [场景]. Last verified May 2026."           │
├─────────────────────────────────────────────┤
│  📊 Quick Facts Table                       │
│  | Pinyin | Tone | Radical | Strokes |     │
│  | HSK Level | Frequency Rank | Type |      │
├─────────────────────────────────────────────┤
│  H2: Meaning & Usage                        │
│    定义 + 3 个语义                           │
├─────────────────────────────────────────────┤
│  H2: Stroke Order & Writing                 │
│    动画 / SVG 笔顺 + 文字描述                │
├─────────────────────────────────────────────┤
│  H2: Example Sentences (5+ 含音频)           │
│    Chinese / Pinyin / English (表格)        │
├─────────────────────────────────────────────┤
│  H2: Common Words Containing [汉字] (10+)    │
│    内链到词组页                              │
├─────────────────────────────────────────────┤
│  H2: Etymology & Cultural Context           │
│    字源 / 甲骨文 / 文化注解                  │
├─────────────────────────────────────────────┤
│  H2: Frequently Asked Questions (FAQ)       │
│    Q1: How is [汉字] different from [近形]? │
│    Q2: Is [汉字] simplified or traditional? │
│    Q3: ...                                  │
├─────────────────────────────────────────────┤
│  H2: Practice Quiz [interactive]            │
├─────────────────────────────────────────────┤
│  Author: [name + LinkedIn + Wikidata]       │
│  Last Updated: May 1, 2026                  │
│  Sources: [3 个权威外链]                     │
└─────────────────────────────────────────────┘
```

### Schema 要求
- DefinedTerm + BreadcrumbList + FAQPage + Quiz（可选）

### 关键 SEO 元素
- Title: `[汉字] (pinyin): Meaning, Stroke Order & Examples | HSK [N]`
- Meta Desc: 含主关键词 + 数字 + CTA
- 至少 5 张图（笔顺 + 字源 + 例句卡）
- 内链：3-7 条（同 HSK 等级其他词、相关词组、HSK 测试入口）

---

## 模板 2：成语典故页（GEO 蓝海）

### 信息架构

```
H1: [成语] (pinyin) — Chinese Idiom Meaning, Story & Modern Use
BLUF: "[成语] literally means '[字面]' and is used to describe [现代含义]. 
       It originates from [典故来源, 朝代]."

Table: Quick Reference
| 拼音 | 字面 | 释义 | 出处 | HSK | 同义/反义 |

H2: Literal Meaning (字面 vs 引申)
H2: The Story Behind (历史典故 + 主角 + 朝代 + 翻译完整故事)
H2: Modern Usage (3 个现代场景 + 例句)
H2: Similar Idioms (近义 + 反义对比表)
H2: How to Use [成语] in a Sentence
H2: FAQ
H2: Practice
Sources: 古籍 + Wikipedia + 学术论文
```

### 为什么这是金矿

- 英文世界几乎无人系统做成语数据库（仅有 ChineseIdiomGuide 等小站）
- 故事性强 → Reddit/Twitter 易传播
- AI 引擎在 `chinese idiom for X` 类查询的引用源**严重稀缺**
- 3000+ 成语 = 天然 Programmatic SEO 资产

---

## 模板 3：文化长文（"发现中国" 360 篇）

### 信息架构

```
H1: [主题] - A Complete Guide for [年份]
BLUF: "Mid-Autumn Festival (中秋节) is China's second-largest traditional 
       holiday, celebrated on the 15th day of the 8th lunar month. 
       In 2026, it falls on September 25."

📋 Table of Contents (跳转锚点)

H2: What is [主题]? (定义 + 历史 + 重要性)
H2: Origin & History (按朝代时间轴)
H2: How It's Celebrated Today (习俗清单)
H2: Foods, Symbols & Traditions (表格)
H2: Regional Differences (地图 + 各地差异)
H2: Modern Pop Culture & Global Influence
H2: How to Experience It (旅游/体验建议)
H2: FAQ (10+ 问题)
H2: Related Articles (内链 5+)
H2: Quick Quiz

Cited Sources: 学术 + 政府 + 主流媒体
Author: 知语文化编辑组（含 Wikidata sameAs）
Last Updated: ...
```

### 长度建议
- 1500-3000 词（深度足够，但不灌水）
- 每 200 词必含 1 个事实/数据点
- 每篇 ≥ 5 张原创图

---

## 模板 4：课程介绍页（转化页）

### 信息架构

```
H1: [Track] Mandarin Course — [价值主张] | Zhiyu
BLUF: "Zhiyu's [Track] Mandarin course teaches [核心价值] through 
       [N] interactive lessons with [特色]. Free to start."

🎯 What You'll Learn (5-7 项 outcome)
👥 Who This Is For (3 个画像)
📊 Course Outline (12 阶段表格)
🎓 Your Instructors (Person Schema 全配)
💰 Free vs Pro (定价对比)
⭐ Reviews & Ratings (AggregateRating Schema)
❓ FAQ
🚀 CTA: Start Learning Free

Schema: Course + AggregateRating + Person + FAQPage
```

### CRO 要点
- 首屏必含 CTA（按钮 + 评分 + "Free to start"）
- 2-3 个真实用户评价（VideoObject 优先）
- 风险逆转：30-day money-back guarantee

---

## 模板 5：vs / 评测页（高商业价值）

### 信息架构

```
H1: Zhiyu vs Duolingo for Learning Chinese: A 2026 Honest Comparison
BLUF: "For HSK preparation and Chinese characters, Zhiyu offers 
       [优势]. For gamified casual learning, Duolingo remains 
       [对方优势]. Here's our 2026 head-to-head."

📊 At-a-Glance Comparison Table (15+ 维度)
H2: Methodology (我们如何评测 — 透明)
H2: HSK Preparation (谁更好 + 截图 + 数据)
H2: Character Writing (...)
H2: Pronunciation Tools (...)
H2: Pricing
H2: User Reviews Summary
H2: Verdict: Which Should You Choose? (诚实推荐, 不一味贬低对手)
H2: FAQ

Sources: 第三方评测 + 官网截图 + 用户调研
```

### 关键原则
- **诚实**：诚实标注对方优势 → Helpful Content 友好 → AI 引擎更愿引用
- **数据驱动**：每个维度给数字，不空喊"更好"
- **可验证**：截图 + 时间戳 + 测试条件

---

## 通用规范（5 大模板共用）

### 1. BLUF 短答规范
- 40-60 字
- 在 H1 下第一段
- 含主关键词 + 核心定义 + 时间戳
- 不包含营销词（"best"、"amazing" 禁用）
- LLM 抽取测试：把 BLUF 复制到 ChatGPT 问"这是关于什么的？"，应能 100% 识别

### 2. 事实密度规范
- 每 80-150 词 ≥ 1 个可验证事实（数字/日期/引用）
- 每个主要断言后跟 [Source: xxx]（外链或脚注）

### 3. 时间戳规范
- 页面顶部右上角显示 "Last Updated: [Date]"
- HTML meta `<meta name="article:modified_time" content="2026-05-01T00:00:00Z">`
- Schema `dateModified` 同步
- 每季度审计、强制刷新（详见 [../geo/08-freshness-update-cadence.md](../geo/08-freshness-update-cadence.md)）

### 4. 作者署名规范
- 每篇文章必须 1 个真实作者（不允许 "Admin"）
- 作者页 indexable，含：照片、bio、资历、文章列表、LinkedIn/Wikidata sameAs
- Schema Person 嵌入 + 文章 author 引用

### 5. 内链规范
- 每页 3-7 条上下文内链（不要导航式）
- 锚文本含目标关键词（不要 "click here"）
- 优先链向 Hub / Pillar 页（汇集权重）

### 6. 图片规范
- 文件名含关键词：`mid-autumn-festival-mooncake.webp` 而非 `IMG_001.jpg`
- alt 文字描述图片内容（不堆关键词）
- 用 `<Image>` + width/height + priority（首屏图）
- 格式 webp/avif，懒加载（除首屏外）

### 7. 视频规范
- 嵌入页面顶部（VideoObject Schema）
- 必含 transcript（折叠可见，不放 fallback）
- 章节时间码 + thumbnail + uploadDate
- 同步上传 YouTube + Bilibili（多端实体一致）

### 8. FAQ 规范
- 每页 5-10 问
- 用真实用户问题（来自 GSC / Reddit / Quora）
- 答案 50-150 字（短答易抽取）
- FAQPage Schema 必加

---

## On-Page Checklist（编辑发文前必跑）

```markdown
- [ ] H1 唯一，含主关键词
- [ ] BLUF 段在 H1 后立即出现，40-60 字
- [ ] 至少 1 个 Quick Facts 表格
- [ ] 至少 5 个 H2，3-5 个 H3
- [ ] 关键词密度 0.5%-1.5%（自然）
- [ ] 内链 3-7 条
- [ ] 外链 ≥ 3（权威源）
- [ ] 图片 ≥ 3，全部带 alt + width/height
- [ ] FAQ Schema + Article Schema
- [ ] 作者署名 + Person Schema + sameAs
- [ ] Last Updated 显示 + dateModified Schema
- [ ] Open Graph 图（1200×630）
- [ ] hreflang 标签（如多语言）
- [ ] 移动端预览正常
- [ ] CWV PageSpeed > 90
- [ ] Schema Validator 0 错误
```
