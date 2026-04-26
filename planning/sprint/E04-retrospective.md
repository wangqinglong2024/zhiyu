# E04 复盘 · 国际化与多语言地基

> retrospective_date: 2026-04-26
> sprint: S04
> stories_completed: 5 / 5
> deployment: Docker compose, 6/6 容器健康
> validation: tsc -r + vitest（15/15）+ i18n:lint OK + i18n:coverage 100% + Puppeteer 4 语言切换 OK

## 1. 交付清单

### i18n 共享包

| 路径 | 内容 |
| - | - |
| `packages/i18n/package.json` | 依赖 `i18next ^23.11`、`react-i18next ^14.1`、`intl-messageformat ^10.5`；导出 `.`、`./client`、`./server`、`./formatters`、`./fonts`；脚本 `typecheck/test/i18n:lint/i18n:coverage` |
| `packages/i18n/src/index.ts` | `UI_LOCALES = en/vi/th/id`、`CONTENT_LOCALES` 加 `zh-CN`；`DEFAULT_LOCALE='en'`、`FALLBACK_CONTENT_LOCALE='en'`；`LOCALE_TO_HTML_LANG/LOCALE_TO_DIR/LOCALE_LABEL/LOCALE_DEFAULT_CURRENCY` 全套常量；`isUiLocale/pickUiLocale/parseAcceptLanguage`（q-weighted RFC-5646） |
| `packages/i18n/src/resources.ts` | 4×5 命名空间静态导入（`with { type: 'json' }`），暴露 `RESOURCES`、`LOADED_NAMESPACES` |
| `packages/i18n/src/client.ts` | `getI18n()`：自定义 `icu` postProcessor 替代 `i18next-icu`，`prefix='\u0001'/suffix='\u0002'` 关闭原生插值；`detectInitialLocale` 支持 `?lang=` 优先 → localStorage(`zhiyu:lng`) → navigator；`syncHtmlAttrs` 同步 `<html lang/dir>`；导出 `useT/useTranslation/I18nextProvider/changeLocale/getCurrentLocale/formatIcu` |
| `packages/i18n/src/server.ts` | `makeT(lng): ServerT`，支持 `ns:dot.path` 与 fallback 到 `DEFAULT_LOCALE`，缺键回落为 key 本体 |
| `packages/i18n/src/formatters.ts` | 缓存版 `Intl.NumberFormat/DateTimeFormat/RelativeTimeFormat`；`fmtNumber/fmtCurrency/fmtDate/fmtDateTime/fmtRelative`；强制 `numberingSystem:'latn'`；VND/IDR `maxFractionDigits=0` |
| `packages/i18n/src/fonts.ts` | `LOCALE_FONTS`（Inter 全员、vi+Be Vietnam Pro、th+Noto Sans Thai）+ `CONTENT_CJK_FONT`（LXGW WenKai）；`loadFontsFor(lng)` 注入 `<link rel=preload>` + `<style id=zhiyu-fontfaces>`，去重；`#zhiyu-i18n-live` aria-live 播报语言切换 |
| `packages/i18n/src/locales/{en,vi,th,id}/{common,auth,me,discover,courses}.json` | 20 个 JSON、489 条 key；100% 翻译覆盖；`common.home.today_count` 用 ICU plural、`common.home.system_check_body` 用 `{api}/{supabase}` 占位 |

### 内容翻译数据层与 API

