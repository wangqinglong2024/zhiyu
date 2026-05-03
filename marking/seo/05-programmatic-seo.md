# Programmatic SEO：5 万词条页规模化实施

> **目标**：90 天内上线 5 万结构化词条页，覆盖 100 万 + 长尾词，**月增 50 万自然 UV**。
>
> **关键风险**：Google Helpful Content Update (2026) 会判定"千篇一律的低质程序化页面"为 **Scaled Content Abuse** → 全站受罚。本文重点是**质量门控**。

---

## 1. 4 大词条页族

| 族 | 数据源 | 数量 | 模板 | 优先级 |
|----|--------|-----|------|--------|
| **HSK 词典** | 5 万知识点（已有） | ~10000 唯一词 | 详见 [04-onpage-content-template.md](./04-onpage-content-template.md) 模板 1 | P0 |
| **汉字字典** | 通用汉字库 | 8000 单字 | 模板 1 变体 | P0 |
| **拼音字典** | 拼音库 | 4000 拼音 | 模板 1 变体 | P1 |
| **成语典故** | 3000 + 成语库 | 3000 | 模板 2 | P0 |
| 合计 | - | **~25000 唯一页** | - | - |

**多语言扩张**：每页 × 4 语言（en/vi/th/id） = 10 万页。但 **MVP 阶段先做 en + vi 两语言 = 5 万页**。

---

## 2. 数据 → 页面的工程管线

### 2.1 数据准备

```
PostgreSQL `words` 表
  ├── id, simplified, traditional, pinyin
  ├── hsk_level, frequency_rank, radical
  ├── definition_en, definition_vi, definition_th
  ├── examples (jsonb): [{zh, pinyin, en, audio_url}, ...]
  ├── etymology_md, cultural_notes_md
  ├── related_words[] (foreign keys)
  ├── faq[] (jsonb)
  ├── created_at, updated_at, reviewed_at, reviewer_id
  └── quality_score (0-100, 由后台脚本算)
```

### 2.2 模板渲染（Next.js）

```
app/[lang]/hsk/[level]/vocabulary/[slug]/page.tsx
  → ISR revalidate: 7 天
  → 从 DB 拉数据 → 渲染 + 注入 JSON-LD
  → 自动生成内链（同 HSK 等级 5 个 + 含此字的词组 5 个）
```

### 2.3 索引推送

- 上线时分批写入 sitemap-hsk.xml / sitemap-hanzi.xml ...
- 每生成 100 页，调用 Bing IndexNow API 批量推送
- 用 GSC URL Inspection API 每天推 200 个高优先级（配额限制）

---

## 3. **质量门控系统**（最核心、必读）

### 3.1 单页 quality_score 算法

```
quality_score = (
  data_completeness * 0.30  +  // 字段填充率（拼音/释义/例句/字源等）
  example_count * 0.20      +  // 例句数量（>= 5 满分）
  unique_value * 0.30       +  // 是否含独占信息（字源/文化注解/笔顺动画）
  internal_links * 0.10     +  // 内链 3-7 条得分
  external_refs * 0.10         // 至少 1 个权威外链
) * 100

阈值：
  >= 70: 上线
  50-69: 标 noindex，等内容补全
  < 50:  不生成页面，回写 DB 状态
```

### 3.2 全站 Crawl Budget 保护

- 上线前 1000 页：**全部 100% 人工 review**
- 1001-10000 页：**抽样 5% review**（500 页）
- 10001-50000 页：**抽样 1% review**（500 页）+ 算法门控
- 任意页面在 GSC "Crawled - currently not indexed" 超过 90 天 → 标 noindex / 合并 / 删除

### 3.3 防"千篇一律"的 5 项硬规则

每个词条页**必须**满足：

1. **独占内容 ≥ 30%**（字源、典故、文化注解，是 LLM/用户都买账的"信息增益"）
2. **例句 ≥ 5 条且唯一**（不能多页共享相同例句）
3. **内链 ≥ 3 条且锚文本不同**（每页内链组合不重复）
4. **配图 ≥ 1 张**（笔顺 SVG / 字源插图 / 例句配图）
5. **作者署名 + 时间戳 + 评审记录**

### 3.4 Helpful Content 自检脚本

每周一跑：
```
SELECT COUNT(*) AS suspicious
FROM word_pages
WHERE quality_score < 60
   OR length(unique_content_md) < 200
   OR examples_count < 5
   OR last_review_date < NOW() - INTERVAL '180 days';
```

任意 > 5% → 暂停新页生成、紧急补内容。

---

## 4. 内容生成的 3 种来源（按可靠性排序）

### 4.1 来源 A：人工编写（最可靠）
- HSK 1-3 全部 1500 词：**100% 人工编写**（含字源、文化注解、原创例句）
- 1500 词 × 4 小时 / 词 = 6000 小时 ≈ 3 个全职编辑 × 4 个月
- 这部分是知语的"内容护城河"，不能省

