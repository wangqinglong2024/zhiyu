# 02 · 设计 Token

> 所有颜色、字体、间距、圆角、阴影、动效必须由 token 输出到 `system/packages/ui/tokens` 与 `system/packages/ui/styles`。业务组件不得硬编码品牌颜色。shadcn/ui 的 `background`、`foreground`、`card`、`popover`、`primary`、`secondary`、`muted`、`accent`、`destructive`、`border`、`input`、`ring` 必须映射到本文件 token。

## 一、颜色

### 1.1 品牌色

> 2025-Q1 重写：从「暖宣纸」转向「冷瓷釉 + 极光雾带」。整体更现代大气；东方意象保留在朱砂/玉/金三色与字体上。

| Token | Light | Dark | 用途 |
|---|---:|---:|---|
| `paper` | `#F4F6F7` | `#0C1014` | 页面底，冷瓷釉/午夜墨 |
| `paper-muted` | `#E9ECEF` | `#131820` | 次级底色、分区 |
| `ink` | `#14181B` | `#EEF2F5` | 正文主文字 |
| `ink-muted` | `#5B6770` | `#AAB4BE` | 次级文字 |
| `ink-soft` | `#8A96A0` | `#6F7A85` | 占位、辅助 |
| `cinnabar` | `#D24A3C` | `#FF7A6B` | 主 CTA、重点、危险小面积 |
| `cinnabar-soft` | `#EC7565` | `#FF9A8E` | 印章高光、CTA 渐变上 |
| `jade` | `#1F7A66` | `#6DD3B1` | 链接、导航激活、focus ring |
| `jade-soft` | `#4EA58D` | `#97E1C5` | 进度条尾色、成功玻璃染色 |
| `celadon` | `#74B8A1` | `#A8E0C9` | 成功强化色 |
| `mist-blue` | `#7A96AD` | `#6E8AA3` | 信息、背景雾带 |
| `mist-violet` | `#8D8EC0` | `#9D9FD6` | 极光雾带紫调 |
| `aged-gold` | `#B3873A` | `#E0BB6B` | 拼音/声调金、成就 |
| `obsidian` | `#14181B` | `#EEF2F5` | 深玻璃文字 |

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
  /* 表面 */
  --surface-paper: #F4F6F7;
  --surface-paper-muted: #E9ECEF;
  --text-ink: #14181B;
  --text-ink-muted: #5B6770;
  --text-ink-soft: #8A96A0;

  /* 品牌 */
  --brand-cinnabar: #D24A3C;
  --brand-cinnabar-soft: #EC7565;
  --brand-jade: #1F7A66;
  --brand-jade-soft: #4EA58D;
  --brand-mist-violet: #8D8EC0;
  --brand-aged-gold: #B3873A;

  /* 玻璃层级（透明度递进） */
  --glass-subtle:    rgba(255, 255, 255, .42);
  --glass-panel:     rgba(255, 255, 255, .58);
  --glass-elevated:  rgba(255, 255, 255, .72);
  --glass-strong:    rgba(255, 255, 255, .86);
  --glass-ink:       rgba(20, 24, 27, .46);
  --glass-tint-jade: rgba(31, 122, 102, .10);
  --glass-tint-cina: rgba(210, 74, 60, .10);
  --glass-highlight: rgba(255, 255, 255, .78);
  --glass-edge:      rgba(255, 255, 255, .92);
  --glass-rim:       rgba(255, 255, 255, .55);

  /* 线条 */
  --line-glass:  rgba(20, 24, 27, .10);
  --line-hair:   rgba(20, 24, 27, .08);
  --line-strong: rgba(20, 24, 27, .18);

  /* 阴影：双层 ambient + key + 微色相 */
  --shadow-glass-sm: 0 1px 2px rgba(20,24,27,.06), 0 8px 22px -10px rgba(20,24,27,.14);
  --shadow-glass-md: 0 2px 4px rgba(20,24,27,.06), 0 22px 48px -18px rgba(20,24,27,.22);
  --shadow-glass-lg: 0 4px 8px rgba(20,24,27,.08), 0 40px 80px -28px rgba(20,24,27,.34);
  --shadow-seal: 0 4px 10px rgba(210,74,60,.18), 0 22px 44px -16px rgba(210,74,60,.42);
  --shadow-jade: 0 4px 10px rgba(31,122,102,.18), 0 22px 44px -16px rgba(31,122,102,.42);

  /* 焦点 */
  --focus-ring: 0 0 0 3px rgba(31,122,102,.28);
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
| 圆角 | `radius-xs:6 / radius-sm:10 / radius:14 / radius-lg:20 / radius-xl:28 / radius-full:999`。卡片/输入默认 14，按钮/输入小尺寸 10，主题选择卡 20，浮层/底栏 28。 |
| 阴影 | `shadow-glass-sm`, `shadow-glass-md`, `shadow-glass-lg`, `shadow-seal`（朱砂染色）, `shadow-jade`（玉色染色） |
| 模糊 | 玻璃 `backdrop-filter: blur(14-36px) saturate(140-180%)`：subtle 14、panel 20-28、elevated 36；ink 28 |
| 缓动 | `ease-ink` 标准、`ease-brush` 长动画、`ease-spring` 弹性按压 |

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