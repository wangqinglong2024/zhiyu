# 各 AI 引擎差异化打法

> **核心**：把"AI 引擎"当一个黑盒最致命。各引擎引文重合度仅 ~11%，必须分别优化。

---

## 1. ChatGPT Search / SearchGPT

### 1.1 引擎特性
- **底层**：OpenAI 自有 RAG + Bing 搜索结果
- **引用源偏好**：可归属（attributable）来源、详实事实、分段良好
- **MAU**：1.8 亿+（搜索专项）
- **广告化进度**：2026 已对 Free/Go 用户开广告，CPM ~$60，门槛 $200K

### 1.2 优化要点
- BLUF + H2 后第一句直接答（详见 [03-content-bluf-semantic-chunking.md](./03-content-bluf-semantic-chunking.md)）
- robots.txt 放行 GPTBot + ChatGPT-User + OAI-SearchBot
- 嵌入第三方权威引用（Wikipedia / Bing 排名前 10 的站点）
- 每段保持 ≥ 1 事实

### 1.3 测试 prompt 示例
- "What's the best app to learn HSK 4 vocabulary in 2026?"
- "How do I write 学 in Chinese stroke by stroke?"
- "Compare Duolingo and HelloChinese for Mandarin"

---

## 2. Perplexity

### 2.1 引擎特性
- **底层**：自研 RAG + 多模型（GPT/Claude/Sonar）
- **引用源偏好**：新鲜度 + 表格密度 + FAQ Schema
- **MAU**：2000 万+
- **广告化**：2026.02 永久放弃广告 — **GEO 战场最干净**
- **特色**：Publisher Program（80% 订阅分润给被引用源）

### 2.2 优化要点
- 首 100 字必给声明式答案
- 表格化属性（拼音/词性/HSK 等级/例句）
- 显式 Last-Updated 时间
- 申请加入 Perplexity Publisher Program（条件：原创内容、月引用 > 阈值）

### 2.3 测试 prompt
- "I want to learn Mandarin from scratch in 6 months. What's a realistic plan?"
- "What are the differences between simplified and traditional Chinese characters?"

---

## 3. Google AI Overviews / Gemini

### 3.1 引擎特性
- **底层**：Gemini + Google Search 索引
- **引用源偏好**：E-E-A-T + Schema + Person/Organization 标记
- **覆盖**：25.5% Google AIO 含广告（2026），覆盖 70% 高商业意图查询
- **特殊**：Gemini 3 与传统 Top 10 重合度 < 30%

### 3.2 优化要点
- 完整 Schema（Course/Article/FAQ/Person/Organization）
- 作者署名 + Wikidata sameAs
- 显式时戳 "as of Q2 2026"
- 内容必须满足 Helpful Content（不堆 SEO 套路）
- 多媒体（图 + 表）增加 Rich Result 触发

### 3.3 测试 prompt
- "best free Mandarin learning app"
- "HSK 4 vocabulary list pdf"
- "中秋节 2026 date"

---

## 4. Anthropic Claude

### 4.1 引擎特性
- **底层**：Claude 3.7+ Sonnet/Opus
- **引用源偏好**：机构来源（政府、学术、主流媒体），过滤 SEO 模板
- **特色**：偏严谨，对营销话术零容忍

### 4.2 优化要点
- 学术/政府引用优先（教育部、Hanban、北语）
- 作者资历可验证（Wikidata + ORCID + Scholar）
- 写作风格学术化（不要"the best"、"amazing"）
- 在 YMYL/教育内容中尤其重要

### 4.3 测试 prompt
- "What's the academic consensus on Chinese tone acquisition for adult English speakers?"
- "Cite peer-reviewed studies on HSK validity"

---

## 5. Microsoft Copilot

- 底层 = Bing + GPT-4o
- 优化策略 ≈ ChatGPT + Bing SEO
- robots 放行 BingBot + OAI 系列
- 加 IndexNow 推送（瞬时索引）

---

## 6. 字节豆包 / 文心一言 / 通义千问

- 中文 LLM 在东南亚华裔市场有份额
- 优化要点：
  - Bytespider 放行
  - 简体中文页面充分（Zhiyu 本来就有）
  - 在国内 SEO（百度系）协同优化（虽然知语主战场海外，但东南亚华裔用百度）

---

## 7. DeepSeek / Kimi / Qwen 等开源 / 中国系

- 多数走 Bing 索引或自研爬虫
- 至少 robots 放行所有标识中文 LLM 的 UA

---

## 8. AI 引擎适配优先级

| 引擎 | 占用资源 | ROI | 优先级 |
|------|---------|-----|-------|
| ChatGPT Search | 30% | 高 | P0 |
| Perplexity | 20% | 极高（无广告） | P0 |
| Google AI Overviews | 25% | 高 | P0 |
| Claude | 10% | 中（学术受众） | P1 |
| Gemini App | 5% | 中 | P1 |
| Copilot | 5% | 中 | P1 |
| 中文 LLM 系 | 5% | 中（东南亚华裔）| P2 |

---

## 9. 关键差异速查表

| 维度 | ChatGPT | Perplexity | AI Overviews | Claude |
|-----|---------|-----------|------------|--------|
| 偏好引用源 | 平衡 | 新鲜度高 + 表格 | E-E-A-T 强 | 学术/机构 |
| 营销话术容忍度 | 中 | 低 | 中 | **极低** |
| Schema 重要性 | 中 | 高 | **极高** | 中 |
| 时间戳 | 中 | **极高** | 高 | 中 |
| 第三方引用 | 高 | 中 | 中 | **极高** |
| 广告冲击 | 大 | **无** | 大 | 无 |

---

## 10. 通用 vs 差异化

**通用动作**（一次做全引擎收割）：
- BLUF
- 表格 + FAQ
- Schema 全套
- 时间戳
- Wikipedia/Reddit 实体节点

**差异化动作**（针对单引擎）：
- Perplexity：申请 Publisher Program + 强化新鲜度
- Claude：增加学术引用 + 减少营销词
- AI Overviews：完美 Schema + 多媒体
- ChatGPT：增加 Bing 排名 + 第三方引用密度

---

## 11. 适配测试矩阵

详见 [10-prompt-testing-matrix.md](./10-prompt-testing-matrix.md)，每个引擎跑 200 prompt。
