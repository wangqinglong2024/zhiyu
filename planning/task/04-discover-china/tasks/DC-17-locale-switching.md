# DC-17 · 实现母语切换与翻译回退

## PRD 原文引用

- `DC-FR-013`：“用户切换 UI 语言时，所有文章翻译实时切换。”
- `DC-FR-013`：“缺失语种则回退英文。”
- `planning/ux/06-navigation-routing.md`：“所有路由可前缀语言。”

## 需求落实

- 页面：DC 首页、列表页、文章页。
- 组件：LocaleProvider、TranslatedText、LanguagePrefixRouter。
- API：所有 DC API 根据 locale 返回 title/name/summary/translation。
- 数据表：`content_categories.name_translations`、`content_articles.title_translations`、`content_sentences.translations`。
- 状态逻辑：用户切换语言后当前页面不丢阅读进度；缺失语言回退英文，再缺失回退中文。
- 语种范围：v1 DC 内容翻译固定为 en/vi/th/id；zh 为原文，不作为 translations 内的第五种语言。
- URL：`/vi/discover/...`、`/th/discover/...`、`/id/discover/...`、`/en/discover/...` 必须稳定互转。

## 不明确 / 风险

- 风险：PRD 语种 en/vi/th/id 与内容目录样例可能不全。
- 处理：后台标记 `needs_translation=true`，前台明确回退。

## 技术假设

- i18n 路由由全局 I18N 模块提供，DC 只消费 locale。

## 最终验收清单

- [ ] `/vi/discover/...` 返回越南语翻译。
- [ ] 切换语言后句子翻译实时更新。
- [ ] 缺失语种回退英文。
- [ ] URL 前缀与用户偏好一致。
- [ ] en/vi/th/id 四语字段缺失会被后台标记，前台不会显示空白翻译。