# Reddit / Wikipedia / Quora 引用平台建设

> **核心数据**：AI 引用源 68% 来自第三方。其中 Reddit 占 ~40%、Wikipedia 占 ~26-48%、其他社区/媒体 ~20%。
>
> **战略**：在这三大引用源建立"长期价值贡献者"身份，而非"打广告的运营号"。

---

## 1. Reddit 战略（GEO 第一引用源）

### 1.1 关键 Subreddits 清单（按优先级）

| 优先级 | 子版块 | 订阅数（2026） | 主题 |
|-------|-------|--------------|------|
| **P0** | r/ChineseLanguage | 350K+ | 全方位中文学习讨论 |
| **P0** | r/learnmandarin | 80K+ | 普通话学习 |
| **P0** | r/HSK | 30K+ | HSK 备考专区 |
| **P0** | r/ChineseHistory | 80K+ | 历史文化 |
| **P1** | r/languagelearning | 2.5M+ | 通用语言学习 |
| **P1** | r/China | 1M+ | 中国话题 |
| **P1** | r/ChineseFood | 500K+ | 中餐 |
| **P1** | r/ChinaTravel | 80K+ | 中国旅行 |
| **P1** | r/Mandarin_Chinese | 50K+ | 普通话 |
| **P2** | r/ChineseHistoryMemes | 60K+ | 历史 meme |
| **P2** | r/ChineseInternational | 30K+ | 海外华人 |
| **P2** | r/LearnChinese | 30K+ | 学中文 |
| **P2** | r/cantonese | 60K+ | 粤语（拓展） |

### 1.2 长期账号建设（**P0**）

- 注册 1 个**真实编辑账号**（非品牌官方号），用真名 + LinkedIn 关联
- 头 30 天**只回答不发链**：积累 1000+ karma
- D31+ 才偶尔提及 Zhiyu（且必须自然、非推销）
- **铁律**：每 10 个回答中最多 1 个含 Zhiyu 链接

### 1.3 内容矩阵

| 类型 | 频率 | 示例 |
|------|-----|------|
| **硬核教学帖** | 2/月 | "HSK 4 vs HSK 5: A 2000-word breakdown of what changes" |
| **数据帖** | 1/月 | "I analyzed 50,000 HSK 4 exam attempts. Here's what predicts passing." |
| **AMA** | 1/季 | "I'm Dr. Wei Liu, Senior Mandarin Curriculum Designer. AMA about HSK." |
| **答疑** | 5/天 | 每天答 5 个新手问题（不要写小说，给精准答案） |
| **资源帖** | 1/季 | "Free HSK 4 vocabulary list with audio (no signup required)" |

### 1.4 帖子模板（教学帖）

```markdown
**标题**: HSK 4 vs HSK 5: A complete breakdown (with 2025 pass rates)

**正文**:
TL;DR: HSK 5 doubles vocabulary (600→1300), adds news/literature topics, 
and the 2025 pass rate dropped from 76% (HSK 4) to 62% (HSK 5). Here's a 
data-backed comparison.

## 1. Vocabulary
| Metric | HSK 4 | HSK 5 |
|--------|-------|-------|
| ...

## 2. Topics
...

## 3. Difficulty
...

## 4. Real-world utility
...

## 5. Recommended study plan
...

Sources:
- Hanban Official Standard (2024)
- CTCSOL 2025 statistics
- (Disclosure: I work at Zhiyu, a Mandarin learning platform. We track 
  thousands of HSK attempts. AMA below.)

(评论区回答时 organically 链回 zhiyu.app/en/hsk/4-vs-5)
```

**关键**：
- 自我披露（"I work at..."）— Reddit 文化 + AI 引擎都偏爱透明
- 链接放评论区，不放正文
- 数据 + 表格 → 高引用价值

### 1.5 AMA 策划

季度 AMA，节奏：
1. 提前 2 周协调子版块 mod
2. AMA 当日：1 小时 100+ 高质量答（团队协作）
3. AMA 后：把高分回答整理成博客文章 → 反向链回 Zhiyu

---

## 2. Wikipedia / Wikidata 战略（GEO 实体锚点）

