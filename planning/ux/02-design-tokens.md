# 02 · 设计 Token（Design Tokens）

> **作用**：所有颜色 / 字号 / 间距 / 圆角 / 阴影 / 动效在此集中声明，前后端 / Figma 共用一份事实源。
> **实现**：Tailwind preset + CSS 变量双输出（packages/ui/tokens/）。

## 一、色彩 Token

### 1.1 品牌主色（不随主题变化）
```ts
brand: {
  rose: { 50:'#fff1f2', 100:'#ffe4e6', 300:'#fda4af', 500:'#f43f5e', 600:'#e11d48', 700:'#be123c', 900:'#881337' },
  sky:  { 50:'#f0f9ff', 100:'#e0f2fe', 300:'#7dd3fc', 500:'#0ea5e9', 600:'#0284c7', 700:'#0369a1', 900:'#0c4a6e' },
  amber:{ 50:'#fffbeb', 100:'#fef3c7', 300:'#fcd34d', 500:'#f59e0b', 600:'#d97706', 700:'#b45309', 900:'#78350f' },
}
```

主色用法：
- **rose-600** = primary CTA / 重要操作 / 错误 / 学习中标记
- **sky-600** = secondary / 链接 / 信息 / 提示
- **amber-600** = tertiary / 强调 / 通关庆祝 / 知语币

### 1.2 中性色（语义化，亮暗主题各一套）

| Token | 亮模式 | 暗模式 | 用途 |
|---|---|---|---|
| `--bg-base` | `#fafafa` | `#0a0a0a` | 页面最底层 |
| `--bg-surface` | `#ffffff` | `#171717` | 卡片实色（极少用） |
| `--bg-elevated` | `#ffffff` | `#262626` | 弹窗 / 模态非毛玻璃情况下 |
| `--text-primary` | `#0a0a0a` | `#fafafa` | 主标题 / 正文 |
| `--text-secondary` | `#525252` | `#a3a3a3` | 次要文字 |
| `--text-tertiary` | `#737373` | `#737373` | 辅助 / 占位 |
| `--text-disabled` | `#d4d4d4` | `#404040` | 禁用文字 |
| `--border-default` | `rgba(0,0,0,.08)` | `rgba(255,255,255,.08)` | 默认边框 |
| `--border-strong` | `rgba(0,0,0,.16)` | `rgba(255,255,255,.16)` | 强边框（聚焦） |
| `--shadow-card` | `0 4px 12px rgba(0,0,0,.06)` | `0 4px 12px rgba(0,0,0,.4)` | 卡片阴影 |
| `--shadow-elevated` | `0 12px 32px rgba(0,0,0,.10)` | `0 12px 32px rgba(0,0,0,.5)` | 浮起阴影 |

### 1.3 语义色（功能色）
| Token | 含义 | 亮 | 暗 |
|---|---|---|---|
| `--color-success` | 正确 / 完成 | `#16a34a` | `#22c55e` |
| `--color-warning` | 警告 | `#d97706` | `#f59e0b` |
| `--color-danger` | 错误 / 失败 | `#dc2626` | `#ef4444` |
| `--color-info` | 信息 | `#0284c7` | `#0ea5e9` |

### 1.4 学习专用色
| Token | 含义 | 亮 | 暗 |
|---|---|---|---|
| `--tone-1` | 一声（高平） | `#0284c7` | `#7dd3fc` |
| `--tone-2` | 二声（升） | `#16a34a` | `#4ade80` |
| `--tone-3` | 三声（曲） | `#d97706` | `#fbbf24` |
| `--tone-4` | 四声（降） | `#dc2626` | `#f87171` |
| `--tone-0` | 轻声 | `#737373` | `#a3a3a3` |
| `--coin-gold` | 知语币 | `#eab308` | `#facc15` |

### 1.5 毛玻璃专用 Token
（详见 `03-glassmorphism-system.md`）

