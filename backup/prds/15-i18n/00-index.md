# 15 · 国际化（i18n / I18N）

> **代号**：I18N | **优先级**：P0 | **核心**：UI 4 语种 + 内容 4 语种 + 实时切换

## 文件
- [01-functional-requirements.md](./01-functional-requirements.md)
- [02-data-model-api.md](./02-data-model-api.md)
- [03-acceptance-criteria.md](./03-acceptance-criteria.md)

## 关键决策
- 4 语种：en / vi / th / id（v1）
- 框架：i18next + react-i18next
- 字体：
  - en: Plus Jakarta Sans
  - vi: Be Vietnam Pro
  - th: Sarabun（必须，泰语字符渲染）
  - id: Plus Jakarta Sans
  - zh: Noto Sans SC（中文展示）
- URL 路由：`/en/...`, `/vi/...`, `/th/...`, `/id/...`
- 默认语言：浏览器 Accept-Language → 回退 en
- 用户偏好覆盖
- SEO：每语独立 sitemap + hreflang
- 数字 / 日期 / 货币 本地化（v1 仅 USD）
- RTL：v1 不支持
