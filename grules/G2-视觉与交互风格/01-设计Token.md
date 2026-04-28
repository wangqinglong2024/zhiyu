# 01 · 设计 Token

> 引用：[00-index.md](./00-index.md)
> 落地：`system/packages/ui-kit/src/tokens/` 输出 `tokens.css` + `tokens.ts`，供 Tailwind 4 `@theme` 与组件共同消费。
> 命名以 CSS 变量优先，方便亮 / 暗模式实时切换；TS 端通过 `getToken('color.brand')` 取值。

---

## 一、色彩

> **品牌单色：红**。亮模式底色为白、暗模式底色为黑；红色在两种模式下使用同一组色阶（仅交互态稍作微调）。
> 实现方式：CSS 变量 + `data-theme="light|dark"` 切换。

### 1.1 中性色（亮 / 暗）

| Token | 亮模式 | 暗模式 | 使用场景 |
|-------|--------|--------|---------|
| `--bg-app` | `#FFFFFF` | `#0A0A0B` | 页面整体底色（毛玻璃叠在此层之上）|
| `--bg-app-tint` | `#F6F6F7` | `#111114` | 顶部导航后方"远景"渐变底，制造毛玻璃前后景差 |
| `--bg-surface` | `rgba(255,255,255,0.62)` | `rgba(18,18,22,0.55)` | **毛玻璃面板主底色**（卡片、导航、弹窗）|
| `--bg-surface-strong` | `rgba(255,255,255,0.82)` | `rgba(20,20,24,0.78)` | 强调毛玻璃（弹窗、Drawer）|
| `--bg-overlay` | `rgba(0,0,0,0.32)` | `rgba(0,0,0,0.55)` | 遮罩层 |
| `--bg-hover` | `rgba(0,0,0,0.04)` | `rgba(255,255,255,0.06)` | 列表项 hover |
| `--bg-active` | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.10)` | 列表项 active / 选中浅底 |
| `--text-primary` | `#0E0E11` | `#F4F4F5` | 标题、正文 |
| `--text-secondary` | `#52525B` | `#A1A1AA` | 描述、辅助 |
| `--text-tertiary` | `#9A9AA3` | `#6B6B73` | 占位、时间戳 |
| `--text-disabled` | `#C7C7CC` | `#4A4A52` | 禁用 |
| `--text-on-brand` | `#FFFFFF` | `#FFFFFF` | 红底上的文字 |
| `--border-subtle` | `rgba(15,15,20,0.08)` | `rgba(255,255,255,0.10)` | 毛玻璃面板内边框、分割线 |
| `--border-strong` | `rgba(15,15,20,0.18)` | `rgba(255,255,255,0.22)` | 输入框边框 |
| `--ring` | `rgba(255,36,66,0.45)` | `rgba(255,59,92,0.55)` | focus ring（红色半透明）|

### 1.2 品牌红（亮 / 暗共用一套，仅交互态切换亮度）

> **品牌红选型（PM 决策）**：对标 **小红书 / Reddit** 的鲜红，饱和高、趣味化；不使用偏暗的中国红。亮模式 = 小红书红 `#FF2442`；暗模式 = 略提亮的 `#FF3B5C`（暗底上保证对比度与辉度）。

| Token | 亮模式 | 暗模式 | 使用场景 |
|-------|--------|--------|---------|
| `--brand` | `#FF2442` | `#FF3B5C` | 主按钮、链接、选中态、Logo |
| `--brand-hover` | `#E61E3B` | `#FF5470` | 主按钮 hover |
| `--brand-active` | `#CC1A34` | `#E62945` | 主按钮 active |
| `--brand-soft` | `rgba(255,36,66,0.10)` | `rgba(255,59,92,0.14)` | 选中行浅底、Tag 背景、Toast 信息底 |
| `--brand-soft-strong` | `rgba(255,36,66,0.18)` | `rgba(255,59,92,0.22)` | hover 浅底 |
| `--brand-on` | `#FFFFFF` | `#FFFFFF` | 红底上的文字 / 图标（两模式统一白字，保持鲜红上的高识别度）|

> **品牌色变量**：根色以 **`--brand`** 为唯一变量。**用户可在「设置 → 显示」中自定义主题色**（详见 [06-响应式与暗黑模式 §七 主题色自定义](./06-响应式与暗黑模式.md)）；选定后仅覆盖 `--brand / --brand-hover / --brand-active / --brand-soft*` 全套，其他黑白中性色均不变。默认主题色 = 小红书红。

> **唯一彩色 = 红**。其他视觉差异**只能用透明度与中性色**实现，不允许引入第二种品牌色（除非用户主动在设置中换色）。

### 1.3 语义色（同时尊重"黑白红"基调，使用低饱和中性变体）

> 状态色不破坏整体黑白红调性：成功 / 警告 / 错误均以"中性灰底 + 文字色"为主，错误态复用品牌红，避免引入新颜色。

