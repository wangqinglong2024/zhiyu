# 02 · 设计 Token

> 所有颜色、字体、间距、圆角、阴影、动效必须由 token 输出到 `system/packages/ui/tokens` 与 `system/packages/ui/styles`。业务组件不得硬编码品牌颜色。shadcn/ui 的 `background`、`foreground`、`card`、`popover`、`primary`、`secondary`、`muted`、`accent`、`destructive`、`border`、`input`、`ring` 必须映射到本文件 token。

## 一、颜色

### 1.1 品牌色

| Token | Light | Dark | 用途 |
|---|---:|---:|---|
| `paper` | `#F7F1E4` | `#151617` | 页面底色，暖白/深墨 |
| `paper-muted` | `#EEE7DA` | `#1D2021` | 次级底色、分区 |
| `ink` | `#1F2421` | `#F4EFE4` | 正文主文字 |
| `ink-muted` | `#5E6661` | `#B9B2A5` | 次级文字 |
| `cinnabar` | `#B64032` | `#EF7768` | 主 CTA、重点、危险小面积 |
| `jade` | `#2F6F5E` | `#7CC3A7` | 链接、导航激活、focus ring |
| `celadon` | `#6F9F8D` | `#9BCDB8` | 成功、学习进度 |
| `porcelain` | `#DCE8E2` | `#243B36` | 玻璃高光、卡片表面 |
| `mist-blue` | `#AEBFCC` | `#617789` | 信息、背景雾带 |
| `obsidian` | `#20262A` | `#E9EEF0` | 深玻璃文字与边界 |
| `aged-gold` | `#A37A32` | `#D1AE63` | 成就、徽章、金币细节 |

### 1.2 语义色

| 语义 | Token | 要求 |
|---|---|---|
| success | `celadon` | 必须配图标/文字，不只靠颜色 |
| warning | `aged-gold` | 避免大面积金黄 |
| danger | `cinnabar` | 删除/错误/阻断 |
| info | `mist-blue` | 提示与系统信息 |
| focus | `jade` | 焦点环需满足 3:1 对比 |

### 1.3 声调色

| 声调 | Token | Hex |
|---|---|---:|
| 一声 | `tone-1` | `#2F6F5E` |
| 二声 | `tone-2` | `#6F8FA6` |
| 三声 | `tone-3` | `#A37A32` |
| 四声 | `tone-4` | `#B64032` |
| 轻声 | `tone-neutral` | `#7A786F` |

## 二、shadcn/ui 映射

| shadcn token | Light | Dark | 说明 |
|---|---:|---:|---|
| `--background` | `var(--surface-paper)` | `#151617` | 页面底 |
| `--foreground` | `var(--text-ink)` | `#F4EFE4` | 文本 |
| `--card` | `var(--glass-panel)` | `var(--glass-panel)` | Card 玻璃 |
| `--popover` | `var(--glass-elevated)` | `var(--glass-elevated)` | Popover/Dialog |
| `--primary` | `var(--brand-cinnabar)` | `var(--brand-cinnabar)` | 主动作 |
| `--secondary` | `var(--glass-subtle)` | `var(--glass-subtle)` | 次级动作 |
| `--muted` | `var(--surface-paper-muted)` | `#1D2021` | 低强调 |
| `--accent` | `var(--brand-jade)` | `var(--brand-jade)` | 选中/链接 |
| `--destructive` | `var(--brand-cinnabar)` | `var(--brand-cinnabar)` | 危险 |
| `--border` | `var(--line-glass)` | `var(--line-glass)` | 玻璃边 |
| `--input` | `var(--glass-subtle)` | `var(--glass-subtle)` | 输入底 |
| `--ring` | `var(--brand-jade)` | `var(--brand-jade)` | focus |

## 三、材质 token