| 路径 | 内容 |
| - | - |
| `apps/api/drizzle/migrations/0003_e04_content_translations.sql` | `zhiyu.content_translations` 表，复合主键 `(entity_type, entity_id, locale, field)`；locale CHECK 约束 + 长度 CHECK；`(entity_type, entity_id)` + `(locale)` 索引；RLS：anon/authenticated 只读、service_role 全权 |
| `packages/db/src/translations.ts` | Drizzle pgTable 映射，重导出经 `packages/db/src/index.ts` |
| `apps/api/src/i18n-mw.ts` | `registerI18n`：onRequest 钩子按 `?lang` → `x-locale` → `accept-language` 顺序解析，`req.locale: UiLocale` + `req.t: ServerT`；响应 `content-language` |
| `apps/api/src/routes/translations.ts` | 5 个端点：公共 `GET /api/v1/content/:type/:id?lang=`（带 60s/1000 条 LRU 内存缓存 + en/zh-CN 双重 fallback）；管理 `GET/PUT/DELETE /api/v1/admin/translations` + `GET /api/v1/admin/translations/coverage`，全部走 `requireAdminUser` |
| `apps/api/src/auth-mw.ts` | 新增 `requireAdminUser`，从 Supabase `app_metadata.role` 解析；`AuthUser` 增加 `role: 'admin' \| 'user'` 字段 |

### 前端集成

| 路径 | 内容 |
| - | - |
| `apps/web/src/main.tsx`、`apps/admin/src/main.tsx` | 启动顺序：`getI18n()` → `loadFontsFor(getCurrentLocale())` → `<I18nextProvider>` 包裹 |
| `apps/web/src/components/LangSwitcher.tsx` | radiogroup 切换器；`changeLocale` + `loadFontsFor` 联动；`data-testid=lang-switcher`、`lang-option-${lng}` |
| `apps/web/src/App.tsx` | Header / Home / 系统状态卡完全 `useT('common')` 化；`{t('home.today_count', {count})}` 用 ICU plural；`{t('home.system_check_body', {api, supabase})}` 用变量插值 |
| `apps/web/src/pages/auth.tsx` | SignIn / SignUp / ResetPassword 全部 `useT(['auth','common'])`，含错误提示与按钮 |
| `apps/web/src/pages/me.tsx` | MeHeader + MeOverviewPage 已 i18n；MeEdit/Settings/Security/Data 用 `// i18n-skip-start/end` 标记，深表单文案延后到 v2 |

### 工具脚本

| 路径 | 内容 |
| - | - |
| `packages/i18n/scripts/lint.ts` | 启发式扫描 `apps/*/src/**/*.tsx`：JSX CJK 文本、≥8 字符英文句子、Tailwind `pl-/pr-/ml-/mr-` RTL 不安全方向类；支持 `i18n-skip-file/start/end/line` 注释；`exit 1` 阻断 |
| `packages/i18n/scripts/coverage.ts` | 对每个 namespace 比对 en 与 vi/th/id 的 key 集合；输出表格 + 缺失列表 |
| `packages/i18n/test/formatters.test.ts` | 15 项 vitest：`parseAcceptLanguage / pickUiLocale / fmtNumber / fmtCurrency`（VND/IDR 正则 `[.,]\d{2}\D*$`）`/ fmtDate / fmtRelative / makeT`（plural 0/1/5、插值、fallback、缺键）+ namespace key parity |

## 2. 验证结果

- `pnpm -r typecheck`：11/11 包通过。
- `pnpm -F @zhiyu/i18n test`：15/15 vitest 通过。
- `pnpm -F @zhiyu/i18n i18n:lint`：扫描 7 个文件，0 findings。
- `pnpm -F @zhiyu/i18n i18n:coverage`：489/489 key，100% 覆盖。
- `docker compose build` + `up -d`：6/6 容器 healthy。
- `pnpm -F @zhiyu/api db:migrate`（容器内）：0001/0002/0003 全部 already applied。
- `curl http://localhost:8100/api/v1/content/article/demo?lang=vi` → 200，`fields:{}`、`source:db`。
- `curl -X PUT http://localhost:8100/api/v1/admin/translations` → 401（未登录），admin 端点正确受保护。
- Puppeteer 探针 `/tmp/probe/i18n-locales.mjs`：`?lang=en/vi/th/id` 4 个 locale 全部命中，`<html lang>` 正确切换，Hero headline 切换为越南语 / 泰语 / 印尼语。

