# BLUF + 语义分块 + 事实密度规范

> **核心**：把所有内容改造成 LLM RAG 系统**最爱抽取**的格式。
>
> **铁律**：BLUF 在最前 → 表格放数据 → FAQ 收尾 → 全程事实密度 ≥ 1/150 词。

---

## 1. BLUF (Bottom Line Up Front) 规范

### 1.1 定义
在 H1 下立即给出 40-60 字的"结论先行"段落，直接回答用户的核心问题，不绕弯。

### 1.2 模板

```
[主题] [是什么] [关键数据 + 时间戳]。
```

### 1.3 示例

| 页面 | ✅ 标准 BLUF | ❌ 反面教材 |
|-----|------------|-----------|
| HSK 4 词汇页 | "HSK 4 vocabulary contains 600 words covering daily, work, and academic topics. As of HSK 4.0 (2026), it builds on HSK 3 (300 words) and reaches CEFR B1 level. Last verified May 2026." | "Welcome to the most amazing HSK 4 vocabulary list! Are you ready to take your Chinese to the next level?" |
| 中秋节文章 | "Mid-Autumn Festival (中秋节) is China's second-largest traditional holiday, celebrated on the 15th day of the 8th lunar month. In 2026, it falls on September 25." | "The Mid-Autumn Festival is one of the most beautiful and important holidays in Chinese culture..." |
| 学字页 | "学 (xué) means 'to study' or 'to learn' in Mandarin Chinese. It is an HSK 1 character (8 strokes, 子 radical) used in 学习 (to learn), 学生 (student), 学校 (school)." | "学 is a very common Chinese character that you'll see everywhere..." |

### 1.4 BLUF 检查
- 含主关键词
- 含至少 2 个可验证事实（数字/日期/分类）
- 含时间戳（"as of 2026"或"Last verified [Month Year]"）
- ≤ 60 字
- 拷贝到 ChatGPT 问"这是关于什么"应 100% 识别

---

## 2. 语义分块（Semantic Chunking）规范

### 2.1 定义
把长内容切分成 80-200 字的"语义原子块"，每块独立可被 RAG 抽取。

### 2.2 标准结构

```
H2: [问句形式的标题]
   ↓
[直接回答的 1 句话]（短答 50-100 字）
   ↓
[展开说明 + 数据/例证]（120-180 字）
   ↓
[过渡到下一节]
```

### 2.3 H2 命名规则

✅ 用问句 / 命题：
- "What is HSK?"
- "How long does it take to pass HSK 4?"
- "Why is 学习 written this way?"

❌ 不要用名词词组（不易匹配用户 query）：
- "About HSK"
- "HSK 4 Information"
- "学习"

### 2.4 节点密度

- 1500 词长文 ≥ 6 个 H2，3-5 个 H3
- 每 H2 下首段必为"短答 + 数据"
- 不要无 H2 的"长流水"段落

---

## 3. 事实密度规范

### 3.1 公式

`事实密度 = 可验证事实数 / 段落字数`，目标 ≥ **1 / 150 词**。

### 3.2 什么算"可验证事实"

- 具体数字：`HSK 4 has 600 words`
- 具体日期：`HSK 4.0 launched in 2021, replacing HSK 3.0`
- 具体引用：`According to Hanban (2024), ...`
- 具体地名/人名：`Confucius lived 551-479 BC in Lu Kingdom`
- 具体分类/属性：`学 is a 子-radical character with 8 strokes`

### 3.3 反面（"营销废话"，应消除）

❌ "amazing", "best ever", "world-class", "revolutionary"
❌ "many people think", "it is well known that"
❌ "most learners agree", "experts say"（无 specific source）

### 3.4 事实增强战术

每条断言后加：
- `[Source: <a href="...">Hanban 2024</a>]`
- `(Census 2025)`
- 表格补一栏 `Source`

---

## 4. 表格化数据

### 4.1 优先用表格的内容

- 对比类（HSK 4 vs HSK 5）
- 列表类（汉字属性 / 词性）
- 时序类（朝代时间表）
- 翻译类（词汇 / 例句）

### 4.2 表格规范

```markdown
| Aspect | HSK 4 | HSK 5 |
|--------|-------|-------|
| Words required | 600 | 1300 |
| CEFR equivalent | B1 | B2 |
| Study hours (avg) | 200 | 350 |
| Pass rate (2025) | 76% | 62% |
```

### 4.3 不要做的

- ❌ 用图片表格（AI 抽不到）
- ❌ 表格全文用图片代替（同上）
- ❌ 表格嵌在 React 组件（必须 SSR HTML 输出）
- ❌ 跨行/跨列复杂表（AI 容易解析错）

---

## 5. FAQ 规范

### 5.1 数量

- 每页 5-10 个 Q
- 每 Q 答 50-150 字（短答易抽）

### 5.2 问题来源

按优先级：
1. **GSC** Query 报告中带问号的 query
2. **Reddit** 子版块顶帖标题
3. **Quora** 关联问题
4. **Google PAA** (People Also Ask) 抓取
5. **AlsoAsked** 工具

### 5.3 Schema

