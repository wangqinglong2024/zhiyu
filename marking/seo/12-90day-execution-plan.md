# 90 天 SEO 执行甘特图

> **目标**：D90 月自然 UV ≥ 50 万、索引页 ≥ 5 万、Top 10 关键词 ≥ 5000。

---

## 第 1 周：技术地基

| 任务 | 责任 | 交付 |
|-----|------|-----|
| Cloudflare 关闭 Block AI Bots | 工程 | 截图验证 |
| robots.txt + sitemap.xml 上线 | 工程 | URL 可访 |
| GSC + Bing Webmaster + Yandex 验证 | 数据 | 后台截图 |
| GA4 + GTM + Clarity 接入 | 数据 | 接收数据 |
| Server Logs → ClickHouse pipeline | 工程 | 仪表盘 |
| Lighthouse CI 集成 | 工程 | PR 自动跑 |
| Ahrefs / SEMrush 账号开通 | 数据 | 登录 |

## 第 2 周：On-Page 框架

| 任务 | 责任 |
|-----|------|
| Next.js metadata 工厂函数 | 工程 |
| JsonLd 组件 + 全局 Organization/WebSite Schema | 工程 |
| 多语言路由 + hreflang 组件 | 工程 |
| /llms.txt + /llms-full.txt v1 | 工程 + 内容 |
| 5 大页面模板上线 | 工程 + 内容 |
| 关键词种子 8000 词导出 | 数据 |

## 第 3-4 周：种子内容 + 词条页 v1

| 任务 | 责任 |
|-----|------|
| 20 篇 Pillar 长文上线（HSK 1-9 + 5 文化主题）| 内容 |
| 1000 个 HSK 1-3 词条页（人工编写） | 内容 + 数据 SEO |
| 内链网络自动生成 | 数据 SEO |
| sitemap 多文件分割 | 工程 |
| GSC 提交 sitemap | 数据 |
| IndexNow 推送脚本上线 | 工程 |

## 第 5-6 周：Programmatic 扩量 v1

| 任务 | 责任 |
|-----|------|
| 词条页扩到 5000 | 数据 SEO |
| 汉字字典 1000 字上线 | 数据 SEO + 内容 |
| 成语典故 500 篇上线 | 内容 + 数据 SEO |
| 越南语 hreflang 部署 + 200 词 vi 翻译 | 内容 + 工程 |
| 第一批 5 篇 Guest Post outreach | PR |
| 数据报告"State of Mandarin Learning 2026" 启动撰写 | 内容 |

## 第 7-8 周：Programmatic 扩量 v2 + 链接

| 任务 | 责任 |
|-----|------|
| 词条页扩到 15000 | 数据 SEO |
| Wikipedia 词条提案撰写 | 内容 + PR |
| HARO/Featured 答 5/天 | PR |
| Reddit r/ChineseLanguage AMA 准备 | 社区 |
| 数据报告完成并 PR Newswire 发布 | PR |
| Surfer SEO Top 100 关键词内容评分 + 优化 | 内容 |

## 第 9-10 周：放量

| 任务 | 责任 |
|-----|------|
| 词条页扩到 30000 | 数据 SEO |
| 越南语词条扩到 2000 | 内容 |
| 泰语 hreflang 部署 + 500 词 th 翻译 | 内容 + 工程 |
| Reddit AMA 执行 + 后续帖子运营 | 社区 |
| Skyscraper 内容 5 篇 | 内容 + PR |
| YouTube 频道开通 + 30 条 Shorts 上线 | 视频 |

## 第 11-12 周：质量优化

| 任务 | 责任 |
|-----|------|
| 词条页扩到 50000 | 数据 SEO |
| 抽样 500 页人工审核 + 改进 | 内容 |
| Schema 全站校验 + 修复 | 工程 |
| CWV 全站优化（P75 全绿）| 工程 |
| 反链审计 + Disavow | PR |

## 第 13 周：复盘

| 任务 | 责任 |
|-----|------|
| 90 天 KPI 完成度复盘 | 负责人 |
| 关键词差距分析 → 下季度计划 | 数据 |
| Helpful Content 自检 | 工程 + 内容 |
| 下一阶段 90 天计划 | 全员 |

---

## 资源调度

```
              │ W1-2 │ W3-4 │ W5-6 │ W7-8 │ W9-10│ W11-12│ W13 │
工程师        │ ███  │ ██   │ ██   │ ██   │ ██   │  █    │  █  │
内容 ×2       │ █    │ ███  │ ███  │ ███  │ ███  │ ██    │  █  │
数据 SEO      │ ██   │ ██   │ ███  │ ███  │ ███  │ ██    │  █  │
PR/社区       │      │      │ ██   │ ███  │ ███  │ ██    │  █  │
视频          │      │      │      │ █    │ ██   │ ██    │  █  │
数据分析      │ ██   │ █    │ █    │ █    │ █    │ ██    │ ██  │
```

---

## 风险预案

| 风险 | 应对 |
|------|-----|
| W4 词条上线后 GSC Coverage 大量 not-indexed | 增加内链 + 内容质量；用 IndexNow 强推；URL Inspection API 手推 |
| W6 Helpful Content 算法更新冲击 | 暂停 Programmatic 扩量；抽样审核；增加独占内容比例 |
| W8 Cloudflare 误拦 AI Bot | 立刻修；用 cf-ray 日志分析 |
| W10 服务器抗不住流量峰值 | 启用边缘缓存；升级 Vercel/Tencent Cloud 计划 |
| W12 反链质量被 Ahrefs 标"toxic" | 立刻 Disavow；调整 outreach 策略 |