| Token | 亮模式 | 暗模式 | 用途 |
|-------|--------|--------|------|
| `--success` | `#16A34A` | `#22C55E` | 成功提示、正向状态文字（仅文字 / 图标使用，不做大面积底色）|
| `--success-soft` | `rgba(22,163,74,0.10)` | `rgba(34,197,94,0.16)` | 成功 Tag 底 |
| `--warning` | `#D97706` | `#F59E0B` | 警告提示文字 / 图标 |
| `--warning-soft` | `rgba(217,119,6,0.10)` | `rgba(245,158,11,0.16)` | 警告 Tag 底 |
| `--danger` | `--brand` | `--brand` | **复用品牌红**：错误 / 删除 / 拒绝 |
| `--danger-soft` | `--brand-soft` | `--brand-soft` | 错误 Tag 底 |
| `--info` | `--text-secondary` | `--text-secondary` | 一般信息（不引入蓝色）|
| `--info-soft` | `--bg-active` | `--bg-active` | 一般信息底 |

---

## 二、字体

> 字体托管详见 [G1-07-国际化与响应式 §七](../G1-架构与技术规范/07-国际化与响应式.md)。本节定义字号 / 字重 / 行高 token。

### 2.1 字体栈（CSS `font-family`）

```css
--font-sans:
  "Inter", "Be Vietnam Pro", "Noto Sans Thai Looped",
  "Noto Sans SC", system-ui, -apple-system, "Segoe UI",
  Roboto, "Helvetica Neue", Arial, sans-serif;

--font-serif:
  "Noto Serif SC", "Source Han Serif SC", Georgia, serif;

--font-mono:
  "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
```

### 2.2 文本规模

| Token | 字号 | 字重 | 行高 | 用途 |
|-------|------|------|------|------|
| `text-display` | 36px | 700 | 1.2 | 营销页超大标题（仅落地页）|
| `text-h1` | 28px | 700 | 1.25 | 页面标题 |
| `text-h2` | 22px | 600 | 1.3 | 卡片 / 区域标题 |
| `text-h3` | 18px | 600 | 1.35 | 子标题、抽屉标题 |
| `text-body` | 14px | 400 | 1.6 | 正文（移动端 base 不小于 14px）|
| `text-body-lg` | 16px | 400 | 1.6 | 长阅读场景（小说、课程内容）|
| `text-caption` | 12px | 400 | 1.5 | 辅助说明、时间戳 |
| `text-table` | 14px | 400 | 1.5 | 表格内容 |
| `text-button` | 14px | 500 | 1 | 按钮文字 |
| `text-tag` | 12px | 500 | 1 | 状态 / 标签 |

> **中文教学场景**（汉字卡片、释义页）使用 `--font-serif`，其余 UI 一律 `--font-sans`。

---

## 三、间距、圆角与阴影

### 3.1 间距（4px grid）

| Token | 值 | 适用 |
|-------|---|------|
| `space-1` | 4px | 紧凑相邻 |
| `space-2` | 8px | 控件内内边距、icon-text 间隔 |
| `space-3` | 12px | 表单字段间隔 |
| `space-4` | 16px | 卡片内边距、按钮间距（标准）|
| `space-5` | 24px | 区块间距（宽松）|
| `space-6` | 32px | 大区块、页面区段 |
| `space-7` | 48px | 顶部 hero 区域 |
| `space-page-x-mobile` | 16px | 移动端页面左右内边距 |
| `space-page-x-desktop` | 32px | 桌面端页面左右内边距 |
| `space-page-y` | 24px | 页面顶部内容到导航栏的间距 |

### 3.2 圆角

| Token | 值 | 适用 |
|-------|---|------|
| `radius-sm` | 6px | 按钮、输入框、Tag |
| `radius-md` | 12px | 卡片、Toast、下拉菜单 |
| `radius-lg` | 18px | 弹窗、Drawer、毛玻璃大面板 |
| `radius-pill` | 9999px | 头像、Pill 按钮、状态徽标 |

### 3.3 阴影（在毛玻璃上需轻量、避免脏感）

| Token | 亮模式 | 暗模式 | 适用 |
|-------|--------|--------|------|
| `shadow-sm` | `0 1px 2px rgba(15,15,20,0.04), 0 1px 1px rgba(15,15,20,0.03)` | `0 1px 2px rgba(0,0,0,0.50)` | 按钮、输入聚焦 |
| `shadow-md` | `0 6px 18px rgba(15,15,20,0.08)` | `0 6px 18px rgba(0,0,0,0.55)` | 下拉菜单、Toast |
| `shadow-lg` | `0 18px 48px rgba(15,15,20,0.14)` | `0 18px 48px rgba(0,0,0,0.65)` | 弹窗、Drawer |
| `shadow-glass-edge` | `inset 0 1px 0 rgba(255,255,255,0.40)` | `inset 0 1px 0 rgba(255,255,255,0.06)` | 毛玻璃面板顶部高光（关键质感）|

---

## 四、毛玻璃面板专用 Token（核心质感）

