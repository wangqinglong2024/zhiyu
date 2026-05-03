# 知语 Zhiyu · 营销总述（SEO + GEO 一体化作战手册）

> **版本**：v1.0 ｜ **日期**：2026-05-03 ｜ **作者**：营销与增长团队
>
> **目的**：本手册不是市面上千篇一律的"SEO 入门指南"。它是一份**针对知语 Zhiyu 的、面向 2026 年 AI 搜索时代的、产品上线即可执行的爆火作战手册**。
>
> **使用方式**：
> 1. 先读本文件 → 形成全局观；
> 2. 再读 [seo/00-index.md](./seo/00-index.md) 与 [geo/00-index.md](./geo/00-index.md) 的目录；
> 3. 按 [seo/12-90day-execution-plan.md](./seo/12-90day-execution-plan.md) 与 [geo/12-90day-execution-plan.md](./geo/12-90day-execution-plan.md) 落地执行；
> 4. 每周对照 [seo/11-monitoring-kpis.md](./seo/11-monitoring-kpis.md) 与 [geo/09-ai-citation-monitoring.md](./geo/09-ai-citation-monitoring.md) 校准方向。

---

## 0. 前置认知：为什么 2026 年的"爆火"必须是 SEO + GEO 双轮驱动

### 0.1 你必须接受的 5 个 2026 年事实

| # | 事实 | 数据 | 对知语的含义 |
|---|------|------|-------------|
| 1 | 全球 Google 搜索零点击率 | **64.82%**（移动端 77.2%） | 仅做传统 SEO 等于把流量送给 AI 摘要 |
| 2 | AI 摘要出现时，自然第一名 CTR | 从 31.7% → **19.8%**（-37.5%） | 必须主动进入 AI 引用池 |
| 3 | AI 引用流量转化率 | 14.2% vs 传统自然搜索 2.8%（**5×**） | 一个 AI 引用 ≈ 5 个传统点击 |
| 4 | 同时获得自然引用 + 付费广告的品牌 | CTR 提升 **91%** | 自然 GEO 是付费的乘法器 |
| 5 | Reddit / Wikipedia / YouTube | 占 AI 引用源 **68%** | 不能只优化自有官网 |

### 0.2 SEO 与 GEO 的关系（不是替代，是互补）

```
                     ┌──────────────────────────────┐
                     │   用户在哪里搜"learn Chinese" │
                     └──────────────┬───────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
     ┌────────────────┐   ┌────────────────┐   ┌────────────────┐
     │  Google 传统   │   │  AI 答案引擎   │   │  社交平台搜索  │
     │  10 蓝色链接   │   │ ChatGPT/Plex   │   │ TikTok/YouTube │
     │  (~35% 流量)  │   │  (~50% 流量)   │   │   (~15%流量)   │
     └────────┬───────┘   └────────┬───────┘   └────────┬───────┘
              │                    │                    │
              ▼                    ▼                    ▼
         ┌────────┐           ┌────────┐           ┌────────┐
         │  SEO   │           │  GEO   │           │  社交  │
         │ 主战场 │           │ 主战场 │           │  GEO   │
         └────────┘           └────────┘           └────────┘
              │                    │                    │
              └────────────┬───────┴────────────────────┘
                           ▼
                  ┌─────────────────┐
                  │  zhiyu.app 独立站 │
                  │  + APP 下载/注册  │
                  └─────────────────┘
```

**核心论断**：在 2026 年，**SEO 是流量底盘**（保证 AI 引擎能抓到、能解析），**GEO 是流量放大器**（让 AI 主动把你写进答案）。两者必须同时做，且 SEO 的工程改造（SSR/Schema/llms.txt）**直接是** GEO 的技术地基。

---

## 1. 知语项目背景与营销坐标

### 1.1 产品现状（2026 Q2）

- **正在上线**：发现中国（12 类目、6-12 个月内 360+ 篇文章）+ 系统课程（4 轨 × 12 阶段 × 12 章 × 12 节 × 12 知识点 ≈ 5-6 万独立内容）
- **未来 12 个月扩展**：小说专区（12 大类）+ 游戏专区（12 款）
- **技术栈**：Next.js + React + Supabase + Tencent Cloud（参见 [system/](../system/)）

### 1.2 目标用户画像（按地区分层）

