# Core Web Vitals 优化清单（2026 标准）

> **2026 年指标阈值**（移动端 75 分位）：
> - **LCP** ≤ 2.5s
> - **INP** ≤ 200ms（已替代 FID）
> - **CLS** ≤ 0.1
> - **TTFB** ≤ 0.8s（被推荐为 LCP 前置门）

---

## 1. LCP 优化（最常见痛点）

### 1.1 识别 LCP 元素

用 PageSpeed Insights → Lab Data → 看 LCP element。常见为：
- 首屏大图
- 首屏标题文字
- 首屏视频缩略图

### 1.2 加速 LCP 元素加载

| 措施 | Next.js 实现 |
|------|-------------|
| 图片用 priority | `<Image priority src=... />` |
| 用 webp/avif | `<Image>` 自动 |
| Preload 关键资源 | `<link rel="preload" href="/hero.webp" as="image">` |
| 字体自托管 + display=swap | `next/font/local` 或 `next/font/google` |
| 关键 CSS inline | Next.js 自动（App Router） |
| CDN 边缘缓存 HTML | Vercel Edge / Cloudflare |
| 减少 SSR 阻塞 fetch | 用 `Suspense` 包非首屏组件 |

### 1.3 字体加载

```typescript
// app/layout.tsx
import { Inter, Noto_Sans_SC } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
const notoSC = Noto_Sans_SC({ subsets: ['chinese-simplified'], display: 'swap', variable: '--font-noto-sc' });
```

> **注意**：Noto Sans SC 文件大（~3MB），用 `subsets` + `unicode-range` 仅加载实际用到的汉字范围。

---

## 2. INP 优化（2024 替代 FID 后最常被忽略）

### 2.1 识别长任务

用 Chrome DevTools Performance → Long Tasks。
2026 年常见来源：
- 第三方分析脚本（GTM、Hotjar、Intercom）
- React 大列表渲染（5 万词条 Hub 页）
- 客户端水合（hydration）卡顿

### 2.2 修复

```typescript
// 1. 第三方脚本延迟
import Script from 'next/script';
<Script src="..." strategy="lazyOnload" />

// 2. 大列表用虚拟滚动
import { useVirtualizer } from '@tanstack/react-virtual';

// 3. 重计算用 startTransition
const [pending, startTransition] = useTransition();
startTransition(() => setQuery(input));

// 4. 部分组件 Server Components 化（不发到客户端）
```

### 2.3 React 19 改进
- 用 React Compiler 自动优化 memo
- 用 `use()` API 流式渲染数据

---

## 3. CLS 优化

### 3.1 必给 width/height

```typescript
// ❌ 错
<img src="hero.jpg" />

// ✅ 对
<Image src="/hero.jpg" alt="..." width={1200} height={630} />
```

### 3.2 字体加载防跳

`display=swap` + `<link rel="preload" as="font">`

### 3.3 广告/iframe 占位

```typescript
<div style={{ minHeight: 250 }}>
  <AdSlot />
</div>
```

### 3.4 不在首屏插入元素

避免 "Cookie banner" / "Newsletter popup" 在 0-3s 弹出推动内容。

---

## 4. TTFB 优化

| 问题 | 修复 |
|------|------|
| SSR fetch 串行 | 用 `Promise.all` 并行 |
| DB 慢 | 索引 + Query 限制 + 缓存（Redis） |
| 边缘部署不到位 | Vercel Edge Functions / Cloudflare Workers |
| HTML 不缓存 | ISR + `Cache-Control: s-maxage=3600, stale-while-revalidate` |

目标：TTFB < 200ms（含全球边缘节点）

---

## 5. 监测

### 5.1 Lab（部署时）

GitHub Actions + Lighthouse CI：
```yaml
- uses: treosh/lighthouse-ci-action@v11
  with:
    urls: |
      https://staging.zhiyu.app/en/
      https://staging.zhiyu.app/en/hsk/4/
      https://staging.zhiyu.app/en/discover/cuisine/
    budgetPath: ./lighthouse-budget.json
```

### 5.2 Field（真实用户）

- GA4 Web Vitals 事件（自动）
- CrUX BigQuery（每月看趋势）
- Vercel Speed Insights / Cloudflare Analytics

### 5.3 告警

任意页面（Top 100 流量页）的 P75 LCP / INP / CLS 周环比恶化 → 告警。

---

## 6. CWV 与 SEO 的关系（2026 现状）

- 仍是 Page Experience 信号之一（不是排名第一因素）
- **AI 引擎额外参考**：Perplexity / Google AI Overviews 在引用候选页时会考虑加载性能
- 移动端 P75 阈值是关键
- 不达标 → 不会立刻掉排名，但**长期不会上排名**

---

## 7. CWV 检查清单

```markdown
- [ ] 首屏图 priority + webp
- [ ] 字体 next/font + display=swap
- [ ] 第三方脚本 lazyOnload
- [ ] 所有 <Image> 带 width/height
- [ ] 无首屏 popup
- [ ] SSR fetch 并行
- [ ] ISR + 边缘缓存
- [ ] 5 万词条页虚拟滚动
- [ ] Lighthouse CI 集成
- [ ] GA4 Web Vitals 事件
- [ ] CrUX 月度报告
- [ ] P75 LCP < 2.5s, INP < 200ms, CLS < 0.1
```
