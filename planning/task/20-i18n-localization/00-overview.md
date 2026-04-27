# 20 · 国际化与本地化任务清单

## 来源覆盖

- PRD：`planning/prds/15-i18n/01-functional-requirements.md`、`02-data-model-api.md`。
- UX：`planning/ux/14-i18n-fonts.md`、`planning/ux/16-performance-quality.md`。
- 关联：UA 用户偏好、DC/CR/NV 内容 translations、邮件/通知/客服。

## 冲突裁决

- PRD 示例中的字体 CDN、locale CDN、CI 阻断等历史说法，统一改为自托管字体、本地 nginx/cache header/SW、本地 Docker 检查。
- 来源句：`planning/rules.md` 写明 Docker-only、dev-only、禁止外部托管 SaaS；`planning/ux/14-i18n-fonts.md` 写明字体文件必须自托管。

## 任务清单

- [ ] I18N-01 建立 `packages/i18n` 与 locales 目录：en/vi/th/id，命名空间 common/auth/learn/games/novels/payment/discover/referral/cs/admin。来源句：`planning/prds/15-i18n/02-data-model-api.md` “目录结构”和 i18next `ns` 配置。
- [ ] I18N-02 所有 UI 文案经 i18next key，缺失 key dev 回退 en 并 console warn。来源句：`I18N-FR-001`。
- [ ] I18N-03 实现 URL 前缀 `/en /vi /th /id`，根路径按浏览器首选语重定向，切换保留 path。来源句：`I18N-FR-002`。
- [ ] I18N-04 登录用户 `preferences.ui_lang` 覆盖浏览器，切换 POST `/api/me/preferences`。来源句：`I18N-FR-003`。
- [ ] I18N-05 内容表统一使用 translations JSONB（en/vi/th/id），缺失回退 en，同页实时切换。来源句：`I18N-FR-004`。
- [ ] I18N-06 实现动态字体：th Sarabun、vi Be Vietnam Pro、en/id Plus Jakarta Sans 或 Inter、中文 Noto Sans SC/Source Han Sans SC；字体文件自托管于 `system/public/fonts`，font-display swap。来源句：`I18N-FR-005` 与 `planning/ux/14-i18n-fonts.md`。
- [ ] I18N-07 日期/数字使用 date-fns locale 与 Intl.NumberFormat，货币 v1 仅 USD。来源句：`I18N-FR-006`。
- [ ] I18N-08 实现 SEO：html lang、alternate hreflang、x-default、每语 sitemap、og:locale。来源句：`I18N-FR-007`。
- [ ] I18N-09 明确 v1 不支持 RTL。来源句：`I18N-FR-008` 写明“v1 不支持（4 目标语都 LTR）”。
- [ ] I18N-10 邮件模板 4 语，按用户偏好语发送；推送 v1.5 占位。来源句：`I18N-FR-009`。
- [ ] I18N-11 客服 v1 按语种路由，自动翻译 v1.5 占位。来源句：`I18N-FR-010`。
- [ ] I18N-12 API 错误只返回 code，客户端按语言翻译 message。来源句：`I18N-FR-011`。
- [ ] I18N-13 新文案必须 4 语齐备；Docker 内本地检查缺 key 阻断。来源句：`I18N-FR-012` 写明“新文案需 4 语种齐备才能合并”。
- [ ] I18N-14 实现 `GET /api/i18n/locales/:lang/:ns`，本地 nginx/cache header/SW 缓存，客户端缺失时回退打包默认。来源句：`planning/prds/15-i18n/02-data-model-api.md` “API”，缓存口径按 `planning/rules.md` 本地实现裁决。
- [ ] I18N-15 翻译流水线本期走人工/导入 + mock 初译，母语审校后合并。来源句：`planning/prds/15-i18n/02-data-model-api.md` “翻译流水线（CF 集成）”与 `planning/rules.md` AI mock 裁决。
- [ ] I18N-16 所有内容模块后台编辑器必须显示 translations 完整度和缺失语种状态。来源句：`I18N-FR-004` 与 `AD-FR-006` 内容管理四模块 CRUD。

## 验收与测试

- [ ] I18N-T01 `/` 跳转到浏览器语言，`/vi/discover` 切到 `/th/discover` 保留路径。来源句：`I18N-FR-002`。
- [ ] I18N-T02 缺失内容翻译回退英文，缺失 UI key 在 dev 控制台警告。来源句：`I18N-FR-001` 与 `I18N-FR-004`。
- [ ] I18N-T03 locale key 检查在 Docker 内执行并阻断缺 key。来源句：`I18N-FR-012`。
- [ ] I18N-T04 容器离线状态下字体仍可加载，无外部字体/CDN 请求。
