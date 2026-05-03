# Next.js 技术 SEO 完整清单（2026 版）

> **适用栈**：Next.js 14+ (App Router) + React 18+ + Vercel/Tencent Cloud
>
> **目标**：交付一个对 Googlebot / Bingbot / GPTBot / ClaudeBot / PerplexityBot 全部友好的站点。
>
> **检查方式**：每项后提供"如何验证"。

---

## 0. P0 必做清单（48 小时内完成评估）

| # | 项目 | 验证方法 | 状态 |
|---|------|---------|------|
| 1 | 全站强制 HTTPS + HSTS | curl -I 看 `Strict-Transport-Security` | ☐ |
| 2 | 关键页全部 SSR 或 SSG（不要 CSR） | 禁用 JS 后 view-source 看正文是否存在 | ☐ |
| 3 | sitemap.xml 自动生成且分文件 | 访问 /sitemap.xml | ☐ |
| 4 | robots.txt 放行 + 列出 sitemap | 访问 /robots.txt | ☐ |
| 5 | hreflang 全语言版本配置 | view-source 看 `<link rel="alternate" hreflang>` | ☐ |
| 6 | canonical 唯一 | 每页只有 1 个 `<link rel="canonical">` | ☐ |
| 7 | JSON-LD Schema 在初始 HTML 中 | view-source 看 `<script type="application/ld+json">` | ☐ |
| 8 | Open Graph + Twitter Card | view-source 看 og:* / twitter:* | ☐ |
| 9 | LCP < 2.5s, INP < 200ms, CLS < 0.1 | PageSpeed Insights | ☐ |
| 10 | GSC + GA4 + Bing Webmaster 接入 | 后台验证 | ☐ |
| 11 | /llms.txt + /llms-full.txt 上线 | 访问验证 | ☐ |
| 12 | AI 爬虫 UA 白名单（不被 Cloudflare 拦） | 用 GPTBot UA 测试 curl | ☐ |

---

## 1. 渲染策略（最关键）

### 1.1 何时用 SSG / ISR / SSR / CSR

| 页面类型 | 推荐 | 原因 |
|---------|------|------|
| 首页、品牌页 | **SSG** | 静态、CDN 缓存极快 |
| 词条页（5 万）| **SSG + ISR** (revalidate: 7d) | 量大、低频更新 |
| 文化长文（360） | **SSG + ISR** (revalidate: 1d) | 中频更新 |
| 课程目录页 | **SSG + ISR** (revalidate: 1h) | 半动态 |
| 个人中心、学习记录 | **CSR** (no SEO) | 用户私有 |
| 搜索结果页 | **SSR** + noindex | 动态 + 不索引 |
| 排行榜 | **ISR** (revalidate: 5m) | 动态但需 SEO |

### 1.2 Next.js App Router 实现要点

```typescript
// app/words/[hsk]/[word]/page.tsx
export const revalidate = 604800; // 7 天 ISR

export async function generateStaticParams() {
  // 预生成 5 万词条页 — 但分批
  const top1k = await db.words.findMany({
    where: { priority: { gte: 80 } },
    take: 1000,
  });
  return top1k.map(w => ({ hsk: `hsk${w.level}`, word: w.slug }));
  // 其余 49000 页用 ISR 按需生成（首访 SSR、之后静态）
}

export async function generateMetadata({ params }) {
  // 必须返回完整 metadata + alternates（hreflang）+ openGraph
}
```

### 1.3 客户端渲染陷阱（要避免）

❌ **不要做**：
- 用 `useEffect` 在客户端 fetch 后才显示正文
- 用 Tabs/Accordion 折叠核心内容（AI 爬虫读不到）
- 把 H1 / 主表格放在 `<Suspense>` 的 fallback 中
- 用 `next/dynamic({ ssr: false })` 包关键内容

✅ **正确做法**：
- 折叠组件用纯 CSS `details/summary`，HTML 中保留全文
- 重要交互组件做 SSR，hydration 后接管交互
- 图片用 `<Image priority>` 标记 LCP 元素

---

## 2. URL 结构

### 2.1 推荐 URL 形态