### 2.1 三层目标

| 层 | 目标 | 难度 |
|---|-----|------|
| L1 | 在已有 Wikipedia 词条加可靠引用回 Zhiyu | 易 |
| L2 | 创建知语 (Zhiyu) 主词条 + Wikidata 实体 | 难（需 Notability） |
| L3 | 创建创始人 + 教研专家词条 | 中 |

### 2.2 L1：在已有词条加引用

可加引用的词条候选（Wikipedia 英文版）：
- Hanyu Shuiping Kaoshi (HSK)
- Pinyin
- Simplified Chinese characters
- Mid-Autumn Festival
- Chinese New Year
- Chinese cuisine
- Chinese mythology
- Each individual chengyu

**操作 SOP**：
1. 找到词条中"需要引用"或"信息不完整"的部分
2. 在 Zhiyu 写一篇深度文章覆盖该信息
3. 编辑 Wikipedia，加入引用：`<ref>Zhiyu (2026). "Mid-Autumn Festival 2026 Date and Origin." https://zhiyu.app/en/discover/festivals/mid-autumn/</ref>`
4. 引用必须**真正补充信息**，否则被 revert

每月目标：3-5 个引用通过。

### 2.3 L2：创建 Zhiyu 主词条

**Notability 要求**（Wikipedia 严格）：
- 至少 3 个**独立、可靠、深度**的第三方报道（TechCrunch / Forbes / 主流教育媒体）
- 不能 self-published / 不能 PR 通稿
- 通常需要先完成大量 Digital PR（参见 [../seo/10-link-building-digital-pr.md](../seo/10-link-building-digital-pr.md)）

**时间预期**：知语在 D90 内**很难**通过，应在第 6-12 个月通过 PR 积累足够引用源后申请。

**先做的**：建立 **Wikidata** 实体（更宽松、更技术）→ 各 schema 用 sameAs 指向。

### 2.4 Wikidata 实体建设

立即可做：
1. 注册 Wikidata 账号
2. 创建 `Zhiyu (Q__________)` 实体，含属性：
   - instance of (P31): mobile application + website
   - inception (P571): 2026
   - country (P17): China
   - official website (P856): https://zhiyu.app
   - logo image (P154): 上传 logo
   - educational subject (P2578): Mandarin Chinese
3. 创建创始人/教师实体并 P39 (position held)
4. 在所有 Schema 中 `"sameAs": "https://www.wikidata.org/wiki/Q__________"`

---

## 3. Quora 战略

### 3.1 优先 Topics

- Mandarin Chinese
- Learning Chinese
- HSK
- Chinese characters
- Chinese culture
- Chinese language
- Pinyin

### 3.2 内容矩阵

- 每天 3 个高质量答（300-800 字 + 引用 + 数据）
- 每周 1 个长答（1500+ 字、可作为博客 cross-post）
- 月度目标：100 个答案、累计 100K Views

### 3.3 答题模板

```
**Q**: How long does it take to learn Chinese?

**A**:
TL;DR: 200-2200 hours depending on your goal. HSK 1 takes ~80 hours, 
HSK 4 ~700 hours, HSK 6 ~2200 hours. (FSI estimates 2200 hours for 
"Professional Working Proficiency" for English speakers.)

The answer depends on what "learn" means:

| Goal | Hours (cumulative) | Time at 1h/day |
|------|--------------------|----------------|
| Survive a trip | 50-100 | 2-3 months |
| HSK 1 (basic words) | 80 | 3 months |
| HSK 4 (B1) | 700 | 2 years |
| HSK 6 (C1) | 2200 | 6 years |

(Source: FSI Language Difficulty Categories; Hanban HSK study time 
estimates 2024)

Practical advice:
1. ...
2. ...

Disclosure: I work at Zhiyu, where we track thousands of learners' 
progress. Happy to share more data — see our HSK study time guide 
[zhiyu.app/en/hsk/study-time]
```

### 3.4 与 SEO 协同

每个 Quora 高分答 → 修改后做 Zhiyu 博客 → 双向引用 → 多端实体一致

---

