# 内链架构：Hub → Pillar → Leaf 三层模型

> **核心理念**：把"5 万词条页 + 360 文化长文 + 36 课程页"变成一张紧密的、对 Googlebot 友好的网。

---

## 1. 三层模型

```
                       ┌───────────────────┐
                       │   Home (站根)      │
                       └─────────┬─────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                        ▼
   ┌─────────┐              ┌─────────┐              ┌─────────┐
   │  HUB 1  │              │  HUB 2  │              │  HUB 3  │
   │ /hsk/   │              │ /hanzi/ │              │/discover/│
   └────┬────┘              └────┬────┘              └────┬────┘
        │                        │                        │
   ┌────┴────┐              ┌────┴────┐              ┌────┴────┐
   ▼         ▼              ▼         ▼              ▼         ▼
┌────────┐┌────────┐    ┌────────┐┌────────┐    ┌────────┐┌────────┐
│PILLAR  ││PILLAR  │    │PILLAR  ││PILLAR  │    │PILLAR  ││PILLAR  │
│/hsk/4/ ││/hsk/5/ │    │/hanzi/ ││/hanzi/ │    │/cuisine││/festiv │
│        ││        │    │radical ││ stroke │    │        ││        │
└───┬────┘└───┬────┘    └───┬────┘└───┬────┘    └───┬────┘└───┬────┘
    │         │             │         │             │         │
   ...       ...           ...       ...           ...       ...
   LEAF      LEAF          LEAF      LEAF          LEAF      LEAF
   (5万词条页 / 360 长文 / 36 课程页)
```

---

## 2. 三层职责

| 层 | URL 模式 | 数量 | 主要职责 | SEO 角色 |
|----|---------|-----|---------|---------|
| **Hub** | `/hsk/`, `/hanzi/`, `/discover/`, `/courses/` | ~10 | 模块入口 + 总目录 + 内链汇集 | 高权重池 |
| **Pillar** | `/hsk/4/`, `/discover/cuisine/`, `/hanzi/radical/水/` | ~200 | 主题集合 + 内容索引 + 内链分发 | 主关键词承接 |
| **Leaf** | `/hsk/4/vocabulary/学习/`, `/discover/cuisine/peking-duck/` | ~50000 | 单一信息原子 | 长尾流量入口 |

---

## 3. 内链规则（铁律）

### 3.1 双向流动

- **Leaf → Pillar**：每 Leaf 页的 Breadcrumb + 文末"More in [Pillar]"
- **Pillar → Leaf**：Pillar 页必须列出至少 30 个 Leaf（分页）
- **Pillar ↔ Pillar**：相关 Pillar 之间至少 3 条互链
- **Hub → Pillar**：全部子 Pillar
- **Hub → Hub**：全局导航

### 3.2 锚文本规则

- 含目标关键词，不重复
- 不用通用词（"click here"、"learn more"）
- 不超过 7 字
- 同页面相同锚文本指向同一 URL（避免冲突）

### 3.3 内链密度

| 页面类型 | 最低 | 最高 |
|---------|-----|-----|
| Leaf | 3 | 20 |
| Pillar | 30 | 100 |
| Hub | 50 | 200 |

---

## 4. Hub 页设计要点

### 4.1 HSK Hub 示例 `/hsk/`

```
H1: HSK Levels 1-9: Complete Guide to Chinese Proficiency Test (2026)
BLUF + HSK 一览表

H2: All HSK Levels (内链 9 个 Pillar)
H2: Free HSK Vocabulary Lists (内链各级别词汇页)
H2: HSK Practice Tests
H2: HSK 3.0 vs HSK 4.0 vs CEFR (对比表)
H2: How to Register for HSK Exam (世界各考点)
H2: FAQ
```

### 4.2 文化 Hub 示例 `/discover/`

12 个 Pillar 卡片网格，按用户兴趣分群展示。

---

## 5. Pillar 页设计要点

### 5.1 HSK Pillar 示例 `/hsk/4/`

```
H1: HSK 4 Complete Guide: Vocabulary, Grammar, Practice & Tips
BLUF + Pass rate / 词汇量 / 学时

H2: HSK 4 Vocabulary (600 Words)
   → 内链 600 个 Leaf（按主题分 6 组、可分页）
H2: HSK 4 Grammar Points
H2: HSK 4 Practice Test
H2: How Long to Reach HSK 4
H2: Best Study Plan (链向课程页)
H2: HSK 4 Sample Questions
H2: FAQ
```

### 5.2 文化 Pillar 示例 `/discover/cuisine/`

```
H1: Chinese Cuisine: 8 Great Cuisines + 50 Iconic Dishes (2026)
H2: 8 Great Regional Cuisines (内链 8 个子文化长文)
H2: 50 Most Iconic Dishes (表格 + 链向 Leaf)
H2: Chinese Eating Etiquette
H2: Where to Find Authentic Chinese Food
H2: FAQ
```

---

## 6. 自动化内链生成

### 6.1 词条页内链组合（同前文）

每个 Leaf 页自动注入 20 条内链，由 SQL 计算：

```sql
-- 同 HSK 等级前 5
SELECT * FROM words WHERE hsk_level=4 ORDER BY frequency_rank LIMIT 5;

-- 含本字的词组前 5
SELECT * FROM compounds WHERE simplified LIKE '%学%' ORDER BY frequency_rank LIMIT 5;

-- 同部首前 3
SELECT * FROM words WHERE radical='子' AND id != current_id LIMIT 3;
```

### 6.2 文化长文内链推荐

发布时编辑选 5 篇相关文章 → 写进 `related_articles[]` 字段 → 模板渲染。

### 6.3 跨模块内链

- 文化长文末尾："想学相关词汇？" → 链向相关 HSK Pillar
- 词条页末尾："关于此字的文化故事" → 链向相关文化长文
- 课程页内："本课程涉及的核心字" → 链向 Hanzi Leaf

---

## 7. 反 Cannibalization

**问题**：5 万词条页中，会出现两页竞争同一关键词（如 `chinese character for love` 同时出现在 `/hanzi/爱/` 与 `/discover/symbols/love/`）。

**对策**：
1. 每个目标关键词只能 1 个 canonical（DB 约束）
2. 次要页 canonical 指向主要页
3. 用 GSC `Performance → Pages` 找出"多 URL 抢同一词"的情况，每月清理 1 次

---

## 8. 站内搜索优化

`/search` 页用 SSR + noindex，但内部站搜数据流向：
- 站搜 query → 进 `search_queries` 表
- 每周分析 Top 100 站搜词 → 反推内容缺口
- 自动生成"建议页面" → 内容团队补内容

---

## 9. 面包屑

每页必带 Breadcrumb（HTML + JSON-LD）：

```
Home > HSK > HSK 4 > Vocabulary > 学习 (xuéxí)
```

Schema：
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [...]
}
```

---

## 10. 检查工具

- **Screaming Frog**：每月跑全站爬取，看孤立页面（无内链指入）
- **Sitebulb**：内链密度热力图
- **Ahrefs Site Audit**：每周
- **GSC → Links**：每月 Export，看 Internal Top Linked Pages
