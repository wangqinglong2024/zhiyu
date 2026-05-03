# 反向链接与 Digital PR 战术库

> **2026 现实**：链接质量 > 数量。**1 条 BBC/NYT/Wikipedia 外链** > 1000 条目录站外链。
>
> **协同**：本文与 [../geo/04-citation-platforms-reddit-wikipedia.md](../geo/04-citation-platforms-reddit-wikipedia.md) 高度联动 —— SEO 外链 = GEO 引用源。

---

## 1. 链接质量分级（参考 Ahrefs DR + 行业相关性）

| 级别 | 来源 | DR 范围 | 价值（相对） | 难度 |
|------|------|--------|-----------|------|
| **S+** | Wikipedia, BBC, NYT, Forbes, Reuters, 政府/大学 .edu | 90+ | 100x | 极难 |
| **S** | Major news (Atlantic, Guardian), big YouTube, Reddit Wiki | 80-90 | 30x | 难 |
| **A** | Niche 顶站（China Daily, SupChina, NextShark, RADII） | 60-80 | 10x | 中 |
| **B** | 行业博客、高 DR 目录、教师博客 | 40-60 | 3x | 易 |
| **C** | 普通博客、留言、签名链 | 20-40 | 1x | 极易 |
| **F** | PBN、垃圾目录、付费 Fiverr 5 美元链 | <20 | -10x（受罚） | - |

**策略**：90% 精力在 S+/S/A 级。

---

## 2. 链接获取的 10 大战术

### 战术 1：Wikipedia / Wikidata 词条建设（**S+ 价值**）

详见 [../geo/04-citation-platforms-reddit-wikipedia.md](../geo/04-citation-platforms-reddit-wikipedia.md)。要点：
- 建/补充"知语 (Zhiyu)"主词条 + 创始人词条 + 教研专家词条
- 在已有词条中加可靠引用（Mandarin learning, HSK, Chinese characters 等）— 必须遵循 NPOV
- Wikidata 建立实体 + sameAs 全网交叉

### 战术 2：HARO / Qwoted / Featured（记者询源平台）

每天答 3-5 条：
- HARO（已被 Cision 收购，2024 改为 Connectively 但已停用，2026 主流为 Qwoted、Featured.com、HelpaB2BWriter）
- 主题选：Mandarin learning, China culture, cross-cultural business, language education
- 答案要 200 字内 + 数据 + 引用 → 高被引
- 月产 5-10 个 S 级外链

### 战术 3：客座文章（Guest Posts）

向以下 30 个站投稿（清单方向）：
- China-Underground, RADII, NextShark, SupChina (停刊后接班的 China Project)
- LanguageMagazine, Babbel Blog, Learning Languages community
- HuffPost / Medium Top Publications (Better Humans, The Startup)
- 行业站：edSurge, ClassCentral, Coursera Blog
- 当地东南亚媒体：VietnamPlus, Bangkok Post Lifestyle

每篇要求：
- 含 1-2 自然链回 Zhiyu（资源页或词典）
- 800-1500 词
- 真实价值（不要 Spammy "guest post for SEO"）

### 战术 4：资源页 Outreach

Google 搜：
```
"learn chinese" inurl:resources
"mandarin" inurl:links
site:.edu "chinese language" "useful resources"
```
找出列表页 → 邮件给站长说"Hi I noticed your awesome resource list, here's a free vocabulary tool that might help your readers"

每月发 100 邮件 → 5-10% 回复 → 5 链/月

### 战术 5：Broken Link Building

工具：Ahrefs → 找竞品的死链 → 提供我们的对应资源做替代。

每月可换 3-5 个 A/B 级链。

### 战术 6：Skyscraper

找竞品最高反链文章（Ahrefs `Best by Links`）→ 我们做"10x 版"→ 逐一邮件原 backlinker。

### 战术 7：原创数据报告（Linkable Asset）