| 优先级 | 市场 | 目标人群 | 主诉求 | 偏好渠道 |
|-------|------|---------|-------|---------|
| **P0** | 北美（US/CA） | 18-35 岁中文爱好者、Gen Z 留学预备 | HSK 备考、追剧懂中文、学汉字 | TikTok、Reddit、YouTube、ChatGPT |
| **P0** | 东南亚（VN/TH/ID/MY） | 20-40 岁跨境电商工作者、中资厂蓝领 | 接单议价、与中国客户/上司沟通 | TikTok、Facebook、本地论坛 |
| **P1** | UK/AU/西欧 | 商务/学术人群 | HSK 证书、中国文化兴趣 | Google、Perplexity、LinkedIn |
| **P2** | 拉美（MX/BR） | 二外学习者 | 兴趣型、文化探索 | TikTok、YouTube |

### 1.3 不可替代的内容资产（你最大的护城河）

1. **5-6 万条结构化知识点**：天然适合 Programmatic SEO + 适合 AI 引擎抽取（每条都是事实块）
2. **360+ 篇文化长文**：天然适合 BLUF + Wikipedia 引用 + 实体协同
3. **4 条独立轨道**：天然适合分场景关键词矩阵（电商 vs 工厂 vs HSK vs 日常）
4. **多语言基因**：所有知识点已自带越南语/泰语翻译，hreflang 几乎零成本

> **战略结论**：知语在 2026 年的"爆火窗口"，**不靠投放，靠"用 5 万条结构化知识点 × 360 篇文化长文，把 AI 答案引擎与 Google 长尾流量在 90 天内全部圈占"**。

---

## 2. 营销战略全景图（一张图看完）

```
            目标：12 个月内 zhiyu.app 月独立访客 > 500 万、APP DAU > 15 万
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
  【SEO 流量层】              【GEO 引用层】              【社交裂变层】
  传统 Google/Bing            ChatGPT/Perplexity/         TikTok/YouTube/
  长尾词海战术                 Gemini/Claude               Reddit/X
       │                            │                            │
  ┌────┼────┐                ┌──────┼──────┐              ┌─────┼─────┐
  ▼    ▼    ▼                ▼      ▼      ▼              ▼     ▼     ▼
 程序化 文化  HSK/词条        BLUF  llms.txt 第三方        UGC   挑战  Reddit
 SEO    长文  字典页          短答  + Schema 协同          模板  赛   AMA
 5万页  360页 1万页                          维基/PR
       │                            │                            │
       └────────────────────────────┼────────────────────────────┘
                                    ▼
                     共享技术地基（必须先做完）
              SSR + Core Web Vitals + JSON-LD + hreflang
                                    │
                                    ▼
                           【数据闭环 & 监测】
              GSC + GA4 + Server Logs + AI 引用追踪表 + 周报
```

### 2.1 三层流量战略

#### 第一层：SEO 长尾海战术（占预期流量 35%）

- **打法**：用 4 轨 × 12 阶段 × 5 万知识点的天然语料，生成 ~5 万 Programmatic SEO 词条页
- **代表关键词**：`how to write [汉字]`、`HSK [N] vocabulary list`、`[pinyin] meaning in english`、`[chengyu] story and meaning`
- **关键文档**：[seo/02-keyword-strategy.md](./seo/02-keyword-strategy.md)、[seo/05-programmatic-seo.md](./seo/05-programmatic-seo.md)

#### 第二层：GEO AI 引擎引用（占预期流量 50%、转化率 5×）

- **打法**：把 360 篇文化长文 + 5 万词条页全部按 BLUF + 事实密度 + Schema 标准重写，并在 Reddit/Wikipedia/YouTube 三大引用源建立"实体协同"
- **代表场景**：用户在 ChatGPT 问 `best app to learn HSK 4 vocabulary 2026` → 答案中引用 Zhiyu
- **关键文档**：[geo/03-content-bluf-semantic-chunking.md](./geo/03-content-bluf-semantic-chunking.md)、[geo/04-citation-platforms-reddit-wikipedia.md](./geo/04-citation-platforms-reddit-wikipedia.md)

#### 第三层：社交平台裂变（占预期流量 15%、品牌强化）

- **打法**：TikTok 每日 1-3 条 30s 课程视频（已天然集成，参见课程模块）+ Reddit r/ChineseLanguage 每周 1 篇硬核教学帖 + YouTube Shorts 矩阵
- **关键文档**：[geo/05-youtube-tiktok-video-geo.md](./geo/05-youtube-tiktok-video-geo.md)、[geo/11-ugc-community-amplification.md](./geo/11-ugc-community-amplification.md)

### 2.2 90 天里程碑（必须达成）