```css
/* 亮模式 */
--glass-bg: rgba(255,255,255,.45);
--glass-border: rgba(255,255,255,.6);
--glass-inset: inset 0 1px 0 0 rgba(255,255,255,.7);
--glass-shadow: 0 8px 24px rgba(15,23,42,.08);
--glass-blur: 16px;
--glass-saturate: 180%;

/* 暗模式 */
--glass-bg: rgba(23,23,23,.55);
--glass-border: rgba(255,255,255,.10);
--glass-inset: inset 0 1px 0 0 rgba(255,255,255,.06);
--glass-shadow: 0 8px 24px rgba(0,0,0,.4);
```

### 1.6 MeshGradient 色彩
| Token | 亮 | 暗 |
|---|---|---|
| `--mesh-1` | `#fda4af` (rose-300) | `#881337` (rose-900) |
| `--mesh-2` | `#7dd3fc` (sky-300) | `#0c4a6e` (sky-900) |
| `--mesh-3` | `#fcd34d` (amber-300) | `#78350f` (amber-900) |

## 二、字号 Token（Typography Scale）

```ts
fontSize: {
  // UI
  'caption': ['11px', { lineHeight: '14px' }],
  'micro':   ['12px', { lineHeight: '16px' }],
  'small':   ['13px', { lineHeight: '18px' }],
  'body':    ['14px', { lineHeight: '20px' }],
  'body-lg': ['16px', { lineHeight: '24px' }],
  'title':   ['20px', { lineHeight: '28px' }],
  'h3':      ['24px', { lineHeight: '32px' }],
  'h2':      ['30px', { lineHeight: '38px' }],
  'h1':      ['36px', { lineHeight: '44px' }],
  // 学习内容（中文优先）
  'zh-base': ['18px', { lineHeight: '32px', letterSpacing: '0.02em' }],
  'zh-lg':   ['22px', { lineHeight: '36px', letterSpacing: '0.02em' }],
  'zh-xl':   ['28px', { lineHeight: '44px', letterSpacing: '0.02em' }],
  'zh-hero': ['48px', { lineHeight: '60px', letterSpacing: '0.02em' }],
  // 拼音
  'pinyin-sm':  ['11px', { lineHeight: '14px' }],
  'pinyin-base':['12px', { lineHeight: '16px' }],
  'pinyin-lg':  ['16px', { lineHeight: '20px' }],
}
```

## 三、字重
- `font-light` 300（轻量装饰）
- `font-normal` 400（默认）
- `font-medium` 500（强调）
- `font-semibold` 600（小标题）
- `font-bold` 700（大标题）

## 四、字体族
```css
--font-en: 'Plus Jakarta Sans', system-ui, sans-serif;
--font-zh: 'Noto Sans SC', 'PingFang SC', system-ui, sans-serif;
--font-th: 'Sarabun', 'Noto Sans Thai', system-ui, sans-serif;
--font-vi: 'Plus Jakarta Sans', 'Noto Sans Vietnamese', system-ui, sans-serif;
--font-id: 'Plus Jakarta Sans', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace; /* 拼音 / 代码 */
--font-display: 'Plus Jakarta Sans', sans-serif; /* 大标题 */
```

## 五、间距 Token（4px 基准）
```ts
spacing: {
  '0':'0', '0.5':'2px', '1':'4px', '1.5':'6px', '2':'8px',
  '3':'12px', '4':'16px', '5':'20px', '6':'24px', '8':'32px',
  '10':'40px', '12':'48px', '16':'64px', '20':'80px', '24':'96px',
  '32':'128px', '40':'160px', '48':'192px', '64':'256px'
}
```
**间距使用准则**：
- 紧密关联元素 → 4-8px
- 一组组件内部 → 12-16px
- 不同组件之间 → 24-32px
- 区段大间隔 → 48-64px

## 六、圆角 Token
```ts
borderRadius: {
  'none':'0',
  'sm':'6px',    /* 输入框 / 小按钮 */
  'md':'10px',   /* 卡片小 */
  'lg':'16px',   /* 卡片标准 */
  'xl':'20px',   /* 大卡片 */
  '2xl':'24px',  /* 模态 */
  '3xl':'32px',  /* 浮窗 / 抽屉 */
  'full':'9999px' /* 头像 / 胶囊按钮 */
}
```

