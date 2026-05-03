# SEO 总策略：知语三轮 SEO 模型

> **核心命题**：在 2026 年 AI 答案时代，传统 SEO 不死，但**只有"AI-Ready 的 SEO"才能活**。

---

## 1. 战略定位

### 1.1 我们不做什么

- ❌ **不堆关键词**（2026 年 Google Helpful Content Update 后必死）
- ❌ **不买垃圾外链**（PBN/Fiverr 5 美元外链 → 直接受罚）
- ❌ **不做"AI 生成 + 一键发布"**（Google March 2024 / Helpful Content 2026 更新会判定为"Scaled Content Abuse"）
- ❌ **不为 Google 之外的爬虫单独做内容**（GEO 与 SEO 共用底层内容，仅"包装"不同）

### 1.2 我们做什么：三轮 SEO 模型

```
        ┌───────────────────────────────────────┐
        │   轮 1：长尾词条海（量）                │
        │   5 万 Programmatic SEO 词条页         │
        │   覆盖 100 万 + 长尾词                 │
        └─────────────────┬─────────────────────┘
                          │
        ┌─────────────────▼─────────────────────┐
        │   轮 2：枢纽长文（权威）                │
        │   360 篇文化长文 + 36 篇产品 Pillar    │
        │   承接长尾流量、做权重池                │
        └─────────────────┬─────────────────────┘
                          │
        ┌─────────────────▼─────────────────────┐
        │   轮 3：转化页面（钱）                  │
        │   APP 下载页、HSK 课程页、订阅页       │
        │   承接前两轮流量并转化                  │
        └───────────────────────────────────────┘
```

**联动逻辑**：长尾词条 → 内链 → 文化长文 → CTA → 转化页

---

## 2. 战略原则（必读 6 条）

### 原则 1：内容必须"双工友好"（人 + AI 都爽）

每篇内容都要同时满足：
- **人类**：故事化导入 + 视觉层次 + 实用价值
- **AI 爬虫**：BLUF 短答 + 表格 + Schema + 明确时间戳

详见 [04-onpage-content-template.md](./04-onpage-content-template.md)

### 原则 2：搜索意图 > 关键词词频

2026 年的 Google 已不看关键词密度，而看你是否**真正满足意图**。
对每个目标关键词必须先问三问：
1. 用户是 Informational / Navigational / Commercial / Transactional？
2. 我提供的"最有用答案"是文章 / 工具 / 视频 / 列表？
3. 竞品 SERP 前 3 名提供了什么？我能多提供 30%？

### 原则 3：E-E-A-T 是底层信仰，不是技术指标

- **Experience**：每篇 HSK / 词条页都要署名（教师 + LinkedIn + Wikidata sameAs）
- **Expertise**：作者页（/authors/[slug]）必须是 indexable 的，含资历、出版物、外部引用
- **Authoritativeness**：Wikipedia 引用、PR 通稿、教育机构外链
- **Trustworthiness**：HTTPS、隐私政策、退款政策、联系方式、关于我们 4 件套必须存在

### 原则 4：技术 SEO 不是"可选项"，是"准入证"

下列任一项不达标，再多内容也是白搭：
- HTTPS + HTTP/2 + HSTS
- LCP < 2.5s / INP < 200ms / CLS < 0.1（移动端中位数）
- SSR 或 SSG（不要 CSR）
- robots.txt 放行 + sitemap.xml 提交 + GSC 验证
- hreflang 正确 + canonical 唯一

### 原则 5：内链密度 > 外链总数

研究显示：在 2026 年的 Google 算法中，**良好的内链结构 + 站内主题集中度** 对长尾词排名的影响已超过单纯反向链接数量。
- 每页面强制 3-7 条上下文内链
- Hub 页内链全部 Leaf 页（5 万词条 → Hub 必有目录与字母索引）
- Pillar 页与 Hub 页双向链接

详见 [06-internal-linking-architecture.md](./06-internal-linking-architecture.md)

### 原则 6：先求"被索引"，再求"被排名"

很多 Programmatic SEO 项目失败不是排名差，是**根本没被索引**。
- 用 Bing IndexNow API 主动推送（Google 已弃用 Indexing API for general use，但 Bing 全量支持，Bing 流量在欧美 ~9%、非常值得）
- 用 sitemap 分文件（每 file ≤ 5 万 URL，分类提交）
- 在 GSC 用 URL Inspection API 批量请求索引（每天 200 配额）
- 监控 Coverage 报告，对"Crawled - currently not indexed"做内容增强

---

## 3. 4 大业务模块 SEO 优先级矩阵

| 模块 | 内容量 | 关键词竞争 | 流量潜力 | SEO 优先级 | 备注 |
|------|--------|----------|---------|----------|------|
| **HSK 词典/课程** | 1 万词条 + 9 阶段 | 中（专业词竞争小） | 高 | **P0** | HSK 1-9 全等级覆盖 |
| **汉字字典** | 3500 常用 + 8000 通用 | 高（Pleco 等已霸榜） | **极高** | **P0** | 用"笔顺动画 + 词组 + 例句"差异化 |
| **拼音工具** | 工具 + 教程 | 中 | 高 | **P1** | "pinyin chart"、"pinyin to chinese" 类 |
| **成语典故** | 3000+ 条 | 低（中文独占赛道） | 中 | **P0** | 英语世界的成语数据库蓝海 |
| **发现中国 12 类目** | 360 长文 | 各异 | 中 | **P1** | 文化兴趣流量 + GEO 引用源 |
| **系统课程 4 轨** | 5 万知识点 | 高（Duolingo 霸榜） | 高 | **P1** | 用"工厂/电商场景"差异化 |
| **小说专区** | 12 类（未来） | 低 | 中 | **P2** | 12 个月后再展开 |
| **游戏专区** | 12 款（未来） | 低 | 高（病毒性） | **P2** | 12 个月后再展开 |