每季度发 1 份原创数据：
- "State of Mandarin Learning Worldwide 2026"（基于知语 X 万用户匿名统计）
- "Top 100 Chinese Words Foreigners Search Most"
- "HSK 4.0 vs HSK 3.0: A Data Comparison"

数据报告天然吸引媒体引用、产生大量 S 级外链。

### 战术 8：交互工具（Linkable Asset）

我们的几个免费工具天然吸引外链：
- Pinyin Chart（高分享性，已成定式）
- Stroke Order Animator
- Chinese Tattoo Verifier（防止纹错字）
- HSK Level Estimator

每个工具都做营销页 + Embed Code 让其他站点嵌入。

### 战术 9：教师 / 留学生 / 大学外链

- 给 100 所大学的 Mandarin Department 教授寄一份"免费教学资源"
- 在 Reddit r/ChineseLanguage / r/learnmandarin 长期高质量回答 → 自然被引
- 与 Confucius Institute（在不同国家有 500+ 分校）合作免费教学包

### 战术 10：本地化 PR 通稿

- PR Newswire / Business Wire 发英文通稿（每条 ~$800-2000，但生成 50-200 媒体复刊 + 高 DR 链）
- 节点：天使轮、产品 1.0 上线、HSK 课程上线、用户数里程碑、大模型合作
- 必含品牌名 + 关键词锚链回 Zhiyu

---

## 3. 锚文本分布（防过度优化受罚）

| 锚文本类型 | 比例 | 例 |
|-----------|------|----|
| 品牌词 | 40% | Zhiyu |
| 裸 URL | 25% | https://zhiyu.app |
| 通用词 | 15% | this Mandarin learning platform |
| 部分匹配 | 15% | learn Chinese with Zhiyu |
| 精准匹配 | 5% | best HSK 4 vocabulary list |

**禁忌**：精准匹配比例 > 10% → Google 视为 manipulative → 受罚

---

## 4. 反向链接审计（每月）

工具：Ahrefs / Semrush Backlink Audit

每月：
1. 导出新增反链
2. 标 toxic 链（PBN / 关键词堆 / 不相关站）→ Disavow（用 GSC Disavow Tool）
3. 评估 Top 50 反链的相关性 + DR 趋势
4. 识别 Lost Links → 邮件 outreach 恢复

---

## 5. 内部链接 + 外链协同

- 给"接收最多优质外链"的页面（DR 提升页）加更多内链 → 把权重传给词条 Leaf
- 词条 Leaf 用内链汇集到 Pillar → Pillar 才是关键词承接

---

## 6. 监测

| KPI | 目标（D90） | 工具 |
|-----|------------|------|
| Referring Domains 总数 | 200+ | Ahrefs |
| DR 60+ 外链 | 30+ | Ahrefs |
| Wikipedia / Wikidata 节点 | 5+ | 手动 |
| 月新增高质链 | 20+ | Ahrefs |
| Disavow 列表 | 维护中 | GSC |

---

## 7. 12 个月 Digital PR 排期

| 月 | 主题 | 形态 |
|----|------|-----|
| M1 | 知语 1.0 全球上线 | 通稿 + 30 站 outreach |
| M2 | 越南/泰国本地版上线 | 当地 PR + KOL |
| M3 | "State of Mandarin Learning 2026"数据报告 | 报告 + 10 媒体 |
| M4 | HSK 4.0 备考完整指南上线 | Pinterest + Reddit AMA |
| M5 | 与某 Confucius Institute 合作 | 联合 PR |
| M6 | 用户 50 万里程碑 | 通稿 + 投资人故事 |
| M7 | 创始人 TEDx 演讲 | 视频 + 外链 |
| M8 | 中国文化日大型活动 | 节日 PR |
| M9 | "Chinese Tattoo Guide 2026" 病毒报告 | 高分享性 |
| M10 | 课程 2.0 / 小说专区上线 | 通稿 + 评测合作 |
| M11 | 年终回顾 + 2027 预测 | 数据报告 |
| M12 | 周年庆 + 慈善捐助新闻 | 公益 PR |