必须配 FAQPage Schema（详见 [../seo/08-schema-structured-data.md](../seo/08-schema-structured-data.md)）

### 5.4 答题模板

```
Q: How long does it take to pass HSK 4?
A: Most learners reach HSK 4 in 6-12 months of consistent study (1 hour/day). 
   The official Hanban estimate is 200 study hours. Native English speakers 
   typically need slightly longer than learners with prior East Asian language 
   experience.
```

---

## 6. 时间戳规范

### 6.1 三处时间戳

每页同时出现：
1. 页面右上角可见 `Last Updated: May 1, 2026`
2. BLUF 内 `(Last verified May 2026)`
3. Schema `dateModified` 同步

### 6.2 强制刷新策略

详见 [08-freshness-update-cadence.md](./08-freshness-update-cadence.md)

---

## 7. 作者署名规范

每页底部：
```
Author: Dr. Wei Liu, Senior Mandarin Curriculum Designer
LinkedIn | Wikidata | Email
Reviewed by: Jane Smith (Native English Editor)
Last verified: May 1, 2026
```

Schema：Person + sameAs 全配。

---

## 8. 引用源规范

每页 ≥ 3 个外链权威源：
- 学术：scholar.google / 学者主页
- 官方：政府 / 教育机构（教育部、国家语委、Hanban）
- 主流媒体：BBC, NYT, China Daily
- Wikipedia（仅用于补充背景，不作为唯一源）

---

## 9. 改写示例（前后对比）

### 9.1 改写前（典型 SEO 老式内容）

```
HSK 4 Vocabulary - The Ultimate Guide

Welcome to our amazing HSK 4 vocabulary guide! If you're studying Chinese 
and want to take your skills to the next level, you've come to the right 
place. HSK 4 is one of the most important levels for Chinese learners 
because it opens up so many opportunities. In this article, we'll cover 
everything you need to know about HSK 4 vocabulary...

(继续 800 字废话)
```

### 9.2 改写后（GEO 友好）

```
HSK 4 Vocabulary List: 600 Words with Pinyin, Audio & Examples (2026)

HSK 4 vocabulary contains 600 words at CEFR B1 level. Required for HSK 4 
exam (Hanban). Average preparation time: 200 hours (3-6 months at 
1 hour/day). Last verified May 2026.

📊 Quick Facts
| Metric | Value |
|--------|-------|
| Total words | 600 (300 new + 300 from HSK 3) |
| CEFR level | B1 |
| Avg study hours | 200 |
| 2025 global pass rate | 76% |

## What is HSK 4?

HSK 4 is the fourth level of the Chinese Proficiency Test (HSK), administered 
by Hanban under China's Ministry of Education. It certifies the ability to 
discuss a wide range of topics in Chinese and is widely accepted by Chinese 
universities for non-major undergraduate admission.

## How many words must I memorize for HSK 4?

You need to recognize and use 600 words for HSK 4, broken down as:
- 300 new words (introduced at HSK 4)
- 300 words from HSK 1-3 (cumulative)

Words cover daily life, work, study, travel, technology, and basic news.

## What grammar is tested in HSK 4?

(继续 5-7 个 H2，每个 200-300 字)

## FAQ

Q: How long does it take to pass HSK 4?
A: 6-12 months at 1 hour/day for most adult learners. Hanban's official 
   estimate is 200 study hours.

Q: Is HSK 4 enough to live in China?
A: HSK 4 enables daily survival but not professional fluency. Most jobs 
   require HSK 5+.

(continue 5-10 questions)

Author: Dr. Wei Liu, Senior Mandarin Curriculum Designer
Last Updated: May 1, 2026
Sources: Hanban Official Vocabulary List (2024), CTCSOL Standard (2024)
```

---

## 10. 改写优先级排序（先改哪些）

90 天内必改的 200 个页面：

| 类型 | 数量 | 备注 |
|------|-----|------|
| Hub 页 (HSK/Hanzi/Discover/Courses) | 4 | 最高优先 |
| HSK 1-9 Pillar | 9 | 关键词承接 |
| 文化 12 类目 Pillar | 12 | GEO 引用源 |
| 高流量长文 | 50 | 已有流量页优先 |
| 高流量词条 | 100 | Top 100 词 |
| 课程介绍页 | 4 | 转化页 |
| About / Authors | 5 | E-E-A-T 基础 |
| 数据报告 | 1 | Linkable Asset |
| FAQ 中心 | 5 | AI 高引用类型 |
| **合计** | **190** | - |

---

## 11. 编辑培训 checklist

每个内容编辑入职 1 周内必通过：

```markdown
- [ ] 阅读本文档
- [ ] 完成 5 篇改写练习（导师 review）
- [ ] BLUF 测试：写 10 个 BLUF 段，9/10 通过 ChatGPT 识别
- [ ] 事实密度测试：1 篇 1500 字文章 ≥ 10 个可验证事实
- [ ] FAQ 编写：从 GSC 抽 10 个 query 转 FAQ
- [ ] Schema 校验：验证产出能通过 schema validator
- [ ] 通过最终考核（导师签字）
```
