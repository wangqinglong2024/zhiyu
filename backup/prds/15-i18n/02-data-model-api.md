# 15.2 · i18n · 实现细节

## 目录结构
```
src/
  locales/
    en/
      common.json
      auth.json
      learn.json
      games.json
      novels.json
      payment.json
      ...
    vi/...
    th/...
    id/...
```

## 配置（i18next）

```typescript
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en','vi','th','id'],
    ns: ['common','auth','learn','games','novels','payment','discover','referral','cs','admin'],
    defaultNS: 'common',
    detection: {
      order: ['path','cookie','navigator'],
      caches: ['cookie'],
    },
    interpolation: { escapeValue: false },
  });
```

## 路由（React Router）

```typescript
<Routes>
  <Route path="/:lang/*" element={<I18nLayout />}>
    <Route index element={<Home />} />
    <Route path="discover/*" element={<DiscoverRoutes />} />
    ...
  </Route>
  <Route path="/" element={<RootRedirect />} />
</Routes>

function RootRedirect() {
  const lang = detectLang();
  return <Navigate to={`/${lang}`} replace />;
}
```

## 字体加载

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<!-- Sarabun for Thai (load only when lang=th) -->
<style>
  html[lang="th"] body { font-family: 'Sarabun', sans-serif; }
  html[lang="vi"] body { font-family: 'Be Vietnam Pro', sans-serif; }
  html[lang="en"] body, html[lang="id"] body { font-family: 'Plus Jakarta Sans', sans-serif; }
  /* zh content always Noto Sans SC */
  .zh-text { font-family: 'Noto Sans SC', sans-serif; }
</style>
```

## 内容回退

```typescript
function pickTranslation(translations, lang, fallback='en') {
  return translations?.[lang] || translations?.[fallback] || '';
}
```

## SEO 头

```html
<html lang="vi">
<head>
  <link rel="alternate" hreflang="en" href="https://zhiyu.app/en/discover/cuisine/dim-sum" />
  <link rel="alternate" hreflang="vi" href="https://zhiyu.app/vi/discover/cuisine/dim-sum" />
  <link rel="alternate" hreflang="th" href="https://zhiyu.app/th/discover/cuisine/dim-sum" />
  <link rel="alternate" hreflang="id" href="https://zhiyu.app/id/discover/cuisine/dim-sum" />
  <link rel="alternate" hreflang="x-default" href="https://zhiyu.app/en/..." />
</head>
```

## CI 检查

```bash
# 缺失 key 阻断 PR
i18n-check --base en --langs vi,th,id --strict
```

## 翻译流水线（CF 集成）
- 设计词条 → 提到 PR
- AI 自动初译（DeepSeek）
- 母语审校
- 合并

## API
- `GET /api/i18n/locales/:lang/:ns` — 资源（CDN 缓存 1h）
- 客户端回退：缺失则用打包内默认