```
https://zhiyu.app/                        # 首页（语言通过 cookie/header 决定）
https://zhiyu.app/en/                     # 英文首页
https://zhiyu.app/en/hsk/                 # HSK Hub
https://zhiyu.app/en/hsk/4/               # HSK 4 Pillar
https://zhiyu.app/en/hsk/4/vocabulary/    # HSK 4 词汇 Pillar
https://zhiyu.app/en/hsk/4/vocabulary/learn-eat-chi/  # 单词条 Leaf
https://zhiyu.app/en/hanzi/福/             # 单字页（URL 含汉字 OK，UTF-8 编码）
https://zhiyu.app/en/pinyin/ma/           # 拼音页
https://zhiyu.app/en/chengyu/hua-she-tian-zu/  # 成语页
https://zhiyu.app/en/discover/cuisine/peking-duck/  # 文化长文
https://zhiyu.app/en/courses/business-mandarin/    # 课程页
https://zhiyu.app/vi/hsk/4/               # 越南语版
https://zhiyu.app/th/hsk/4/               # 泰语版
```

### 2.2 URL 规则

- **全小写**（除汉字外）
- **用 `-` 不用 `_`**
- **不带尾随 `index.html`**
- **不带查询参数**（`?utm_*` 只用于追踪、必须 canonical 到无参数版本）
- **slug 简短、含主关键词**
- **层级 ≤ 4 层**

### 2.3 canonical 与重复内容

- `/hsk/4/` 与 `/hsk/4` → 301 到带斜杠版本（在 `next.config.js` 设置 `trailingSlash: true`）
- 分页：`/blog?page=2` → canonical 指向 `/blog?page=2`（自身），但与 `/blog` 用 prev/next（虽然 Google 已弃用，但语义清晰）
- 多语言：每页 canonical 指向**自身语言版本**，hreflang 指向所有版本

---

## 3. Sitemap 体系

### 3.1 多 sitemap 拆分

```
/sitemap.xml              ← Sitemap Index
  ├── /sitemap-pages.xml          (静态页 ~50)
  ├── /sitemap-discover.xml       (360 文化长文)
  ├── /sitemap-hsk.xml            (HSK 词条 ~10000)
  ├── /sitemap-hanzi.xml          (汉字页 ~8000)
  ├── /sitemap-hanzi-2.xml        (汉字页第二批)
  ├── /sitemap-chengyu.xml        (成语 ~3000)
  ├── /sitemap-pinyin.xml         (拼音 ~4000)
  ├── /sitemap-courses.xml        (课程页)
  └── /sitemap-images.xml         (图片 sitemap)
```

每个 sitemap 文件 ≤ 50000 URL，≤ 50MB。

### 3.2 自动生成（Next.js）

```typescript
// app/sitemap.ts (Next.js 14+ 内置支持)
export default async function sitemap() {
  const words = await db.words.findMany({ select: { slug: true, updatedAt: true } });
  return words.map(w => ({
    url: `https://zhiyu.app/en/hsk/${w.level}/vocabulary/${w.slug}/`,
    lastModified: w.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));
}
```

### 3.3 提交渠道

- Google Search Console（手动提交 + 自动重新抓取）
- Bing Webmaster Tools（同样提交）
- Yandex Webmaster（俄罗斯/东欧用户用）
- IndexNow（POST 到 `https://api.indexnow.org/indexnow`，Bing/Yandex/Naver 联盟瞬时索引）

---

## 4. robots.txt

```txt
# /robots.txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /user/
Disallow: /search?
Disallow: /*.json$

# AI 爬虫显式放行
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Bytespider
Disallow: /         # 字节跳动 LLM 爬虫，按需放行（如要进入抖音/豆包则 Allow: /）

# Sitemap
Sitemap: https://zhiyu.app/sitemap.xml
Sitemap: https://zhiyu.app/sitemap-images.xml
```

> **重要**：很多公司用 Cloudflare 默认开启 "Block AI Bots"，这会让 GPTBot/ClaudeBot 直接 403 → GEO 全失效。**必须手动到 Cloudflare → Bots → AI Bots & Scrapers 设为 "Allow"**。

---

## 5. Meta 标签全套

### 5.1 必备 metadata

