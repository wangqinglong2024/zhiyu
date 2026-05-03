# SEO 监测与 KPI 体系

> **原则**：每个 KPI 都有：① 数据源 ② 采集频率 ③ 阈值 ④ 责任人 ⑤ 异常告警动作。

---

## 1. KPI 总表

| 层级 | KPI | 数据源 | 频率 | 90 天目标 | 责任 |
|-----|-----|-------|-----|----------|------|
| **流量** | 自然搜索 UV | GA4 | 日 | 50 万/月 | 数据 |
| **流量** | 自然搜索 PV | GA4 | 日 | 200 万/月 | 数据 |
| **流量** | AI 流量（Direct/Unassigned 异常增长） | GA4 + Server Logs | 周 | +50% MoM | 数据 |
| **展现** | GSC 月展示量 | GSC | 日 | 500 万 | 数据 |
| **展现** | 平均位置 | GSC | 周 | < 25 | 数据 |
| **覆盖** | 已索引页面 | GSC Coverage | 周 | 4 万 + | 工程 |
| **覆盖** | Crawled-not-indexed | GSC | 周 | < 5000 | 工程 |
| **质量** | CWV P75 LCP/INP/CLS | CrUX | 日 | 全绿 | 工程 |
| **质量** | Schema 错误数 | Schema Validator | 周 | 0 | 工程 |
| **关键词** | Top 10 关键词数 | Ahrefs | 周 | 5000 | 数据 |
| **关键词** | Top 3 关键词数 | Ahrefs | 周 | 500 | 数据 |
| **链接** | Referring Domains | Ahrefs | 周 | 200 | PR |
| **链接** | DR 60+ 外链 | Ahrefs | 周 | 30 | PR |
| **CTR** | GSC 平均 CTR | GSC | 周 | > 3% | 内容 |
| **转化** | SEO → APP 注册 | GA4 + 后端 | 日 | 30000 | 全员 |
| **转化** | SEO → 付费转化（Pro） | GA4 + 后端 | 日 | 数据驱动 | 全员 |

---

## 2. 仪表盘工具栈

| 工具 | 用途 | 月费 |
|------|-----|------|
| **GSC** | Query/Page/Coverage/CWV | 免费 |
| **GA4** | 流量/事件/转化 | 免费 |
| **Bing Webmaster** | Bing/DDG 数据 | 免费 |
| **Ahrefs Standard** | 关键词/反链/排名追踪 | $249 |
| **SEMrush Guru** | 第二数据源对照 | $250 |
| **Surfer SEO** | 内容评分 | $89 |
| **Screaming Frog** | 全站爬取 | $259/年 |
| **Microsoft Clarity** | 用户行为 + Heatmap | 免费 |
| **Looker Studio** | 自定义仪表盘 | 免费 |
| **BigQuery / ClickHouse** | Server Logs 分析 | $50-200 |
| 合计 | - | **~$650/月** |

---

## 3. 周报模板（每周一上午 10 点发出）

```markdown
# Zhiyu SEO 周报 — Week N

## 1. 本周关键变化
- 自然搜索 UV: +X% (YoY +X%)
- 新进 Top 10 关键词: 23 (本周 +5)
- 跌出 Top 10 关键词: 4 (本周 -2)
- 新增反链 DR60+: 3
- AI Bot 访问量: +18% WoW

## 2. 流量明细
| 模块 | UV | 周环比 |
|------|-----|-------|
| /hsk/ | ... | ... |
| /hanzi/ | ... | ... |
| /discover/ | ... | ... |
| /courses/ | ... | ... |

## 3. 关键词追踪（Top 50）
... 表格

## 4. 索引覆盖
- 已提交 sitemap: X
- 已索引: X (覆盖率 X%)
- Crawled-not-indexed: X
- Excluded: X

## 5. 性能
- 移动端 P75 LCP: X.Xs
- 移动端 P75 INP: Xms
- 移动端 P75 CLS: 0.0X

## 6. 风险与异常
- ⚠️ /hsk/4/ Crawled-not-indexed 上升 → 内容审核
- ⚠️ Cloudflare 拦了 GPTBot 12 小时 → 已修复

## 7. 下周计划
- [ ] ...
```

---

## 4. 月度深度报告

每月 5 号发出，包含：
1. KPI 完成度对照
2. 流量来源拆分（搜索引擎 / AI / 社交 / 直接）
3. 关键词竞争对手对比（Ahrefs Content Gap）
4. 反链质量审计
5. 内容 ROI 排行（哪些页面带来最多转化）
6. CWV 趋势 + 修复建议
7. 下月主攻方向

---

## 5. 自动告警规则

部署到飞书机器人 / 邮件：

| 异常 | 阈值 | 动作 |
|------|-----|------|
| 自然搜索 UV 日环比 < -20% | 1 天 | 立刻告警 |
| GSC Coverage Error > 100/天 | 单日 | 告警 + 工程查 |
| 任意 Top 50 关键词跌出 Top 50 | 实时 | 告警 + 内容查 |
| Server Log AI Bot 周访问 < -30% | 周 | 告警 + 检查 robots/CDN |
| Sitemap 返回非 200 | 实时 | P0 |
| CWV P75 任一指标退化 > 20% | 日 | 告警 + 工程查 |
| Schema 校验错误 > 50/全站 | 周 | 告警 + 内容查 |

---

## 6. 归因模型

由于 AI 流量难追踪，知语统一用：

- **GA4 Default**：Last Click（看 attributable 部分）
- **数据驱动**：Data-Driven Attribution（GA4 已默认）
- **复合**：自建表追踪"AI 引用 → 站访问 → 注册"漏斗

复合表字段：
```
date | source | medium | landing_url | sessions | new_users | signups | conversions
```

每周对比"Direct 流量"激增 → 反推 AI 推荐量。

---

## 7. 实验框架（A/B Test）

每月至少 2 个 SEO 实验：
- 标题改写 → CTR
- BLUF 上下移动 → 引用率
- Schema 加 / 减 → Rich Result 出现率
- 内链密度变化 → 排名

工具：Vercel A/B Testing / VWO（注意：URL 不变只测内容更安全，避免 Google 看到不一致）

---

## 8. 90 天里程碑表

| 周 | 流量 UV/月 | 索引页 | Top 10 词 | 反链 DR60+ |
|---|----------|-------|----------|----------|
| W2 | <1000 | 100 | 0 | 0 |
| W4 | 5000 | 1000 | 10 | 2 |
| W6 | 20000 | 5000 | 100 | 5 |
| W8 | 80000 | 15000 | 500 | 10 |
| W10 | 200000 | 30000 | 1500 | 18 |
| W12 | 400000 | 45000 | 3500 | 25 |
| W13 | **500000** | **50000** | **5000** | **30** |