| 阶段 | 时间 | 流量目标 | 核心动作 | 责任 |
|------|------|---------|---------|------|
| **D0-D14 地基期** | 第 1-2 周 | - | 完成 SSR、Schema、llms.txt、hreflang、GSC/GA4 接入；20 个种子页面 BLUF 改造 | 工程 + 内容 |
| **D15-D45 引爆期** | 第 3-7 周 | UV 5 万/月 | Programmatic SEO 上线 1 万词条页；启动 Reddit/Wikipedia 实体协同；TikTok 日更 | 全员 |
| **D46-D90 放量期** | 第 8-13 周 | UV 50 万/月 | 词条页扩到 5 万；GEO 监测显示在 5 个核心 prompt 上被 ChatGPT/Perplexity 引用 | 全员 |

详见 [seo/12-90day-execution-plan.md](./seo/12-90day-execution-plan.md) 与 [geo/12-90day-execution-plan.md](./geo/12-90day-execution-plan.md)。

---

## 3. SEO 与 GEO 的本质差异（一表说清）

| 维度 | 传统 SEO（Google/Bing 蓝链） | GEO（AI 答案引擎引用） |
|-----|----------------------------|---------------------|
| **目标** | 进入 SERP 前 10 蓝链 | 被写进 AI 生成的答案段落 |
| **算法** | PageRank + Hummingbird + RankBrain | RAG 检索 + LLM 注意力 + 引用裁决 |
| **核心信号** | 反向链接、关键词、CTR、停留时长 | 事实密度、实体一致性、第三方引用集中度 |
| **内容形式偏好** | 长文、关键词覆盖、内链 | 短答块（BLUF）、表格、编号列表、明确时戳 |
| **品牌官网权重** | 高（自有内容直接排名） | **低**（占引用 < 5%，68% 来自第三方） |
| **更新周期敏感度** | 月-季度 | **周-月**（>3 月未更新 → 引用率断崖） |
| **归因难度** | 低（GA4 referrer 清晰） | **极高**（多归类为 Direct/Unassigned） |
| **波动性** | 算法更新 1-2 次/年 | LLM 微调 → 引用份额周级别波动 |
| **付费替代品** | Google Ads（明确广告位） | Sponsored Citations（混入答案） |
| **冷启动周期** | 6-12 个月 | **6-12 周**（窗口期短） |

**结论**：SEO 是慢但稳的复利机器，GEO 是快但波动的爆发机器。**对一个新上线产品要"尽快爆火"，GEO 优先级高于 SEO，但 SEO 是 GEO 的技术前提**。

---

## 4. 用户调研中关键问题的最终答复（决策依据）

### Q1：广告会不会让 GEO 白费？

**答**：不会。三条理由（已写入 [geo/01-strategy-overview.md](./geo/01-strategy-overview.md) §3）：

1. **Perplexity 已永久放弃广告**（2026 年 2 月决策），其 2000 万+ MAU 是纯自然流量池
2. **同时拥有自然引用 + 付费广告 → CTR 提升 91%**（自然 GEO 是付费的乘法器，不是被替代品）
3. **黄金窗口期 6-12 个月**：ChatGPT 广告全面铺开前先建立的信任度，会沉淀进 LLM 训练语料层

### Q2：传统运营能做 GEO 吗？技术护城河在哪？

**答**：分层来看：

- **官网底层改造**（SSR/Schema/llms.txt/SSR）：**纯工程**，传统运营做不了，是知语的硬护城河
- **第三方平台分发**（Reddit/Wikipedia/Quora/YouTube）：传统运营**经过培训**可做，但需遵循 **"事实优先 + 数据嵌入 + 实体一致"** 三条铁律，否则发再多无效
- **Prompt 测试 + 引用监测**：需要工程化脚本，传统运营做不了

详见 [geo/04-citation-platforms-reddit-wikipedia.md](./geo/04-citation-platforms-reddit-wikipedia.md) §"传统运营 SOP"。

### Q3：第三方平台发的内容零赞，AI 还会引用吗？

**答**：会。这是 GEO 与社交媒体算法的根本差异：

- **大模型 RAG 看的是"事实密度"和"结构清晰度"**，不看点赞数
- 数据：被 AI 引用的 YouTube 视频中 **40.83% 播放量 < 1000**、**36% 点赞 < 15**
- **运营策略**：在第三方平台发布时，**不要为算法写**，要"说人话 + 给数据 + 亮结论"——这种内容既不会触发限流，又能被 AI 优先抽取

