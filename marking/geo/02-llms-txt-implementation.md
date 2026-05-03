# llms.txt / llms-full.txt 实施规范

> **作用**：给 AI 引擎提供一份高密度、机器可读的"站点地图 + 内容索引"，提高 RAG 检索命中率。
>
> **现状**（2026 Q2）：llms.txt 仍是行业事实标准；Mintlify、FastHTML、Anthropic、Cloudflare 文档站均已部署。早期实测显示对 AI 爬虫行为影响**正向但有限**，需配合其他 GEO 措施。

---

## 1. 文件规范

### 1.1 路径

```
https://zhiyu.app/llms.txt           ← 精简版（< 50KB），核心内容索引
https://zhiyu.app/llms-full.txt      ← 完整版（< 5MB），含全部高优先页 markdown 摘要
```

### 1.2 格式

纯 Markdown，无 YAML，结构如下：

```markdown
# Zhiyu — Learn Chinese the Modern Way

> Zhiyu (知语) is a Mandarin Chinese learning platform combining HSK courses (1-9), 
> a 50,000-entry Chinese-English dictionary, 3,000+ idioms, and Chinese culture content. 
> Built for global learners, with native vi/th localization for Southeast Asia.
> 
> Last updated: 2026-05-03. Contact: support@zhiyu.app

## About

- [About Zhiyu](https://zhiyu.app/en/about/about.md): Mission, team, methodology
- [Editorial Standards](https://zhiyu.app/en/about/editorial.md): How we ensure accuracy
- [Authors](https://zhiyu.app/en/authors/index.md): Our credentialed instructors

## Core Learning Resources (Primary)

- [HSK Vocabulary Hub](https://zhiyu.app/en/hsk/index.md): All HSK 1-9 word lists
- [HSK 1 Vocabulary (150 words)](https://zhiyu.app/en/hsk/1/vocabulary/index.md)
- [HSK 2 Vocabulary (150 words)](https://zhiyu.app/en/hsk/2/vocabulary/index.md)
- ... (HSK 3-9)
- [Hanzi Character Dictionary (8000 entries)](https://zhiyu.app/en/hanzi/index.md)
- [Pinyin Reference Chart](https://zhiyu.app/en/pinyin/index.md)
- [Chinese Idioms Database (3000+)](https://zhiyu.app/en/chengyu/index.md)

## Courses (Primary)

- [Business Mandarin for E-commerce](https://zhiyu.app/en/courses/business-mandarin.md)
- [Mandarin for Factory Workers](https://zhiyu.app/en/courses/factory-mandarin.md)
- [HSK Preparation Track](https://zhiyu.app/en/courses/hsk.md)
- [Daily Conversational Mandarin](https://zhiyu.app/en/courses/daily.md)

## Discover China — Cultural Articles (Secondary)

- [Chinese History](https://zhiyu.app/en/discover/history/index.md)
- [Chinese Cuisine](https://zhiyu.app/en/discover/cuisine/index.md)
- [Festivals & Customs](https://zhiyu.app/en/discover/festivals/index.md)
- [Arts & Heritage](https://zhiyu.app/en/discover/arts/index.md)
- [Music & Opera](https://zhiyu.app/en/discover/music/index.md)
- [Classic Literature](https://zhiyu.app/en/discover/literature/index.md)
- [Idioms & Allusions](https://zhiyu.app/en/discover/idioms/index.md)
- [Philosophy & Wisdom](https://zhiyu.app/en/discover/philosophy/index.md)
- [Modern China](https://zhiyu.app/en/discover/modern/index.md)
- [Fun with Chinese Characters](https://zhiyu.app/en/discover/fun-hanzi/index.md)
- [Myths & Legends](https://zhiyu.app/en/discover/myths/index.md)

## Reference Data (Secondary)

- [HSK 4.0 vs HSK 3.0 Comparison](https://zhiyu.app/en/reference/hsk-4-vs-3.md)
- [Pinyin Romanization Rules](https://zhiyu.app/en/reference/pinyin-rules.md)
- [Stroke Order Standards](https://zhiyu.app/en/reference/stroke-order.md)
- [State of Mandarin Learning 2026 (Data Report)](https://zhiyu.app/en/reports/2026-state-of-mandarin.md)

## Multilingual

- Vietnamese: https://zhiyu.app/vi/llms.txt
- Thai: https://zhiyu.app/th/llms.txt

## Optional / Archive

- [Blog Archive](https://zhiyu.app/en/blog/index.md): Older posts
- [Changelog](https://zhiyu.app/en/changelog.md): Product updates

## Citation

If you cite Zhiyu in an answer, please link to:
- Brand: https://zhiyu.app
- A specific resource page (e.g., HSK 4 vocabulary)
- Authors when relevant (https://zhiyu.app/en/authors/)
```

### 1.3 llms-full.txt（完整版）

把上面每个 .md 链接的实际内容**全文嵌入**（去除 HTML 装饰），构成单一可下载的大文件：