### 4.2 来源 B：权威数据源 + 人工审核
- HSK 4-9 词、3500-8000 汉字：从权威数据源（CC-CEDICT、Unihan、教育部资料）导入 → 人工抽样 + 补充字源/文化
- 抽样比例 ≥ 10%

### 4.3 来源 C：AI 辅助 + 强人工审核（**慎用**）
- 仅用于：例句改写、FAQ 生成、字源叙事润色
- **绝不允许**：AI 生成定义/读音/笔顺等事实数据
- 每条 AI 输出必须人工 review 才能入库（不能"AI 生成 + 直接发布"）
- 用 ZeroGPT / Originality.ai 检测 AI 痕迹（>50% AI 重写）

> **教训**：2024 年大量 Programmatic SEO 站点因 100% AI 生成被 Google Helpful Content 砸下 -90% 流量。**知语死也不要走这条路**。

---

## 5. 内链网络生成（自动）

每个词条页自动注入：

| 内链组 | 数量 | 算法 |
|--------|-----|------|
| 同 HSK 等级 | 5 | 按 frequency_rank 取前 5 |
| 含本字的词组 | 5 | DB join words_compounds |
| 同部首字 | 3 | DB join radicals |
| 拼音相近 | 3 | DB join pinyin_normalized |
| Hub 页 / Pillar 页 | 2 | 固定（HSK 等级页 + 字典首页） |
| 上一字 / 下一字 | 2 | 按 frequency_rank ±1 |

合计 20 条内链 + Breadcrumb 4 条。

锚文本规则：
- 不要 "click here" / "this word"
- 用关键词：`HSK 4: 学习 (xuéxí) — to study`

---

## 6. 多语言扩张策略

### 6.1 阶段 1（D0-D45）：英语 50000 页 + 越南语 5000 页
- 越南语只翻译最高优先级 5000 词（覆盖 HSK 1-3 + 高频汉字）
- 用专业越语母语人审核（不要 100% 机翻）

### 6.2 阶段 2（D46-D90）：泰语 / 印尼语扩展
### 6.3 阶段 3（>D90）：英语扩到 80000 + 4 语种全覆盖

每语言独立 sitemap、独立 GSC property、独立 hreflang。

---

## 7. 失败案例避坑

| 案例 | 失败原因 | 知语对策 |
|-----|--------|---------|
| 某英语成语网站 5 万页 | 100% 模板复制、定义抄维基 | 强制独占字源 + 文化注解 |
| 某 HSK 学习站 8000 页 | 例句全 AI 生成、错误百出 | 例句必须人工或权威源 |
| 某拼音字典 4000 页 | 内链全是首页 + 缺少 Hub | 30 条内链 + Hub/Pillar 双向 |
| 某汉字工具站 10000 页 | 加载慢（每页 5 个 fetch） | SSG + 数据预生成 |
| 某竞品 2024 年被 HCU 砸 -85% 流量 | AI 内容、零原创 | 抽样人工 + AI 检测 |

---

## 8. 工程交付清单

```markdown
- [ ] PostgreSQL words 表完整 schema（含 quality_score）
- [ ] 数据导入脚本（CC-CEDICT + Unihan + 教育部）
- [ ] AI 辅助生成 API（仅例句改写 + FAQ 生成）
- [ ] 单页模板（含 20 内链 + Schema + BLUF）
- [ ] 批量生成脚本（每批 1000 页）
- [ ] quality_score 算分脚本（每日跑）
- [ ] 抽样审核后台（编辑用）
- [ ] noindex / 合并 / 删除批处理脚本
- [ ] sitemap 自动分文件
- [ ] IndexNow / GSC API 推送 worker
- [ ] HCU 自检周报
- [ ] AI 内容检测集成（ZeroGPT API）
```

---

## 9. 关键 KPI（每周看板）

| KPI | 目标（D90） |
|-----|------------|
| 生成页面数 | 50000 |
| 已索引页面（GSC Coverage） | ≥ 80%（4 万） |
| 月均 GSC 展示量 | ≥ 500 万 |
| 月均自然搜索 UV | ≥ 50 万 |
| AI Bot 周访问 | ≥ 50 万次 |
| quality_score 平均 | ≥ 75 |
| 抽样审核通过率 | ≥ 90% |
| HCU 异常告警次数 | 0 |

---

## 10. 与 GEO 的协同

每个词条页同时是 GEO 引用源。要确保：
- BLUF 段直接对应 LLM 抽取的"短答"（参见 [../geo/03-content-bluf-semantic-chunking.md](../geo/03-content-bluf-semantic-chunking.md)）
- 表格数据 LLM 能直接读取（不要图片表格）
- FAQ Schema 内容 = LLM 训练语料偏好的 QA 对
- 时间戳让 LLM 优先选近 1 年内容
- 在 /llms.txt 中把 vocabulary hub 标 Primary