---

## 4. 与竞品的差异化策略

### 4.1 主要竞品 SEO 现状（2026 年 Q2 公开观察）

| 竞品 | 主要 SEO 资产 | 弱点（我们的机会） |
|------|--------------|-----------------|
| **Duolingo** | 品牌词 + Stories + Podcast | HSK 体系弱、汉字深度浅 |
| **HelloChinese** | 课程页 SEO 中等 | 内容更新慢、无文化模块 |
| **Pleco** | 字典 SEO 强（移动 APP 主导） | Web 端薄弱、无系统课程 |
| **Du Chinese** | 阅读分级 SEO 中 | 词条页少、无 HSK 词典 |
| **ChinesePod** | 老牌外链强 | 网页古旧、CWV 差 |
| **LingoDeer** | 课程 SEO 中 | 中文非主打、内容浅 |
| **Skritter** | 笔顺 SEO 强 | 仅笔顺、无文化无对话 |
| **YoYo Chinese** | 视频教学 | 网页 SEO 弱、依赖 YouTube |

### 4.2 知语的 4 个差异化锚点

1. **"中国文化 + 中文学习"双引擎**：竞品都只做语言，知语的 360 篇文化长文是 GEO 引用磁铁
2. **"4 轨场景化课程"**：电商、工厂、HSK、日常 → 4 倍长尾词面积
3. **"东南亚优先 + 北美次之"**：Duolingo 在东南亚弱，知语原生越南语/泰语翻译是降维打击
4. **"AI-Native 内容架构"**：从第 1 天起所有内容按 GEO 标准写，竞品需重构

### 4.3 反向窃取竞品流量的具体战术

- 用 Ahrefs `Content Gap` 工具，导出 Duolingo / HelloChinese / Pleco 排名但我们未排名的关键词
- 对每个 Top 100 流量页做"10x 内容"——内容更深 + 视频 + 工具 + Schema 完整
- 在我们的 vs 文章里诚实标注差异（Helpful Content 友好），如 `Zhiyu vs Duolingo for HSK 4: a 2026 honest comparison`

---

## 5. 与 GEO 的协同点（不要重复劳动）

| 资产 | SEO 用法 | GEO 用法 | 共享 |
|------|---------|---------|------|
| BLUF 短答块 | Featured Snippet 抢占 | AI 答案直接抽取 | ✅ 同一段 |
| 表格 | Schema Table + Rich Result | RAG 抽取最爱 | ✅ 同一表 |
| FAQ Schema | People Also Ask | AI 引用占 43% | ✅ 同一组 |
| 作者署名 + sameAs | E-E-A-T | 实体协同 | ✅ 同一份 |
| Last Updated | Freshness | RAG 优先级 | ✅ 同一字段 |
| Hreflang | 多语 SERP | 多模型多语种引用 | ✅ 同一标签 |
| Wikipedia 词条 | 高权外链 | 实体网络锚点 | ✅ 同一篇 |
| Reddit AMA | 社区流量 | AI 引用源 #1 | ✅ 同一活动 |
| YouTube 视频 + 字幕 | YouTube SERP | AI 引用 | ✅ 同一视频 |

**结论**：执行时要**一次写、多端用**。SEO 与 GEO 团队**不分家**，由同一个营销负责人统一调度。

---

## 6. 风险预警

| 风险 | 概率 | 影响 | 缓解措施 |
|------|-----|------|---------|
| Google 核心算法更新（季度）| 高 | 中 | 内容真材实料、E-E-A-T 完整 |
| Helpful Content 判定 Programmatic 为 Scaled Abuse | 中 | **高** | 每页注入差异化事实 + 抽样审核（详见 [05-programmatic-seo.md](./05-programmatic-seo.md)）|
| 竞品复制我们 4 轨课程定位 | 中 | 中 | 用"中国文化"+ 东南亚本地化加速建立护城河 |
| AI Overviews 进一步吃掉点击 | 高 | 高 | 必须做 GEO（参见 GEO 模块）|
| 海外服务器/CDN 被 GFW 影响 | 低 | 高 | Cloudflare + 边缘节点 + 备用 CDN |
| 多语翻译质量差导致 hreflang 受罚 | 中 | 中 | 母语 reviewer + 不要直接用机翻发布 |

---

## 7. 90 天战术总结（详见 [12-90day-execution-plan.md](./12-90day-execution-plan.md)）

```
第 1-2 周  地基: SSR/Schema/llms.txt/sitemap/GSC/GA4 → 工程
第 3-4 周  种子: 20 篇 Pillar + 1000 词条页 → 内容
第 5-8 周  扩量: 5000-10000 词条 + 内链网络 → 数据 SEO
第 9-13 周 放量: 5 万词条 + Digital PR + 监测闭环 → 全员
```