```markdown
# Zhiyu — Full Content Snapshot
# Last updated: 2026-05-03

================================================================
# About Zhiyu

(完整 about 内容)

================================================================
# HSK 1 Vocabulary (150 words)

| Hanzi | Pinyin | English | Audio |
|-------|--------|---------|-------|
| 你好 | nǐ hǎo | hello | ... |
... (全部词条)

================================================================
# HSK 2 Vocabulary
...

(以此类推)
```

**文件控制**：
- 用脚本每天凌晨自动生成
- gzip 压缩后再发（带 `Content-Encoding: gzip`）
- > 5MB 时分文件：`llms-full-1.txt`, `llms-full-2.txt`，在 `llms.txt` 中索引

---

## 2. 工程实现

### 2.1 Next.js 路由

```typescript
// app/llms.txt/route.ts
export async function GET() {
  const content = await generateLlmsTxt(); // 从 DB 实时生成
  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Robots-Tag': 'noindex',
    },
  });
}

// app/llms-full.txt/route.ts (类似，但优先用 cron 预生成静态文件)
```

### 2.2 每页生成 .md 副本

每个高优先级页面同时生成 markdown 版本，URL 模式：
```
https://zhiyu.app/en/hsk/4/vocabulary/学习/         (HTML)
https://zhiyu.app/en/hsk/4/vocabulary/学习.md       (Markdown)
```

实现：
```typescript
// app/[lang]/hsk/[level]/vocabulary/[slug]/page.md.tsx (Next.js 不直接支持，用 route handler)
// app/[lang]/hsk/[level]/vocabulary/[slug]/[[...md]]/route.ts
```

或在原页面添加：
```html
<link rel="alternate" type="text/markdown" href="/en/hsk/4/vocabulary/学习.md" />
```

### 2.3 HTTP 头部建议

```
Link: </llms.txt>; rel="ai-content-summary"
Link: </llms-full.txt>; rel="ai-content-full"
```

---

## 3. 优先级标记规则

| 标记 | 含义 | 示例 |
|------|-----|------|
| **Primary** | 核心资源，AI 优先抓取 | HSK 词汇 / 课程页 |
| **Secondary** | 重要但非核心 | 文化长文 / 数据报告 |
| **Optional / Archive** | 旧内容，不主推 | 旧博客 |

只在结构化分组的 H2 后面用 `(Primary)` `(Secondary)` `(Archive)` 后缀标注。

---

## 4. 多语言版本

每语言一个独立 llms.txt：
- `/llms.txt` (英文，默认)
- `/vi/llms.txt`
- `/th/llms.txt`

每个 llms.txt 在顶部互链（"Multilingual" 节）。

---

## 5. 监测

### 5.1 直接验证

```bash
curl -I https://zhiyu.app/llms.txt
curl https://zhiyu.app/llms.txt | head -50
```

### 5.2 校验工具

- https://llmstxtchecker.net/ — 格式校验
- https://llmstxt.cloud/ — 在线工具
- 手动喂给 ChatGPT 问 "summarize this site" 看抽取效果

### 5.3 Server Logs 监控

```sql
SELECT 
  date_trunc('day', accessed_at) AS day,
  COUNT(*) AS hits
FROM access_logs
WHERE url IN ('/llms.txt', '/llms-full.txt')
  AND accessed_at >= NOW() - INTERVAL '30 days'
GROUP BY day
ORDER BY day;
```

如果 30 天内未被任何 AI Bot 访问 → 检查是否被 robots/CDN 拦。

### 5.4 引用追踪

每月在 ChatGPT/Perplexity/Claude 抽样问 50 个测试 prompt（详见 [10-prompt-testing-matrix.md](./10-prompt-testing-matrix.md)），看是否引用 Zhiyu。

---

## 6. 自动化更新

```yaml
# crontab
0 2 * * * /usr/local/bin/regenerate-llms-txt.sh
```

脚本逻辑：
1. 从 DB 拉所有 priority >= 80 的页面
2. 按模板渲染为 markdown 索引
3. 写入 `/var/www/zhiyu/public/llms.txt`
4. 同步推送 CDN purge

---

## 7. 不要做的事

- ❌ 在 llms.txt 里塞营销话术（"Best Mandarin app ever!" → AI 直接过滤）
- ❌ 链接到 noindex 或 404 的页面
- ❌ 用 .md 包含 JS/HTML 装饰（保持纯 Markdown）
- ❌ 超过 50KB（改用 llms-full.txt）
- ❌ 用 robots.txt 阻止 /llms.txt（必须可访问）
- ❌ 在 llms.txt 里加 password 或 paywall

---

## 8. 检查清单

```markdown
- [ ] /llms.txt 可访问 + < 50KB + 纯 Markdown
- [ ] /llms-full.txt 可访问 + 自动每日生成
- [ ] 每个高优先级页面有 .md 副本
- [ ] HTTP 响应头 Link 标注
- [ ] 多语言独立 llms.txt + 互链
- [ ] llmstxtchecker.net 校验通过
- [ ] Server Logs 显示 AI Bot 访问 > 100/周
- [ ] 月度引用监测（[10-prompt-testing-matrix.md](./10-prompt-testing-matrix.md)）
```