详见 [geo/05-youtube-tiktok-video-geo.md](./geo/05-youtube-tiktok-video-geo.md) §"为人写还是为机器写"。

### Q4：第三方平台用"语义分块"格式发，普通用户看得懂吗？

**答**：看得懂，且更容易看懂。**机器友好 ≠ 反人类**：

- 错误做法：直接复制 Markdown H2/H3 到 Twitter（既丑又被限流）
- 正确做法：每个平台一份 **同事实、不同包装**的版本（参见 [geo/04-citation-platforms-reddit-wikipedia.md](./geo/04-citation-platforms-reddit-wikipedia.md) §"平台改写矩阵"）
- 共同铁律：**结论先行 + 事实可验证 + 不堆营销废话**——这同时让人和机器都更愿意看

---

## 5. 文档地图

### 5.1 SEO 体系（`marking/seo/`）

| # | 文档 | 一句话定位 |
|---|------|-----------|
| 00 | [00-index.md](./seo/00-index.md) | SEO 模块总目录 |
| 01 | [01-strategy-overview.md](./seo/01-strategy-overview.md) | SEO 总策略与"知语三轮 SEO 模型" |
| 02 | [02-keyword-strategy.md](./seo/02-keyword-strategy.md) | 关键词矩阵（4 轨道 × 5 意图层 × 4 市场） |
| 03 | [03-technical-seo-nextjs.md](./seo/03-technical-seo-nextjs.md) | Next.js 技术 SEO 完整清单 |
| 04 | [04-onpage-content-template.md](./seo/04-onpage-content-template.md) | 5 大页面类型 On-Page 模板 |
| 05 | [05-programmatic-seo.md](./seo/05-programmatic-seo.md) | 5 万词条页程序化 SEO 实施 |
| 06 | [06-internal-linking-architecture.md](./seo/06-internal-linking-architecture.md) | Hub→Pillar→Leaf 内链架构 |
| 07 | [07-multilingual-hreflang.md](./seo/07-multilingual-hreflang.md) | 多语言 hreflang 与本地化 SEO |
| 08 | [08-schema-structured-data.md](./seo/08-schema-structured-data.md) | JSON-LD Schema 完整代码模板 |
| 09 | [09-core-web-vitals.md](./seo/09-core-web-vitals.md) | Core Web Vitals 优化清单 |
| 10 | [10-link-building-digital-pr.md](./seo/10-link-building-digital-pr.md) | 反向链接与 Digital PR 战术库 |
| 11 | [11-monitoring-kpis.md](./seo/11-monitoring-kpis.md) | KPI 监测体系与周报模板 |
| 12 | [12-90day-execution-plan.md](./seo/12-90day-execution-plan.md) | 90 天 SEO 执行甘特图 |

### 5.2 GEO 体系（`marking/geo/`）

| # | 文档 | 一句话定位 |
|---|------|-----------|
| 00 | [00-index.md](./geo/00-index.md) | GEO 模块总目录 |
| 01 | [01-strategy-overview.md](./geo/01-strategy-overview.md) | GEO 总策略与三道护城河 |
| 02 | [02-llms-txt-implementation.md](./geo/02-llms-txt-implementation.md) | llms.txt / llms-full.txt 部署 |
| 03 | [03-content-bluf-semantic-chunking.md](./geo/03-content-bluf-semantic-chunking.md) | BLUF + 语义分块 + 事实密度规范 |
| 04 | [04-citation-platforms-reddit-wikipedia.md](./geo/04-citation-platforms-reddit-wikipedia.md) | Reddit/Wikipedia/Quora 引用建设 |
| 05 | [05-youtube-tiktok-video-geo.md](./geo/05-youtube-tiktok-video-geo.md) | YouTube/TikTok 视频 GEO |
| 06 | [06-ai-engine-platform-strategies.md](./geo/06-ai-engine-platform-strategies.md) | ChatGPT/Perplexity/Gemini/Claude 差异化打法 |
| 07 | [07-entity-harmonization.md](./geo/07-entity-harmonization.md) | 实体协同：把"知语"刻进 LLM 知识图谱 |
| 08 | [08-freshness-update-cadence.md](./geo/08-freshness-update-cadence.md) | 内容新鲜度运维 SOP |
| 09 | [09-ai-citation-monitoring.md](./geo/09-ai-citation-monitoring.md) | AI 引用监测系统与 KPI |
| 10 | [10-prompt-testing-matrix.md](./geo/10-prompt-testing-matrix.md) | 200 prompt 测试矩阵 |
| 11 | [11-ugc-community-amplification.md](./geo/11-ugc-community-amplification.md) | UGC + 社区放大器 |
| 12 | [12-90day-execution-plan.md](./geo/12-90day-execution-plan.md) | 90 天 GEO 执行甘特图 |

