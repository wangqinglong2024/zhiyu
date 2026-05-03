# AI 引用监测系统与 KPI

> **行业难题**：GA4 把 AI 引用流量归类为 "Direct/Unassigned"。要靠**自建工具**才能追踪。

---

## 1. 监测体系总览

```
┌────────────────────────────────────────────────┐
│            AI Citation Monitoring Stack         │
├────────────────────────────────────────────────┤
│  Layer 1: Server Logs (AI Bot 抓取行为)         │
│    → AI Bot 访问什么页面、频率、UA 分布          │
├────────────────────────────────────────────────┤
│  Layer 2: Prompt Testing Matrix (引用率)        │
│    → 200 prompt × 6 引擎 × 周频                 │
├────────────────────────────────────────────────┤
│  Layer 3: Mention Monitoring (品牌提及)         │
│    → Brand24/Mention 全网 Zhiyu 提及            │
├────────────────────────────────────────────────┤
│  Layer 4: Referral Anomaly (流量归因)           │
│    → GA4 Direct 流量异常增长 = AI 转化代理       │
└────────────────────────────────────────────────┘
```

---

## 2. Layer 1：AI Bot 抓取日志

### 2.1 数据收集

Nginx access log → ClickHouse / BigQuery：

```sql
CREATE TABLE ai_bot_logs (
  ts DateTime,
  bot_name String,        -- GPTBot, ClaudeBot, etc.
  ua String,
  url String,
  status UInt16,
  bytes UInt32,
  ip String
) ENGINE = MergeTree() ORDER BY ts;
```

### 2.2 周报 SQL

```sql
-- 每 Bot 周抓取量
SELECT bot_name,
       COUNT(*) AS hits,
       COUNT(DISTINCT url) AS unique_pages,
       SUM(bytes) AS bytes
FROM ai_bot_logs
WHERE ts >= now() - INTERVAL 7 DAY
GROUP BY bot_name
ORDER BY hits DESC;

-- Top 抓取页面
SELECT url, COUNT(*) AS hits
FROM ai_bot_logs
WHERE ts >= now() - INTERVAL 7 DAY AND bot_name='GPTBot'
GROUP BY url
ORDER BY hits DESC LIMIT 50;
```

### 2.3 告警

- 任意 Bot 周抓取量环比 < -30% → 检查 robots/CDN
- 任意 Bot 收到 > 10% 4xx/5xx → 工程查
- 新 Bot UA 出现（如 NewLLMBot）→ 调研是否放行

---

## 3. Layer 2：Prompt Testing Matrix

详见 [10-prompt-testing-matrix.md](./10-prompt-testing-matrix.md)。核心：
- 200 prompt 覆盖知语全部业务关键词
- 每周一在 6 引擎跑一次
- 自动判定是否引用 Zhiyu（URL / 品牌名匹配）
- 输出"引用率"指标（被引用 prompt 数 / 总 prompt 数）

---

## 4. Layer 3：品牌提及监测

工具：Brand24 / Mention.com

每日抓全网（Reddit / Twitter / Medium / 新闻 / 博客）：
- 包含 "Zhiyu" / "知语" / "zhiyu.app" 的内容
- 自动情感分析
- 检测错描述 → 进入 [07-entity-harmonization.md](./07-entity-harmonization.md) 修复流程

---

## 5. Layer 4：流量归因异常

GA4 + 后端日志关联分析：

```sql
-- 自建表 events
SELECT date,
       SUM(IF(source='direct',1,0)) AS direct,
       SUM(IF(source='organic',1,0)) AS organic,
       SUM(IF(landing_page LIKE '/en/hsk/%',1,0)) AS hsk_landing
FROM events
WHERE date >= '2026-04-01'
GROUP BY date
ORDER BY date;
```

如果 Direct 流量周增长 > 30% 且**主要落地页是文化长文 / 词条页**（非首页）→ 大概率 AI 引用流量增长。

---

## 6. KPI 总表

| KPI | 数据源 | 频率 | D90 目标 |
|-----|-------|-----|---------|
| AI Bot 周抓取量 | Server Logs | 周 | 1M+ hits |
| GPTBot 抓取页 | Server Logs | 周 | 30K+ unique pages |
| 200 prompt 引用率 (整体) | Prompt Matrix | 周 | ≥ 30% |
| ChatGPT 引用率 | Prompt Matrix | 周 | ≥ 25% |
| Perplexity 引用率 | Prompt Matrix | 周 | ≥ 40% |
| Google AIO 引用率 | Prompt Matrix | 周 | ≥ 20% |
| 全网月度 Mention | Brand24 | 月 | ≥ 500 |
| Mention 一致性 | Brand24 | 月 | ≥ 95% |
| Direct 流量月增长 | GA4 | 月 | > 50% MoM |

---

## 7. AI Citation 仪表盘（Looker Studio）

按周更新的可视化看板，5 个区块：
1. AI Bot 抓取趋势（折线，按 Bot 分色）
2. Top 100 被引页面（柱状）
3. 200 prompt 引用率 × 6 引擎（热力图）
4. 月度 Mention 数 + 情感（饼+折线）
5. Direct 流量增长 vs SEO 流量增长（双折线）

---

## 8. 月度复盘报告

每月 5 号发：
- AI 引用率变化原因分析
- 哪些内容刷新带来引用率提升
- 哪些 prompt 失去引用、需补内容
- 竞品引用率对比（用同样 prompt 看竞品出现频率）

---

## 9. 工具栈成本

| 工具 | 月费 |
|-----|-----|
| ClickHouse 自托管 | ~$30 |
| Brand24 | $99 |
| Looker Studio | 免费 |
| OpenAI API（prompt 测试）| ~$50 |
| Anthropic API | ~$50 |
| Perplexity API | ~$50 |
| Google AIO 抓取（自建脚本 + Bright Data 代理）| ~$200 |
| 合计 | ~$480 |