```typescript
// 每个页面 generateMetadata 必须返回
export async function generateMetadata({ params }) {
  return {
    title: 'HSK 4 Vocabulary List: 600 Words with Pinyin, Audio & Examples | Zhiyu',
    description: 'Complete HSK 4 vocabulary list (600 words) with pinyin, English meaning, native audio and example sentences. Updated for HSK 4.0 (2026). Free to study.',
    keywords: 'HSK 4 vocabulary, HSK 4 word list, ...', // Google 已忽略，但 Bing 仍参考
    alternates: {
      canonical: 'https://zhiyu.app/en/hsk/4/vocabulary/',
      languages: {
        'en': 'https://zhiyu.app/en/hsk/4/vocabulary/',
        'vi': 'https://zhiyu.app/vi/hsk/4/vocabulary/',
        'th': 'https://zhiyu.app/th/hsk/4/vocabulary/',
        'x-default': 'https://zhiyu.app/en/hsk/4/vocabulary/',
      },
    },
    openGraph: {
      title: '...',
      description: '...',
      url: 'https://zhiyu.app/en/hsk/4/vocabulary/',
      siteName: 'Zhiyu — Learn Chinese the Modern Way',
      images: [{ url: 'https://zhiyu.app/og/hsk4-vocab.png', width: 1200, height: 630 }],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@zhiyu_app',
      creator: '@zhiyu_app',
      title: '...',
      description: '...',
      images: ['https://zhiyu.app/og/hsk4-vocab.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { 'max-snippet': -1, 'max-image-preview': 'large', 'max-video-preview': -1 },
    },
    other: {
      'article:author': 'Dr. Wei Liu',
      'article:published_time': '2026-04-15T00:00:00Z',
      'article:modified_time': '2026-05-01T00:00:00Z',
    },
  };
}
```

### 5.2 Title 写法（CTR 优化）

公式：`[主关键词] [价值/数字] [品牌]`

例：
- ✅ `HSK 4 Vocabulary: 600 Words with Audio & Free Quiz | Zhiyu`
- ❌ `HSK 4 vocabulary words list - learn HSK 4 with our app`

铁律：
- ≤ 60 字符
- 主关键词在前 30 字符
- 含数字 / 年份 → +20% CTR
- 不堆关键词

---

## 6. Schema 结构化数据

详见独立文档 [08-schema-structured-data.md](./08-schema-structured-data.md)。本节只列**必须部署的 Schema 类型矩阵**：

| 页面类型 | 必须 Schema | 推荐 Schema |
|---------|-----------|-----------|
| 首页 | Organization, WebSite (with Sitelinks SearchBox) | - |
| 文化长文 | Article, BreadcrumbList | FAQPage |
| 课程页 | Course, Organization, Person (instructor) | AggregateRating, Review |
| 词条页 | DefinedTerm or LearningResource, BreadcrumbList | Quiz |
| 视频页 | VideoObject (with transcript) | Course |
| 作者页 | Person, sameAs[Wikipedia, LinkedIn, Wikidata] | - |
| FAQ 段 | FAQPage | - |

---

## 7. Core Web Vitals

详见 [09-core-web-vitals.md](./09-core-web-vitals.md)。本节只列 Next.js 项目最常见 4 个修复：

1. **LCP > 2.5s** → 用 `<Image priority>` 标记首屏图、字体用 `next/font` 自托管 + `display=swap`
2. **CLS > 0.1** → 所有 `<Image>` 必须带 width/height、广告/iframe 预留高度
3. **INP > 200ms** → 第三方脚本用 `next/script strategy="lazyOnload"`、useTransition 拆分重计算
4. **TTFB > 800ms** → SSR 减少阻塞 fetch、用 Vercel Edge Functions 或边缘缓存

---

## 8. AI 爬虫专属优化

### 8.1 AI 爬虫 UA 列表（2026 Q2 实时）