---

## 6. 关键资源与责任分工建议

| 角色 | 编制建议 | 核心职责 |
|------|---------|---------|
| **GEO/SEO 负责人** | 1 人（全职） | 战略决策、跨部门协调、周报汇报 CEO |
| **技术 SEO 工程师** | 1 人（兼职 Next.js 团队） | SSR/Schema/llms.txt/CWV/sitemap/Server Logs |
| **内容编辑** | 2 人（中英双语 + 一名英语母语） | 360 文化长文 + 词条页抽样审核 + BLUF 改写 |
| **数据 SEO** | 1 人（兼职） | Programmatic SEO 模板 + 5 万词条批量生成 + 质量门控 |
| **社区运营** | 1 人 | Reddit/Quora/HN 长期运营 + AMA 策划 |
| **视频运营** | 1 人 + 外包字幕 | TikTok/YouTube/Bilibili Shorts |
| **PR / Digital PR** | 0.5 人（外包优先） | Wikipedia 词条、行业媒体、PR Newswire 通稿 |
| **数据分析** | 0.5 人（兼职） | GSC/GA4/AI Citation 仪表盘 + 周报 |

总计 **约 7 个 FTE**（含兼职折算），其中 4 个是首月必须到位的关键岗位（负责人 + 工程 + 内容 + 数据 SEO）。

---

## 7. 总投入与预期 ROI（保守估算）

> ⚠️ 数值为基于研究方法的方向性估算，须在 30 天试点后用 GA4/GSC 真实数据校准。

### 7.1 90 天投入

| 项目 | 投入 |
|------|-----|
| 人力（7 FTE × 3 月） | ~¥45-60 万 |
| 工具（Ahrefs + SEMrush + Surfer + AI 引用监测） | ~¥5 万 |
| Digital PR / 维基撰写外包 | ~¥3-5 万 |
| 短视频拍摄 / 字幕外包 | ~¥3 万 |
| **合计** | **~¥56-73 万** |

### 7.2 90 天预期产出

| KPI | 90 天目标 |
|-----|----------|
| 索引页面数 | 5 万 + |
| GSC 月展示量 | 500 万 + |
| 自然搜索 UV/月 | 50 万 + |
| AI 引擎被引 prompt 数（覆盖前 200 测试 prompt） | ≥ 30% |
| Reddit/Quora 新增高权重外链 | 50+ |
| Wikipedia/Wikidata 实体节点 | 5+ |
| APP 注册（来自 SEO/GEO 渠道） | 3-5 万 |

### 7.3 12 个月预期

- 月活 UV：500 万 +
- APP DAU：15 万 +
- AI 引擎在"learn Chinese / HSK / pinyin / chengyu"主流询问中**首屏引用率** > 40%
- 在 Reddit/Quora/YouTube 形成**自我维持的 UGC 引用网络**

---

## 8. 立即开始的下一步（今天就能做）

按优先级排序：

1. **今天**：把 [seo/03-technical-seo-nextjs.md](./seo/03-technical-seo-nextjs.md) 中的 P0 清单丢给 Next.js 工程师评估工时
2. **本周**：完成 [seo/02-keyword-strategy.md](./seo/02-keyword-strategy.md) 中关键词导出（用 Ahrefs / SEMrush 导出 4 个市场各 2000 词）
3. **本周**：完成 [geo/02-llms-txt-implementation.md](./geo/02-llms-txt-implementation.md) 的 llms.txt v1
4. **下周**：选 20 个种子页面按 [geo/03-content-bluf-semantic-chunking.md](./geo/03-content-bluf-semantic-chunking.md) 模板改写
5. **下周**：注册 Reddit/Quora/HN/Medium 品牌账号 + 初稿 1 篇 [geo/11-ugc-community-amplification.md](./geo/11-ugc-community-amplification.md) 中的 Reddit 教学帖

---

> **最后一句话**：
> "做 SEO 是为了不输；做 GEO 是为了赢。
>  在 2026 年的中文学习赛道，知语的对手不是 Duolingo，而是**ChatGPT 在用户问'最好的中文学习 APP'时第一个推荐的那个名字**。
>  这套手册的全部目的，就是让那个名字是 Zhiyu。"
