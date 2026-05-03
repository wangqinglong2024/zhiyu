# 多语言 hreflang 与本地化 SEO

> **目标**：让 Zhiyu 在每个目标市场**用本地用户的母语**被搜到，且不被 Google 判为 Duplicate Content。

---

## 1. 语言/地区矩阵（与 [02-keyword-strategy.md](./02-keyword-strategy.md) 对齐）

| Locale | URL 前缀 | 优先级 | 内容覆盖 | 来源 |
|--------|---------|-------|---------|------|
| `en` | `/en/` | P0 | 100%（全部） | 原创/翻译 |
| `vi` | `/vi/` | P0 | 5000 词条 + 50 长文 | 原生越南语 |
| `th` | `/th/` | P0 | 5000 词条 + 50 长文 | 原生泰语 |
| `id` | `/id/` | P1 | MVP 1000 词 | 翻译 + 母语审 |
| `ms` | `/ms/` | P2 | MVP 1000 词 | 翻译 + 母语审 |
| `de` | `/de/` | P1 | 50 长文 + 课程页 | 母语翻译 |
| `fr` | `/fr/` | P1 | 50 长文 + 课程页 | 母语翻译 |
| `es` | `/es/` | P1 | 50 长文 + 课程页 | 母语翻译 |
| `ja` | `/ja/` | P2 | 文化长文 50 | 待评估 |
| `ko` | `/ko/` | P2 | 文化长文 50 | 待评估 |

**原则**：宁可只做 4 语言但每语都达 90% 内容质量，也不要 10 语种全机翻。

---

## 2. URL 策略

### 2.1 用 path（推荐），不用 subdomain / ccTLD / query

```
✅ https://zhiyu.app/en/hsk/4/        # 推荐
❌ https://en.zhiyu.app/hsk/4/        # 子域 — 权重不传递
❌ https://zhiyu.app/hsk/4/?lang=en   # 查询 — Google 不友好
❌ https://zhiyu.app.us/hsk/4/        # ccTLD — 多域名运维成本高
```

### 2.2 默认语言策略

- **不要做 `/` 自动重定向到 `/en/`**（GoogleBot 永远 en-US 会被困）
- `/` 直接展示英文（Server 渲染 en），但 hreflang `x-default` 也指 `/en/`
- 用户首访通过 cookie + Header 弹窗"is your language [English]?"建议切换

---

## 3. hreflang 完整实施

### 3.1 在 `<head>` 注入

```html
<link rel="alternate" hreflang="en" href="https://zhiyu.app/en/hsk/4/" />
<link rel="alternate" hreflang="vi" href="https://zhiyu.app/vi/hsk/4/" />
<link rel="alternate" hreflang="th" href="https://zhiyu.app/th/hsk/4/" />
<link rel="alternate" hreflang="id" href="https://zhiyu.app/id/hsk/4/" />
<link rel="alternate" hreflang="x-default" href="https://zhiyu.app/en/hsk/4/" />
```

### 3.2 自映射 + 双向

- 每页面必须包含**所有语言版本**的 hreflang，**包含自身**
- A 页面 hreflang B → B 页面也必须 hreflang A（**双向**）
- 缺一不可，否则 Google 会忽略全部 hreflang

### 3.3 在 sitemap 中也写一份（可选但推荐）

```xml
<url>
  <loc>https://zhiyu.app/en/hsk/4/</loc>
  <xhtml:link rel="alternate" hreflang="en" href="https://zhiyu.app/en/hsk/4/" />
  <xhtml:link rel="alternate" hreflang="vi" href="https://zhiyu.app/vi/hsk/4/" />
  <xhtml:link rel="alternate" hreflang="th" href="https://zhiyu.app/th/hsk/4/" />
  <xhtml:link rel="alternate" hreflang="x-default" href="https://zhiyu.app/en/hsk/4/" />
</url>
```

### 3.4 Next.js 实现