## 3. 关键技术决策

1. **舍弃 `i18next-icu`，自建 ICU postProcessor。** v23 + Vite + tailwind-merge 互操作不稳；改为 `intl-messageformat` 直连 + 自定义 PostProcessorModule，将 i18next 原生插值占位符前后缀改为 `\u0001/\u0002` 完全短路；plural / select 等 ICU 子语法收敛在一处。
2. **UI / Content locale 拆分。** UI 4 国（en/vi/th/id），内容多 1 个 zh-CN（原文）。`CONTENT_LOCALES = ['en','vi','th','id','zh-CN']`，回退链 `requested → en → zh-CN`，避免运营人员只录中文时前端崩溃。
3. **font 加载分层：UI 字体按 locale 注入，CJK 内容字体按调用懒加载。** 通过 `seenUrls/seenSpecs` 双 Set 去重；`<link rel=preload>` + `<style id=zhiyu-fontfaces>` 单点注入；缺二进制时 woff2 404 走 `local()` fallback。
4. **content_translations 选用 EAV 复合键。** 主键 `(entity_type, entity_id, locale, field)` 避免运营改字段时跑 ALTER；服务端 60s/1000 条 LRU 缓存抗读放大；后续接 Redis 时只换实现，签名不变。
5. **Admin 端点收紧到 `app_metadata.role==='admin'`。** 原 `requireUser` 仅校验登录，任何已注册用户都能写翻译；新增 `requireAdminUser` 闭环 OWASP A01（Broken Access Control）。
6. **`?lang=` 优先于 localStorage。** 便于运营 / QA 通过分享链接验证特定语言；探针因此能跳过 LS 直接断言渲染。
7. **lint 用源码启发式而非 AST。** 项目尚无 babel parser；启发式规则（CJK ≥2、英文句子 ≥8 字符且 ≥2 大写词）+ `i18n-skip-*` 注释闸门，已能拦住 CJK 硬编码；后续真要严格再换 ts-morph。

## 4. 遗留事项

- `apps/web/src/pages/me.tsx` 的 4 个深表单（Edit / Settings / Security / Data）用 `i18n-skip-start/end` 占位，文案与 ZC 业务逻辑耦合，留到 v2 一并随 profile 内容模型迁移。
- `apps/admin/src/App.tsx` 整体 `i18n-skip-file`：B 端运营 v1 默认 CN-only，待用户管理 / 内容审核 / 数据看板真正落地后再统一双语。
- 真实字体二进制（Inter / Be Vietnam Pro / Noto Sans Thai / LXGW WenKai）尚未放入 `apps/web/public/fonts/`；目前依赖 `local()` fallback 与系统字体。CDN 选型留作 E05 之前的运维任务。
- Translation API 公共读端点暂无 IP/Token 维度限流；60s 内存缓存可挡常规放大攻击，正式上线前需要接入网关侧限流。
- RTL：`LOCALE_TO_DIR` 全为 `ltr`，`pl-/pr-` 体检规则就位但暂无 ar/he 落地路径，等待产品决策。
- i18n key 的 CMS 编辑面板（`apps/admin` 内 UI）未做；目前只能通过 `PUT /api/v1/admin/translations` 直连。

## 5. 下一阶段输入（E05 提示）

- 内容生产：以 `content_translations` 为唯一来源建一套 admin CRUD；落地翻译 memory（TM）与机器初翻 → 人工校审流程。
- HSK 课程产品化：在 i18n 框架下生成 5 国语言学习路径与单元结构。
- 前端 RTL 演练：补 ar 占位 namespace + `dir=rtl` 切换，跑通 PageShell / Card / Tabs 三件套。
- 字体瘦身：把 `LXGW WenKai` 按 unicode-range 切片到 GB2312 / GB18030 子集，减少首屏 ~3MB。
- 监控：`req.locale` 写入 access log + 度量 per-locale QPS / 错误率。
