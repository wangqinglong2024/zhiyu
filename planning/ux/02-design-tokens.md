# 02 · 设计 Token

> 所有颜色、字体、间距、圆角、阴影、动效必须由 token 输出到 `system/packages/ui/tokens` 与 `system/packages/ui/styles`。业务组件不得硬编码品牌颜色。

## 一、颜色

### 1.1 品牌色

| Token | Light | Dark | 用途 |
|---|---:|---:|---|
| `paper` | `#F7F1E4` | `#171512` | 页面底色，宣纸/夜墨 |
| `paper-muted` | `#EFE4D0` | `#211E19` | 次级底色、分区 |
| `ink` | `#1F2421` | `#F4EFE4` | 正文主文字 |
| `ink-muted` | `#5F655F` | `#BEB6A6` | 次级文字 |
| `cinnabar` | `#B64032` | `#E06B5C` | 主 CTA、重点、危险小面积 |
| `celadon` | `#6F9F8D` | `#8DBBA8` | 次级按钮、成功、学习进度 |
| `jade` | `#2F6F5E` | `#6EA68F` | 链接、导航激活 |
| `porcelain` | `#DCE8E2` | `#253A35` | 玻璃高光、卡片表面 |
| `mist-blue` | `#AEBFCC` | `#526879` | 信息、背景雾带 |
| `aged-gold` | `#A37A32` | `#C6A15A` | 成就、徽章、金币细节 |

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

## 二、材质 token

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
  --glass-paper: rgba(247, 241, 228, .72);
  --glass-porcelain: rgba(220, 232, 226, .46);
  --glass-ink: rgba(31, 36, 33, .12);
  --line-hair: rgba(31, 36, 33, .16);
}
```

暗色主题在 `04-theme-system.md` 覆盖同名变量。

## 三、字体

| Token | 用途 | 字体栈 |
|---|---|---|
| `font-ui` | UI、表格、按钮 | Inter / Plus Jakarta Sans / system sans |
| `font-zh` | 中文正文、学习内容 | Noto Sans SC / Source Han Sans SC / system sans |
| `font-title-zh` | 少量中文标题 | Noto Serif SC / Source Han Serif SC / fallback serif |
| `font-vi` | 越南语 | Be Vietnam Pro / Noto Sans / system sans |
| `font-th` | 泰语 | Sarabun / Noto Sans Thai / system sans |
| `font-mono` | 数字、代码、审计 | JetBrains Mono / ui-monospace |

字体文件必须自托管在 `system/public/fonts` 或镜像内静态目录，禁止从外部字体 CDN 加载。

## 四、字号与行高

| Token | Size | Line | 用途 |
|---|---:|---:|---|
| `text-xs` | 12 | 16 | 辅助信息 |
| `text-sm` | 14 | 20 | 表单、表格 |
| `text-base` | 16 | 24 | 正文 |
| `text-lg` | 18 | 28 | 学习句子 |
| `text-xl` | 22 | 32 | 页面标题 |
| `text-display` | 28 | 38 | 应用端关键标题 |

不使用随视口宽度变化的字号；移动端通过断点切换固定 token。

## 五、间距、圆角、阴影

| 类别 | Token |
|---|---|
| 间距 | `4, 8, 12, 16, 20, 24, 32, 40, 48, 64` |
| 圆角 | `4, 6, 8, 12, 16, full`；卡片默认不超过 8，浮层可 12 |
| 阴影 | `shadow-ink-sm`, `shadow-ink-md`, `shadow-glass`, `shadow-seal` |

后台卡片/表格使用 6-8px 圆角；应用端底部导航、FAB 可 full。

## 六、动效 token

| Token | 值 | 用途 |
|---|---:|---|
| `duration-fast` | 100ms | 按下反馈 |
| `duration-base` | 180ms | hover、toggle |
| `duration-slow` | 260ms | modal、route |
| `ease-ink` | `cubic-bezier(.2,.8,.2,1)` | 默认进入 |
| `ease-brush` | `cubic-bezier(.16,1,.3,1)` | 轻柔展开 |

## 七、Token 验收

- [ ] Tailwind preset 与 CSS variables 同源生成。
- [ ] 明/暗主题、语义色、声调色、玻璃材质全部覆盖。
- [ ] 组件 stories 能展示 token 全量色板与可访问性对比。
- [ ] 搜索代码无旧 `rose/sky/amber` 品牌主色硬编码。