```css
:root {
  --surface-paper: #F7F1E4;
  --surface-paper-muted: #EFE4D0;
  --text-ink: #1F2421;
  --text-ink-muted: #5F655F;
  --brand-cinnabar: #B64032;
  --brand-jade: #2F6F5E;
  --brand-celadon: #6F9F8D;
  --brand-porcelain: #DCE8E2;
  --brand-aged-gold: #A37A32;
  --glass-subtle: rgba(247, 241, 228, .58);
  --glass-panel: rgba(247, 241, 228, .74);
  --glass-elevated: rgba(255, 252, 244, .84);
  --glass-strong: rgba(244, 239, 228, .92);
  --glass-ink: rgba(31, 36, 33, .42);
  --line-glass: rgba(31, 36, 33, .16);
  --highlight-glass: rgba(255,255,255,.58);
  --shadow-glass-sm: 0 8px 24px rgba(31,36,33,.10);
  --shadow-glass-md: 0 16px 44px rgba(31,36,33,.14);
  --shadow-glass-lg: 0 28px 80px rgba(31,36,33,.18);
}
```

暗色主题在 `04-theme-system.md` 覆盖同名变量。

## 四、字体

| Token | 用途 | 字体栈 |
|---|---|---|
| `font-ui` | UI、表格、按钮 | Inter / Plus Jakarta Sans / system sans |
| `font-zh` | 中文正文、学习内容 | Noto Sans SC / Source Han Sans SC / system sans |
| `font-title-zh` | 少量中文标题 | Noto Serif SC / Source Han Serif SC / fallback serif |
| `font-vi` | 越南语 | Be Vietnam Pro / Noto Sans / system sans |
| `font-th` | 泰语 | Sarabun / Noto Sans Thai / system sans |
| `font-mono` | 数字、代码、审计 | JetBrains Mono / ui-monospace |

字体文件必须自托管在 `system/public/fonts` 或镜像内静态目录，禁止从外部字体 CDN 加载。

## 五、字号与行高

| Token | Size | Line | 用途 |
|---|---:|---:|---|
| `text-xs` | 12 | 16 | 辅助信息 |
| `text-sm` | 14 | 20 | 表单、表格 |
| `text-base` | 16 | 24 | 正文 |
| `text-lg` | 18 | 28 | 学习句子 |
| `text-xl` | 22 | 32 | 页面标题 |
| `text-display` | 28 | 38 | 应用端关键标题 |

不使用随视口宽度变化的字号；移动端通过断点切换固定 token。

## 六、间距、圆角、阴影

| 类别 | Token |
|---|---|
| 间距 | `4, 8, 12, 16, 20, 24, 32, 40, 48, 64` |
| 圆角 | `4, 6, 8, 12, 16, full`；普通卡片默认 8，表格/后台 6-8，浮层可 12 |
| 阴影 | `shadow-glass-sm`, `shadow-glass-md`, `shadow-glass-lg`, `shadow-seal` |

后台卡片/表格使用 6-8px 圆角；应用端底部导航、FAB 可 full。

## 七、动效 token

| Token | 值 | 用途 |
|---|---:|---|
| `duration-fast` | 100ms | 按下反馈 |
| `duration-base` | 180ms | hover、toggle |
| `duration-slow` | 260ms | modal、route |
| `ease-ink` | `cubic-bezier(.2,.8,.2,1)` | 默认进入 |
| `ease-brush` | `cubic-bezier(.16,1,.3,1)` | 轻柔展开 |
| `press-scale` | `.97` | Button/IconButton/Card 按压 |
| `hover-lift` | `1px` | 可点击组件 hover 抬升 |

## 八、玻璃组件类

| 类名 | 用途 |
|---|---|
| `.zy-glass-subtle` | Button secondary、Input、Badge、Tab |
| `.zy-glass-panel` | Card、Table、Sidebar、Header、Sheet |
| `.zy-glass-elevated` | Dialog、Popover、Dropdown、Toast、Command |
| `.zy-glass-strong` | 阅读句子、后台表格单元、表单高可读区域 |
| `.zy-glass-ink` | Cover/HUD/深色图像上的操作层 |

所有 shadcn/ui 组件必须至少使用上述一个类名或等价 token 组合。

## 九、Token 验收

- [ ] Tailwind preset 与 CSS variables 同源生成。
- [ ] 明/暗主题、语义色、声调色、玻璃材质全部覆盖。
- [ ] 组件 stories 能展示 token 全量色板与可访问性对比。
- [ ] 搜索代码无旧 `rose/sky/amber` 品牌主色硬编码。
- [ ] shadcn/ui 主题 token 全量映射到本文件，业务侧不直接使用默认 shadcn 灰阶。
- [ ] Button、Card、Input、Dialog、Table、Toast、Dropdown、Tooltip 均展示玻璃状态矩阵。