```typescript
// app/[lang]/hsk/[level]/page.tsx
export async function generateMetadata({ params }) {
  const { lang, level } = params;
  const supportedLangs = ['en', 'vi', 'th', 'id'];
  
  return {
    alternates: {
      canonical: `https://zhiyu.app/${lang}/hsk/${level}/`,
      languages: Object.fromEntries(
        supportedLangs.map(l => [l, `https://zhiyu.app/${l}/hsk/${level}/`])
          .concat([['x-default', `https://zhiyu.app/en/hsk/${level}/`]])
      ),
    },
  };
}
```

---

## 4. 翻译策略

### 4.1 不要做的事

- ❌ Google Translate 一键翻译后直接发布
- ❌ 用 Wix / Shopify 自动翻译插件（Google 视为低质）
- ❌ 隐藏机翻"原始版本"在 hreflang 里

### 4.2 推荐流程

1. **Tier A 内容**（Hub + Pillar + 高流量 Leaf）：母语翻译者写
2. **Tier B 内容**（其他 Leaf）：DeepL / GPT-4 翻译 → 母语 reviewer 通读 + 改 → 上线
3. **Tier C 内容**（低优先级）：暂不翻译，对应 hreflang 不写
4. 所有翻译保留"译者署名"（Person Schema）

### 4.3 本地化（Localization > Translation）

- 货币：US$ / VND / THB / IDR
- 日期：Apr 15, 2026 / 15/04/2026 / 15 เม.ย. 2026
- 例句场景：北美用 Starbucks/Amazon、东南亚用 Grab/Shopee
- 文化引用：北美用感恩节比喻、东南亚用泼水节比喻

---

## 5. 各市场本地 SEO 要点

### 5.1 北美（en-US）
- 主战场：Google.com
- 工具：GSC US property、Ahrefs US
- 本地化锚词：HSK 在中文学习者中已是常识词，不必解释

### 5.2 东南亚

#### 越南（vi-VN）
- 主战场：Google.com.vn（97% 份额）
- 强语义关键词：`tiếng Trung`（中文）、`tiếng phổ thông`（普通话）、`HSK`、`học tiếng Trung online`
- 高频意图：商务中文（中资厂蓝领 + 跨境电商卖家）
- 本地外链来源：vnexpress.net、tuoitre.vn、forum kenh14
- 用 Vietcombank / Momo 支付集成做"本地化感"

#### 泰国（th-TH）
- 主战场：Google.co.th
- 关键词：`เรียนภาษาจีน`（学中文）、`HSK`
- 平台偏好：Line、Facebook、TikTok（强 UGC）

#### 印尼（id-ID）
- 关键词：`belajar bahasa mandarin`、`bahasa cina`
- 平台：Instagram、TikTok

### 5.3 西欧（de/fr/es）
- 主战场：Google.de / .fr / .es（>90% 份额）
- 翻译质量门槛高（用户对机翻零容忍）
- 文化偏好：完整产品规格 + 隐私（GDPR 合规必加）

### 5.4 英国 / 澳洲（en-GB / en-AU）
- 不用单独建 hreflang 区域代码（除非内容真有英美差异）
- 拼写本地化：colour vs color、organisation vs organization（仅 Tier A 内容做）

---

## 6. GSC 多 Property 设置

每个语言版本独立验证为 GSC Property：

```
https://zhiyu.app/             ← 全站 Domain Property
https://zhiyu.app/en/          ← 英语 Prefix Property
https://zhiyu.app/vi/          ← 越语 Prefix Property
https://zhiyu.app/th/          ← 泰语 Prefix Property
...
```

每个 Property 独立看 Performance / Coverage，方便分析每语言效果。

---

## 7. 国际 CDN 与服务器

- **不要把服务器只放在国内/亚洲一个区**
- 推荐 Cloudflare 全球 CDN（300+ 节点）
- 静态资源 + ISR HTML 全部走边缘缓存
- 关键 API（注册/登录）部署到至少 3 个区域（北美 + 欧洲 + 东南亚）
- 用 `Vary: Accept-Language` 让 CDN 缓存按语言区分

---

## 8. 移动端首页弹窗（不要做的事）

- ❌ 弹"是否进入越南语版本？"全屏遮罩 → Google 视为 Intrusive Interstitial → 移动排名受罚
- ✅ 用顶部 banner 提示，可关闭，不遮挡内容

---

## 9. 检查清单

```markdown
- [ ] 每语言版本独立 URL（path 前缀）
- [ ] hreflang 完整 + 双向 + 含自身 + x-default
- [ ] sitemap 中也写 hreflang
- [ ] 每语言独立 GSC Property
- [ ] Tier A 内容母语翻译
- [ ] 不强制重定向首访
- [ ] 各语言独立 GA4 view
- [ ] CDN 全球节点配置
- [ ] 隐私政策 GDPR 合规
- [ ] 不弹全屏语言切换遮罩
```
