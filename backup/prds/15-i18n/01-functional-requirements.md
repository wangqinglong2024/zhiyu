# 15.1 · i18n · 功能需求

## I18N-FR-001：UI 文案
- 所有 UI 字串经 i18next key
- 4 语种 JSON 文件 `locales/{en,vi,th,id}/common.json` 等命名空间
- 缺失 key → 回退 en + 控制台警告（dev）

## I18N-FR-002：URL 路由
- 路径前缀 `/en /vi /th /id`
- 根路径 `/` → 重定向至浏览器首选语 → 回退 en
- 切换语 → 替换前缀 + 保留 path

## I18N-FR-003：用户偏好
- 已登录用户：preferences.ui_lang 覆盖浏览器
- 切换 → POST /api/me/preferences

## I18N-FR-004：内容翻译
- 所有内容表 translations JSONB（en, vi, th, id）
- 缺失语 → 回退 en
- 实时切换：UI 切语 → 同页内容立即切

## I18N-FR-005：字体
- 全局 font-family 按 lang 动态
- 字体懒加载（仅当前语 + 中文）
- font-display: swap

## I18N-FR-006：日期 / 数字
- date-fns + locale 包
- 数字 Intl.NumberFormat
- 货币 USD（v1 唯一）

## I18N-FR-007：SEO
- `<html lang="...">`
- `<link rel="alternate" hreflang="..." href="...">`（4 语 + x-default）
- 每语 sitemap.xml
- og:locale 动态

## I18N-FR-008：RTL
- v1 不支持（4 目标语都 LTR）

## I18N-FR-009：邮件 / 通知
- 邮件模板 4 语种
- 用户偏好语发送
- 推送（v1.5）按语种

## I18N-FR-010：客服
- v1 客服按语种路由
- 自动翻译（v1.5）：客服中文回 → 用户母语展示

## I18N-FR-011：错误信息
- API 错误 message 4 语种
- 通过错误 code 客户端再翻译

## I18N-FR-012：上线管理
- 新文案需 4 语种齐备才能合并
- CI 检查：缺失 key 阻断