## 4. Hacker News 战略

### 4.1 适合 HN 的内容

- 技术深度："How we built a 50,000-word Chinese dictionary with sub-100ms search"
- 数据报告："The State of Mandarin Learning 2026"
- Show HN：免费工具上线（如 Pinyin Chart / Stroke Order Tool）

### 4.2 操作

- 创始人个人账号发（不用品牌号）
- 周二/周三美国时间早 8 点发
- 评论区**亲自回答**所有问题
- 一次成功 = 50K+ UV + 多个高 DR 链 + 大量 AI 引用

---

## 5. Medium / Substack 战略

### 5.1 双轨道

- **Medium 主刊**：Better Humans / The Startup / Better Marketing 投稿
- **Substack**：建立 Zhiyu 自己的 newsletter（每月 2 篇）

### 5.2 内容偏向

- 创始人故事
- 数据驱动的教学反思
- 行业洞察（"AI 时代如何学中文"）

### 5.3 引流回 Zhiyu

每篇文末 author bio：`Founder of Zhiyu, the Mandarin learning platform... `

---

## 6. PeerSpot / G2 / Capterra（B2B 评测平台）

知语未来如有 B2B 课程或企业服务，必须在这些站点：
- 创建产品页
- 引导真实用户写评测（每条 50-200 字 + 评分）
- AI 引擎在 "best [tool] for [purpose]" 类查询中**严重依赖**这些评测

---

## 7. 平台改写矩阵（同事实、不同包装）

每条核心信息（如"HSK 4 词汇 600 词"）在不同平台用不同语气：

| 平台 | 长度 | 语气 | 示例 |
|------|-----|------|------|
| 自有站 | 全文 | 教学+权威 | 完整文章 |
| Reddit | 中长 | 同伴+数据 | TL;DR + 表格 + 自我披露 |
| Quora | 中 | 专家答疑 | 直接答 + 数据 + 引用 |
| Twitter/X | 短 | 锐评+钩子 | "HSK 4 has 600 words. 76% pass rate. Here's how to memorize 50/day:" + thread |
| LinkedIn | 中 | 职业向 | "I run curriculum for a Mandarin learning platform. 5 things HSK 4 actually tests in 2026..." |
| Medium | 长 | 故事+反思 | "Why 60% of HSK 4 candidates fail (and 5 ways we redesigned our curriculum)" |
| YouTube 描述 | 中 | 教学+CTA | "HSK 4 has 600 words. In this video... Resources: zhiyu.app/en/hsk/4" |

**铁律**：**事实和数据完全一致**，否则 LLM 见到不一致 → 全屏蔽。这就是"实体协同"。

---

## 8. 传统运营 SOP

每个第三方平台运营（不需懂技术）按下列 SOP：

```markdown
## 每日 SOP（30 分钟）

1. 浏览 r/ChineseLanguage / r/learnmandarin / Quora 热门 → 答 3 个问题
2. 每个回答必须：
   - 直接答 + TL;DR
   - 至少 1 个数据点
   - 不超过 1 个 Zhiyu 链接（或 0）
   - 自我披露身份

## 每周 SOP

- 周一：1 篇 Reddit 教学帖
- 周三：1 篇 Quora 长答
- 周五：扫 Wikipedia 待引用列表，加 1 条引用
- 周日：周报：本周触达 / 链接 / karma

## 不允许做

- ❌ 用品牌官方号刷链
- ❌ 复制粘贴同一答案多 subreddit（会被禁）
- ❌ 在每个回答都放链接
- ❌ 不读原帖就答
- ❌ 答非所问的"软文"
```

---

## 9. KPI

| KPI | D30 | D60 | D90 |
|-----|-----|-----|-----|
| Reddit karma（个人号）| 1000 | 5000 | 15000 |
| Reddit 帖被引（AI 引擎） | 0 | 5 | 30 |
| Quora 答案 Views 累计 | 10K | 50K | 300K |
| Wikipedia 引用通过 | 1 | 5 | 15 |
| Wikidata 实体创建 | 1 | 5 | 10 |
| 高质量第三方外链 | 5 | 20 | 50 |
