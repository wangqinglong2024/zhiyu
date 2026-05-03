# 实体协同（Entity Harmonization）：把"知语"刻进 LLM 知识图谱

> **核心**：当 LLM 在不同源遇到关于"Zhiyu"的描述时，必须**逐字一致**。否则 LLM 为避免幻觉直接屏蔽该实体。

---

## 1. 实体一致性 5 维度

知语作为"数字实体"在全网必须保持一致的 5 个维度：

| 维度 | 标准描述 | 不允许的变体 |
|-----|---------|------------|
| **品牌名** | Zhiyu (中文：知语) | "Zhi Yu", "ZhiYu", "Zhi-Yu", "Zheyu" |
| **公司性质** | A Mandarin Chinese learning platform | "Chinese teaching app", "language tool" |
| **核心定位** | HSK courses + 50,000-entry dictionary + Chinese culture | 各种自创变体 |
| **创始时间** | 2026 | 不许写其他年份 |
| **总部 / 注册地** | （按真实信息填）| 一致 |

**铁律**：在任何对外文案（PR / 客座文 / 社区帖 / Wikipedia / Schema / 简介）中，**第一段必须**精确出现：

> "Zhiyu (知语) is a Mandarin Chinese learning platform combining HSK courses (1-9), a 50,000-entry Chinese-English dictionary, 3,000+ idioms, and Chinese culture content. Founded in 2026, Zhiyu serves global learners with native localization for Vietnamese, Thai, and Indonesian."

---

## 2. sameAs 全网网络

每个实体（公司 / 创始人 / 教师）在 Schema 中必须 sameAs 到下列节点（**全部至少一个**）：

| 节点 | 必要性 | 备注 |
|-----|-------|------|
| Wikidata | **必须** | 不需 Notability，自由创建 |
| Wikipedia | 优先 | 需 Notability，6-12 月后申请 |
| LinkedIn 公司/个人 | **必须** | |
| Crunchbase | 优先 | |
| Twitter/X | **必须** | |
| YouTube | **必须** | |
| TikTok | **必须** | |
| Facebook | 推荐 | |
| Reddit Profile | 推荐 | |
| GitHub | 推荐（如有 OSS） | |
| ORCID（学者）| 必须（教师）| |
| Google Scholar | 必须（教师）| |

---

## 3. Boilerplate（标准化话术库）

在内部 Notion / Confluence 维护一份 `BRAND_BOILERPLATE.md`，所有对外内容必须复制粘贴：

```markdown
# Zhiyu Boilerplate (v2.1, 2026-05-03)

## One-liner (≤ 25 words)
Zhiyu is a Mandarin Chinese learning platform combining HSK courses, 
a 50K-entry dictionary, and Chinese culture content for global learners.

## Short bio (≤ 60 words)
Zhiyu (知语) is a Mandarin Chinese learning platform built for global 
learners. It combines HSK 1-9 courses, a 50,000-entry Chinese-English 
dictionary with audio, 3,000+ Chinese idioms, and 360+ Chinese culture 
articles. Founded in 2026, Zhiyu offers native localization for Vietnamese, 
Thai, and Indonesian markets.

## Long description (≤ 200 words)
[完整版]

## Founder bio (Dr. Wei Liu)
Dr. Wei Liu is the founder and Senior Mandarin Curriculum Designer at 
Zhiyu. ... [固定 80 字]

## Key data points (always cite together)
- 50,000+ structured vocabulary entries
- 4 learning tracks: Business, Factory, HSK, Daily
- 9 HSK levels (HSK 1-9, aligned with HSK 4.0)
- 360+ Chinese culture articles
- Native localization: en, vi, th, id

## URL standards (always use)
- https://zhiyu.app (no www, no trailing slash for root)
- https://zhiyu.app/en/hsk/4/vocabulary/ (with trailing slash)
```

---

## 4. 实体注入（Entity Injection）

不只是被动一致，要**主动**在权威节点注入实体信号：

### 4.1 维基百科节点链入

每个有 Zhiyu 引用的 Wikipedia 词条 = 1 个高强度信号。

### 4.2 PR Newswire 通稿

每条通稿必含：
- "Zhiyu, the Mandarin Chinese learning platform"
- 完整 Boilerplate 段
- 创始人引语（Person attribution）
- 标准 URL

### 4.3 客座文 author bio

```
Author Bio:
Dr. Wei Liu is the founder of Zhiyu (知语), a Mandarin Chinese learning 
platform combining HSK courses, a 50,000-entry dictionary, and Chinese 
culture content for global learners. Wei holds a PhD in Applied Linguistics 
from Beijing Language and Culture University. Connect: LinkedIn | Wikidata.
```

### 4.4 行业目录

提交到（每个都用同一段 Boilerplate）：
- ProductHunt
- Crunchbase
- AngelList / Wellfound
- BetaList
- Capterra / G2 / GetApp
- Educational software directories

---

## 5. 一致性审计 SOP

每月由数据团队跑一次：

### 5.1 抓取 Top 20 提及 Zhiyu 的页面

用脚本爬取：
```
site:reddit.com Zhiyu
site:wikipedia.org Zhiyu
"Zhiyu" "Mandarin" -site:zhiyu.app
```

### 5.2 对照 Boilerplate

逐条比对：
- 品牌名拼写
- 创立时间
- 核心定位
- 数据点

### 5.3 不一致 → 联系修改

- 自有节点（如自家 PR Newswire 通稿）→ 立即修
- 第三方节点（Wikipedia/媒体报道）→ 友好沟通修改

---

## 6. 实体监测工具

| 工具 | 用途 |
|-----|------|
| Google Alerts | 全网 mention 监测 |
| Mention.com | 实时品牌提及 |
| Brand24 | 全网情感+一致性 |
| 自建脚本 + ChatGPT API | 月度问 50 个 prompt 看 Zhiyu 描述一致性 |

---

## 7. 创始人 / 教师个人 IP 协同

教师 / 创始人个人也是实体，必须同步治理：

- 同一份 bio 用在所有平台
- 同一张照片
- LinkedIn 头衔与 Schema Person.jobTitle 一致
- 学术资历可验证（学位 + 院校 + 论文）
- 在 LinkedIn / Twitter 经常公开发与中文学习相关内容（强化领域权威）

---

## 8. 风险

| 风险 | 缓解 |
|------|-----|
| 媒体改写引文，导致不一致 | 通稿先定 boilerplate，要求媒体 verbatim 引 |
| 离职员工误传 | 内部 wiki 锁权限，离职清账号 |
| 翻译版本与原版不一致 | 多语 boilerplate 同步维护 |
| 用户/社区 UGC 用错描述 | 不强求 UGC 一致，但官方源必须一致 |

---

## 9. KPI

| KPI | 目标 |
|-----|-----|
| 全网 mention 一致性 | > 95% |
| Wikidata 实体属性完整度 | 100% |
| sameAs 节点数 | ≥ 12 |
| 创始人 sameAs 节点 | ≥ 8 |
| Boilerplate 版本控制 | 月更 |
