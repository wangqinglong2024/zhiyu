# 14 · 国际化与字体

## 一、v1 支持语言

| 代码 | 语言 | 说明 |
|---|---|---|
| `en` | English | 默认回退语 |
| `vi` | Tiếng Việt | 越南语 |
| `th` | ไทย | 泰语 |
| `id` | Bahasa Indonesia | 印尼语 |

中文学习内容始终可显示；应用 UI 中文为 v1.5 评估，后台可优先使用中文管理文案。

## 二、i18n 框架

- `i18next` + `react-i18next`。
- 命名空间：common、auth、discover、courses、games、novels、profile、payment、referral、cs、admin。
- 缺失 key：回退 en，并在 dev 输出警告。
- 新 key 必须 4 语齐备才能通过本地检查。

## 三、路由与偏好

优先级：URL 前缀、用户偏好、localStorage/cookie、浏览器语言、en。

切换语言时保留 path，替换前缀，并同步用户 `preferences.ui_lang`。

## 四、内容多语言

- 中文原文不翻译。
- 拼音统一生成和审校。
- 讲解/翻译覆盖 en、vi、th、id。
- 缺失语回退 en，但 W0 内容门禁要求目标内容 4 语齐备。

## 五、字体

| 语言 | 字体 token | 要求 |
|---|---|---|
| en/id | `font-ui` | Plus Jakarta Sans 或 Inter 自托管 |
| vi | `font-vi` | Be Vietnam Pro 自托管 |
| th | `font-th` | Sarabun 或 Noto Sans Thai 自托管 |
| zh | `font-zh` | Noto Sans SC / Source Han Sans SC 自托管 |
| 中文标题 | `font-title-zh` | 少量使用 serif，不用于正文 |

字体文件放在 `system/public/fonts` 或镜像内静态目录；使用 woff2、子集化、`font-display: swap`。禁止从外部字体 CDN 加载。

## 六、本地化

- 日期：`Intl.DateTimeFormat`。
- 数字：`Intl.NumberFormat`。
- v1 货币显示以 USD 为基础，国家本币/PPP 后续按支付 PRD 和 Adapter 能力扩展。
- RTL v1 不支持，但布局 token 预留逻辑方向。

## 七、SEO

- `<html lang>` 按路由更新。
- 每语 hreflang + x-default。
- 每语 sitemap 由本地脚本生成。
- Discover China 受限内容的 meta/JSON-LD 不泄露正文。

## 八、邮件/通知/客服

- 邮件模板 4 语。
- 通知文案 4 语。
- 客服按用户语言路由；自动翻译为 v1.5，不作为 v1 可执行依赖。

## 九、验收

- [ ] UI key 4 语完整。
- [ ] `/en /vi /th /id` 路由、切换、回退正确。
- [ ] 字体按语言懒加载且自托管。
- [ ] SEO hreflang/sitemap 本地生成。
- [ ] 内容切语同页即时更新。