> 用户硬性要求：**全局毛玻璃**（导航、按钮、卡片、Tab、Toast、弹窗都要满足毛玻璃风格）。
> 每个毛玻璃组件均由 4 个图层组成：**远景渐变底 → backdrop-filter 模糊 → 半透明面色 → 顶部 1px 高光内边**。

### 4.1 全局变量

| Token | 亮模式 | 暗模式 | 说明 |
|-------|--------|--------|------|
| `--glass-blur-sm` | `blur(10px) saturate(140%)` | `blur(10px) saturate(140%)` | 按钮、Tag |
| `--glass-blur-md` | `blur(18px) saturate(150%)` | `blur(18px) saturate(150%)` | 卡片、导航、Toast |
| `--glass-blur-lg` | `blur(28px) saturate(160%)` | `blur(28px) saturate(160%)` | 弹窗、Drawer |
| `--glass-bg` | `var(--bg-surface)` | `var(--bg-surface)` | 主面板色（已含 alpha）|
| `--glass-bg-strong` | `var(--bg-surface-strong)` | `var(--bg-surface-strong)` | 强毛玻璃 |
| `--glass-border` | `1px solid var(--border-subtle)` | `1px solid var(--border-subtle)` | 内边框 |
| `--glass-edge` | `var(--shadow-glass-edge)` | `var(--shadow-glass-edge)` | 顶部高光 |
| `--glass-noise-opacity` | `0.025` | `0.04` | 可选噪点纹理强度（Stitch 风格细节）|

### 4.2 工具类（Tailwind 4 `@layer components`）

```css
.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur-md);
  -webkit-backdrop-filter: var(--glass-blur-md);
  border: var(--glass-border);
  box-shadow: var(--shadow-md), var(--glass-edge);
  border-radius: var(--radius-lg);
}
.glass-nav   { @apply glass-panel; backdrop-filter: var(--glass-blur-md); border-radius: 0; }
.glass-card  { @apply glass-panel; }
.glass-modal { @apply glass-panel; background: var(--glass-bg-strong);
               backdrop-filter: var(--glass-blur-lg); box-shadow: var(--shadow-lg), var(--glass-edge); }
.glass-button{ @apply glass-panel; backdrop-filter: var(--glass-blur-sm);
               border-radius: var(--radius-sm); box-shadow: var(--shadow-sm), var(--glass-edge); }
.glass-toast { @apply glass-panel; }
.glass-tab   { @apply glass-panel; border-radius: var(--radius-pill); }
```

### 4.3 强制实施约束

1. **页面背景必须有"远景"**：纯白 / 纯黑会让毛玻璃失效。`<body>` 默认绘制"`--bg-app` + 微噪 + 偏移红色径向渐变光斑（透明度 8%）"作为底层；详见 [02-全局布局.md §三](./02-全局布局.md)。
2. **不允许 `background: white/black` 的卡片**：如需"实心"风格，使用 `glass-modal`（不透明度更高）替代。
3. **降级**：浏览器不支持 `backdrop-filter` 时，落 `--bg-surface-strong`（已是高不透明度）+ `shadow-md`，保留可读性。
4. **嵌套**：毛玻璃面板内禁止再嵌套毛玻璃面板（避免叠加模糊导致脏）；如需层次，用 `--bg-hover` / `--bg-active` 区分。
5. **性能**：低端 Android 检测到掉帧时（`navigator.deviceMemory < 4` 或用户在偏好设置主动关闭）自动切换为"伪毛玻璃"（高不透明度 + 噪点 + 无 `backdrop-filter`），详见 [06 §四](./06-响应式与暗黑模式.md)。

---

## 五、动效 Token

| Token | 值 | 用途 |
|-------|---|------|
| `--motion-fast` | `120ms cubic-bezier(0.2, 0.8, 0.2, 1)` | hover、focus |
| `--motion-base` | `200ms cubic-bezier(0.2, 0.8, 0.2, 1)` | 主交互、按钮 |
| `--motion-slow` | `320ms cubic-bezier(0.16, 1, 0.3, 1)` | 弹窗、Drawer 进出 |
| `--motion-spring` | Framer Motion `{ type: 'spring', stiffness: 260, damping: 28 }` | 拖拽、列表插入 |

> 必须尊重 `@media (prefers-reduced-motion: reduce)`：所有动效降级为 `0ms` 透明度切换。

---

## 六、Tailwind 4 集成

`system/packages/ui-kit/src/tokens/theme.css`：

```css
@theme {
  --color-brand: var(--brand);
  --color-brand-hover: var(--brand-hover);
  --color-bg-app: var(--bg-app);
  --color-surface: var(--bg-surface);
  --color-text: var(--text-primary);
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --shadow-md: var(--shadow-md);
  --font-sans: var(--font-sans);
}
:root[data-theme="light"] { /* 1.1 / 1.2 / 1.3 亮模式赋值 */ }
:root[data-theme="dark"]  { /* 1.1 / 1.2 / 1.3 暗模式赋值 */ }
```

> **唯一来源**：所有页面 / 组件不得再硬编码颜色 / 字号 / 圆角。新增 token 必须先增改本文件。