| Bot | UA 关键字 | 用途 |
|-----|---------|------|
| GPTBot | `GPTBot` | OpenAI 训练 |
| ChatGPT-User | `ChatGPT-User` | ChatGPT 实时浏览 |
| OAI-SearchBot | `OAI-SearchBot` | ChatGPT Search |
| ClaudeBot | `ClaudeBot` | Anthropic 训练 |
| anthropic-ai | `anthropic-ai` | Claude 实时检索 |
| Claude-Web | `Claude-Web` | Claude 浏览 |
| PerplexityBot | `PerplexityBot` | Perplexity 索引 |
| Perplexity-User | `Perplexity-User` | Perplexity 实时 |
| Google-Extended | `Google-Extended` | Gemini/Bard 训练 |
| Applebot-Extended | `Applebot-Extended` | Apple Intelligence |
| Bytespider | `Bytespider` | 字节豆包 |
| YouBot | `YouBot` | You.com |
| DuckAssistBot | `DuckAssistBot` | DuckDuckGo Assist |
| MetaBot / FacebookBot | `meta-externalagent` | Meta AI |

### 8.2 服务端日志监控

每天用脚本统计：
```sql
SELECT bot_name, COUNT(*) AS hits, COUNT(DISTINCT url) AS pages
FROM access_logs
WHERE bot_name IN ('GPTBot','ClaudeBot','PerplexityBot','OAI-SearchBot','Google-Extended')
  AND date >= NOW() - INTERVAL '7 days'
GROUP BY bot_name;
```

如某 Bot 连续 3 天访问下降 > 50%，告警。

### 8.3 给 AI 爬虫的快速通道

部署专门的 `/llms.txt`、`/llms-full.txt`，详见 [../geo/02-llms-txt-implementation.md](../geo/02-llms-txt-implementation.md)。

可选：在响应头加 `Link: </llms.txt>; rel="ai-content-summary"`。

---

## 9. HTTP 头部清单

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: ... (按需配置)
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: ...
Vary: Accept-Encoding, Accept-Language
Cache-Control: public, max-age=31536000, immutable  (静态资源)
Cache-Control: public, max-age=3600, stale-while-revalidate=86400  (HTML)
Link: </styles.css>; rel="preload"; as="style"
```

---

## 10. 国际化 / 多语言

详见 [07-multilingual-hreflang.md](./07-multilingual-hreflang.md)。

要点：
- 用 Next.js `i18n routing`（App Router 用 middleware）
- 不用 `?lang=en` 查询参数（用 path：`/en/`、`/vi/`）
- 不用 `Accept-Language` 自动重定向（GoogleBot 永远 en-US 会被困在英文区）→ 用 `x-default` 指英文
- 所有翻译必须人工 review，不直接发布机翻

---

## 11. 监控与告警

部署：
- **GSC**：每日导出 query / page / coverage 报告
- **GA4**：事件 + AI 流量切片
- **Bing Webmaster**：CTR + 关键词
- **Server Logs → BigQuery / ClickHouse**：每日 AI Bot 访问统计
- **Lighthouse CI**：每次部署自动跑、CWV 退化告警
- **Schema Validator**：每周抓取 100 随机页跑 schema.org validator
- **Sitemap Health**：每日检查 sitemap 200 + 内容数

告警条件（飞书机器人 / 邮件）：
- 任意 sitemap 返回 404 或内容数下降 > 10%
- AI Bot 访问量周环比下降 > 30%
- CWV 任一指标移动端中位数恶化超过阈值
- GSC Coverage "Error" 增加 > 100 个/天

---

## 12. 工程交付清单（给 Next.js 团队）

下列清单交给前端团队，每项必须 review + 提 PR：

```markdown
- [ ] next.config.js: i18n + trailingSlash + redirects + headers
- [ ] middleware.ts: 多语言路由 + 旧 URL 301
- [ ] app/sitemap.ts: 多 sitemap 自动生成
- [ ] app/robots.ts: robots.txt 自动生成
- [ ] app/layout.tsx: 全局 metadata + Organization Schema
- [ ] components/SEO/JsonLd.tsx: Schema 通用组件
- [ ] components/SEO/Hreflang.tsx: hreflang 通用组件
- [ ] lib/seo/generate-metadata.ts: metadata 工厂函数
- [ ] public/llms.txt + llms-full.txt 上线
- [ ] Cloudflare 后台关闭 "Block AI Bots"
- [ ] GSC + Bing Webmaster + Yandex 验证
- [ ] GA4 + GTM + Microsoft Clarity 接入
- [ ] Lighthouse CI 集成 GitHub Actions
- [ ] Server Log → BigQuery pipeline
- [ ] Schema Validator 周报脚本
- [ ] Sitemap 健康监测脚本
```