## 七、阴影 Token
```css
--shadow-sm:  0 1px 2px rgba(0,0,0,.04);
--shadow-md:  0 4px 12px rgba(0,0,0,.06);
--shadow-lg:  0 12px 32px rgba(0,0,0,.10);
--shadow-xl:  0 24px 48px rgba(0,0,0,.14);
--shadow-glow:0 0 24px rgba(225,29,72,.4); /* rose 高光 */
```

## 八、动效时长 / 缓动 Token

```ts
duration: {
  'instant': '0ms',
  'fast':    '150ms', /* 微交互 hover */
  'base':    '200ms', /* 一般过渡 */
  'medium':  '300ms', /* 模态 / 抽屉 */
  'slow':    '500ms', /* 场景过渡 */
  'celebrate':'800ms',/* 庆祝 */
  'ambient': '8000ms' /* 环境动画 */
}
easing: {
  'linear': 'linear',
  'in':     'cubic-bezier(0.4, 0, 1, 1)',
  'out':    'cubic-bezier(0, 0, 0.2, 1)',
  'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)' /* 弹簧 */
}
```

## 九、Z-Index 层级
```ts
zIndex: {
  'background': -20,
  'particles': -10,
  'base': 0,
  'content': 10,
  'sticky': 50,
  'navigation': 100,
  'overlay': 150,
  'modal': 200,
  'toast': 250,
  'tooltip': 300,
  'orientation-mask': 400, /* 横屏遮罩 */
  'popover': 500
}
```

## 十、断点 Token
```ts
screens: {
  'xs':  '375px',  /* iPhone SE */
  'sm':  '640px',  /* 大手机 */
  'md':  '768px',  /* 平板竖 */
  'lg':  '1024px', /* 平板横 / 笔电 */
  'xl':  '1280px', /* 标准桌面 */
  '2xl': '1536px', /* 大桌面 */
  /* 游戏专用 */
  'game-min': '480px x 270px', /* 16:9 最小 */
  'game-hd':  '1280px x 720px',
  'game-fhd': '1920px x 1080px'
}
```

## 十一、安全区 Token
```css
--safe-top:    env(safe-area-inset-top, 0);
--safe-right:  env(safe-area-inset-right, 0);
--safe-bottom: env(safe-area-inset-bottom, 0);
--safe-left:   env(safe-area-inset-left, 0);
--tabbar-height: 64px;
--header-height: 56px;
```

## 十二、Token 命名规则

```
--{category}-{role}-{state?}-{theme?}

示例：
--bg-base
--text-primary
--glass-bg
--button-primary-hover
--tone-1
```

Tailwind 中：
- 颜色：`bg-glass-bg / text-text-primary / border-glass-border`
- 自定义类：`.glass-card / .btn-primary`

## 十三、变量交付清单

| 文件 | 内容 |
|---|---|
| `packages/ui/tokens/colors.ts` | 全部颜色 Token TS 对象 |
| `packages/ui/tokens/typography.ts` | 字号 + 字重 + 字体族 |
| `packages/ui/tokens/spacing.ts` | 间距 + 圆角 + 阴影 |
| `packages/ui/tokens/motion.ts` | 动效时长 + 缓动 |
| `packages/ui/styles/theme.light.css` | 亮模式 CSS 变量 |
| `packages/ui/styles/theme.dark.css` | 暗模式 CSS 变量 |
| `packages/ui/tailwind-preset.ts` | Tailwind 配置导出 |

## 十四、约束检查（CI）
- [ ] 任何颜色不允许在组件内硬编码 hex（lint 阻断）
- [ ] 任何字号必须使用 token 定义
- [ ] 任何 z-index 必须从 token 选取
- [ ] 任何动效时长必须从 duration token 选取
