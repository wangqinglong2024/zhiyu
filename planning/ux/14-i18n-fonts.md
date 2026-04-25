# 14 · 国际化与字体（i18n & Fonts）

## 一、支持语言

### v1（必备）
| 代码 | 语言 | 区域 |
|---|---|---|
| `en` | English | 全球 |
| `vi` | Tiếng Việt | 越南 |
| `th` | ไทย | 泰国 |
| `id` | Bahasa Indonesia | 印尼 |

### v1.5（次要）
- `zh-CN`：管理后台优先；应用端中文 UI（学习者可选）

### v2（评估）
- `ms` 马来语
- `ta` 泰米尔语（新加坡）
- `tl` 菲律宾语

## 二、i18n 框架

### 2.1 库
- `i18next` + `react-i18next`
- `i18next-browser-languagedetector`
- `i18next-http-backend`

### 2.2 翻译文件
```
locales/
  en/
    common.json
    discover.json
    courses.json
    games.json
    profile.json
    admin.json
  vi/
    ...
  th/
    ...
  id/
    ...
```

### 2.3 命名空间
- `common`：通用按钮 / 操作 / 错误
- 各模块独立命名空间（按需懒加载）

### 2.4 Key 命名
- 嵌套层级：`courses.stage.title`
- 复数：i18next plurals
- 插值：`{{name}}`
- 富文本：Trans 组件

## 三、内容多语言

### 3.1 学习内容
- 中文原文（不翻译）
- 拼音（统一 pinyin 库生成）
- 翻译：5 种语言全部产出
  - 字段：`translation_en` `translation_vi` `translation_th` `translation_id` `translation_zh`
- 数据库设计：`content_translations` 表（content_id + lang + body）

### 3.2 UI 文案
- i18next 自动切换
- 缺失 fallback 到 en

## 四、语言检测与切换

### 4.1 优先级
1. URL 路径 `/en/...` `/vi/...`
2. 用户设置（已登录）
3. localStorage `i18nextLng`
4. 浏览器 Accept-Language
5. 默认 `en`

### 4.2 切换 UI
- /profile/settings → 显示语言选项
- 顶部全球图标 → 弹出语言菜单（应用端可选）
- 后台 TopBar → 用户菜单内

### 4.3 切换效果
- 即时切换（无刷新）
- URL 同步更新
- 用户偏好持久化

## 五、字体方案

### 5.1 字体加载
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&family=Noto+Sans+TC:wght@400&display=swap">
```

### 5.2 字体栈
```css
--font-sans-zh: 'Noto Sans SC', 'Source Han Sans CN', 'PingFang SC', 'Microsoft YaHei', sans-serif;
--font-sans-en: 'Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-sans-vi: 'Noto Sans', 'Be Vietnam Pro', sans-serif;
--font-sans-th: 'Noto Sans Thai', 'Sarabun', sans-serif;
--font-sans-id: 'Noto Sans', sans-serif;

--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
--font-display: 'Cal Sans', 'Inter Display', sans-serif;
```

### 5.3 按语言应用
```css
:root[lang^="zh"] body { font-family: var(--font-sans-zh); }
:root[lang^="vi"] body { font-family: var(--font-sans-vi); }
:root[lang^="th"] body { font-family: var(--font-sans-th); }
:root[lang^="id"] body { font-family: var(--font-sans-id); }
:root[lang^="en"] body { font-family: var(--font-sans-en); }
```

### 5.4 拼音字体
- Noto Sans（声调 Unicode 完整支持）
- 字号 = 汉字字号 × 0.6
- 字距适中

### 5.5 字符子集
- Noto Sans SC：常用 7000 字 + GB2312 + HSK 6 全集 + 标点
- Noto Sans Thai：泰文全集
- Noto Sans：拉丁 + 越南扩展

### 5.6 字体性能
- woff2 优先
- font-display: swap
- preload 关键字体（中文 + 英文）
- 子集化（仅常用字符）→ 包大小 < 500KB

## 六、文本方向

### 6.1 LTR（默认）
- 全部支持语言均 LTR

### 6.2 RTL（v2 预留）
- 添加 `dir="rtl"` 时翻转
- Tailwind RTL 插件
- icon 翻转 / 数字保留

## 七、日期 / 时间 / 数字

### 7.1 库
- `Intl.DateTimeFormat` (原生)
- `date-fns` + locale

### 7.2 格式
- 日期：按 locale 自动
  - en: `Jan 15, 2026`
  - vi: `15 thg 1, 2026`
  - th: `15 ม.ค. 2569` (佛历)
  - id: `15 Jan 2026`
- 时间：12h / 24h 按 locale
- 时区：UTC 存储，按用户时区显示

### 7.3 数字
- `Intl.NumberFormat`
- 千分位 / 小数点按 locale
- 货币：用户国家本币 + USD

## 八、价格本地化

### 8.1 货币
| 国家 | 货币 |
|---|---|
| 越南 | VND |
| 泰国 | THB |
| 印尼 | IDR |
| 新加坡 | SGD |
| 马来 | MYR |
| 菲律宾 | PHP |
| 其他 | USD |

### 8.2 PPP 定价
- 各国独立定价（参考购买力平价）
- 支付时按国家显示

### 8.3 显示
```
月度订阅 99,000₫ / mo (≈ $4)
```

## 九、内容审稿

### 9.1 翻译审稿
- AI 初译 → 母语审稿员审校
- 评分 1-5
- 不合格回改写

### 9.2 文化适配
- 避免冒犯（宗教 / 政治 / 习俗）
- 例：印尼避免猪相关示例
- 越南避免中越敏感话题

## 十、SEO 多语言

### 10.1 Sitemap
- 每语言独立 sitemap
- hreflang 标记

### 10.2 Meta
- title / description 每语言独立
- og:locale

### 10.3 URL
- `https://app.zhiyu.io/en/discover`
- `https://app.zhiyu.io/vi/discover`
- `https://app.zhiyu.io/th/discover`
- `https://app.zhiyu.io/id/discover`

## 十一、检查清单

- [ ] 4 种语言 UI 全部翻译
- [ ] 学习内容 5 种翻译均覆盖
- [ ] 字体按语言切换
- [ ] 日期 / 数字 / 货币本地化
- [ ] 价格按国家本地化
- [ ] hreflang 配置
- [ ] 字符子集化优化包大小
- [ ] RTL 预留（v2）
