# Design System — 内观（AI 认知镜）

> **工作规则：** 做任何 UI/视觉决策前必须先读本文件。
> 所有字体、颜色、间距、动效选择均以此为准。偏离需显式说明原因。

---

## 产品上下文

- **产品：** 内观 / AI 认知镜
- **一句话：** 付费 ¥28.8，用 AI 看清自己困境的本质
- **目标用户：** 中国都市上班族，25-40 岁，正处于职场或情感困境中
- **平台：** H5 Web（移动端优先，最大宽 440px），管理端桌面优先
- **产品类型：** 付费 AI 内容工具

---

## 审美方向

- **方向：** Mesh Gradient Glassmorphism（渐变网格毛玻璃）
- **双模式：** Dark（默认）/ Light，完整 token 切换，无闪烁
- **背景：** 三色动态 Mesh（紫罗兰 + 鎏金 + 青碧节点，24-32s 缓慢漂浮）
- **玻璃层：** 三层深度（card/panel/modal），blur 20/24/32px
- **装饰哲学：** 鎏金是唯一报告专属光晕，紫罗兰用于社交功能（邀请），青碧作背景深度
- **Z 轴层次：** Mesh 背景(-10) → 玻璃 card(0) → 浮层(10) → 模态(20) → ThemeToggle(50) → 噪点纹理(9999)

---

## 颜色体系

### CSS Variables（Dark 模式）

```css
/* 背景 */
--bg-base:        #080812;

/* Mesh 节点 */
--mesh-node-1:    rgba(124, 58, 237, 0.22);   /* 紫罗兰 */
--mesh-node-2:    rgba(201, 168, 76, 0.18);   /* 鎏金 */
--mesh-node-3:    rgba(20, 184, 166, 0.14);   /* 青碧 */
--mesh-node-4:    rgba(236, 72, 153, 0.10);   /* 玫瑰（点缀） */

/* 玻璃面板 */
--surface-1:      rgba(255, 255, 255, 0.055); /* 卡片底层 */
--surface-2:      rgba(255, 255, 255, 0.09);  /* 浮层/hover */
--surface-3:      rgba(255, 255, 255, 0.13);  /* 模态框 */
--surface-input:  rgba(255, 255, 255, 0.04);  /* 输入框 */

/* 边框 */
--border-base:    rgba(255, 255, 255, 0.11);
--border-bright:  rgba(255, 255, 255, 0.20);
--border-gold:    rgba(201, 168, 76, 0.40);
--border-purple:  rgba(124, 58, 237, 0.35);

/* 鎏金体系 */
--gold-light:     #EDD07E;
--gold-base:      #C9A84C;
--gold-dark:      #A8872E;
--gold-glow:      rgba(201, 168, 76, 0.18);
--gold-grad:      linear-gradient(135deg, #A8872E 0%, #C9A84C 45%, #EDD07E 100%);

/* 紫罗兰体系 */
--purple-light:   #A78BFA;
--purple-base:    #7C3AED;
--purple-glow:    rgba(124, 58, 237, 0.20);

/* 文字 */
--text-primary:   #F0EDE8;
--text-secondary: rgba(240, 237, 232, 0.62);
--text-muted:     rgba(240, 237, 232, 0.36);
--text-gold:      #C9A84C;
--text-purple:    #A78BFA;

/* 阴影 */
--shadow-glass:   0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.14);
--shadow-gold:    0 0 40px rgba(201,168,76,0.22), 0 0 80px rgba(201,168,76,0.08);
--shadow-purple:  0 0 40px rgba(124,58,237,0.20);
--shadow-elevated:0 24px 64px rgba(0,0,0,0.65);
```

### CSS Variables（Light 模式，`[data-theme="light"]`）

```css
--bg-base:        #F0EEFF;
--surface-1:      rgba(255, 255, 255, 0.55);
--surface-2:      rgba(255, 255, 255, 0.72);
--surface-3:      rgba(255, 255, 255, 0.88);
--text-primary:   #1A1530;
--text-secondary: rgba(26, 21, 48, 0.62);
--text-gold:      #B8922A;
--text-purple:    #6D28D9;
/* 其余 border/shadow 见 styles/globals.css */
```

### 颜色用途规则

| 用途 | Token |
|------|-------|
| 主 CTA 按钮 | `--gold-grad` |
| 报告模块边框 + 光晕 | `--border-gold` + `--shadow-gold`（仅报告页） |
| 邀请/社交功能 | `--border-purple` + `--shadow-purple` |
| 错误提示 | `--error` |
| 成功/收益 | `--success` |
| 普通卡片边框 | `--border-base` |
| 输入框 focus | `--gold-base` + `--gold-glow` |

---

## 字体体系

```css
/* 主字体（中文，系统字体栈） */
--font-cn: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Noto Sans SC', sans-serif;

/* 数字/拉丁（金额、时间戳、百分比专用） */
--font-num: 'Geist', 'Geist Mono', ui-monospace, monospace;
/* font-variant-numeric: tabular-nums; 强制等宽数字 */
```

### 字号体系

```css
--text-xs:   11px / 1.4  /* 辅助说明、法律文本 */
--text-sm:   13px / 1.5  /* 标签、次要信息 */
--text-base: 15px / 1.7  /* 正文（主力字号）*/
--text-md:   17px / 1.5  /* 小标题、按钮 */
--text-lg:   20px / 1.4  /* 模块标题 */
--text-xl:   24px / 1.3  /* 页面标题 */
--text-2xl:  32px / 1.2  /* Hero 大字 */
--text-3xl:  40px / 1.1  /* 海报数字/引言 */
```

### 铭文感大字距（严格限制）

```css
/* 仅用于 2-6 字报告模块标题 */
.report-section-title {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.18em;
  color: var(--text-gold);
}
```

**严禁** 将 `letter-spacing: 0.18em` 用于正文或超过 6 个汉字的文本。

---

## 间距体系

**基准单位：8px**，密度：comfortable（移动端优先）

| Token | 值 | 用途 |
|-------|----|------|
| `--space-5` | 20px | 移动端页面横向 padding |
| `--space-6` | 24px | 卡片内边距 |
| `--space-8` | 32px | 模块间距 |
| `--space-12`| 48px | Section 间距 |

| 参数 | 值 |
|------|-----|
| 移动端横向边距 | 20px |
| 应用端最大内容宽 | 440px（居中） |
| 管理端最大内容宽 | 1280px |

---

## 圆角体系

```css
--radius-sm:   8px;      /* 标签、chip */
--radius-md:   12px;     /* 按钮、输入框 */
--radius-lg:   16px;     /* 卡片、面板 */
--radius-xl:   24px;     /* 底部弹出 sheet */
--radius-full: 9999px;   /* 头像、pill */
```

---

## 玻璃面板规格（三层深度）

```css
/* Level 1：普通卡片 */
.glass-panel {
  background: var(--surface-1);           /* rgba(255,255,255,0.055) */
  backdrop-filter: blur(20px) saturate(140%);
  border: 1px solid var(--border-base);
  border-radius: 16px;
  box-shadow: var(--shadow-glass);        /* 含 inset 顶部高亮线 */
}

/* Level 2：浮层/hover 增强 */
.glass-panel-2 {
  background: var(--surface-2);           /* rgba(255,255,255,0.09) */
  backdrop-filter: blur(24px) saturate(150%);
}

/* Level 3：模态框 */
.glass-panel-3 {
  background: var(--surface-3);           /* rgba(255,255,255,0.13) */
  backdrop-filter: blur(32px) saturate(160%);
}

/* hover 增强（cursor-pointer 卡片） */
.glass-panel-hover:hover {
  background: var(--surface-2);
  border-color: var(--border-bright);
}
```

---

## 动效体系（Framer Motion）

### 时长

```ts
const duration = {
  micro:  0.08,  // 点击反馈
  short:  0.22,  // 按钮状态
  medium: 0.38,  // 页面淡入
  long:   0.5,   // 加载动画
}
```

### 缓动

```ts
const ease = {
  enter:  'easeOut',
  exit:   'easeIn',
  spring: { type: 'spring', stiffness: 300, damping: 22 },
}
```

### 标准动效片段

```ts
// 页面切换
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

// 卡片交错进入
const cardVariants = {
  initial: { opacity: 0, y: 16, scale: 0.97 },
  animate: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.4, ease: 'easeOut', delay: 0.15 + i * 0.1 },
  }),
}

// 按钮弹压
const buttonTap = { scale: 0.96, transition: { type: 'spring', stiffness: 300, damping: 22 } }

// 主按钮光泽扫过（纯 CSS ::after hover）
// 旋转指示器
const spinVariants = { animate: { rotate: 360, transition: { duration: 1.5, ease: 'linear', repeat: Infinity } } }
```

### Mesh 背景动画（CSS keyframes）

三个 Mesh 节点各自独立的漂浮动画，周期 22-32s，纯 CSS，无 JS 帧开销。

---

## 组件规范

### 按钮

```
主按钮（Primary）:  gold-grad + hover 光泽扫过（::after）+ whileTap scale(0.96)
次按钮（Secondary）: surface-1 + border-base, hover → border-gold + text-gold
幽灵（Ghost）:       transparent，text-secondary，低优先级操作
```

### 输入框

```
登录页（底部下划线）: input-underline
表单输入（完整边框）: input-glass（blur 12px，focus → border-gold + gold-glow shadow）
```

### 徽章

```css
.glass-badge        /* 普通：surface-1，border-base */
.glass-badge-gold   /* 金色：gold-glow，border-gold */
.glass-badge-purple /* 紫色：purple-glow，border-purple */
```

### 报告页模块（最重要，严格管控）

```css
.report-module {
  border: 1px solid var(--border-gold);
  box-shadow: var(--shadow-glass), var(--shadow-gold);  /* 金色光晕 */
}
```

**红线：** `--shadow-gold` 只允许出现在报告展示页的内容模块。任何其他场景滥用破坏"报告 = 有价值"的信号。

### ThemeToggle（主题切换）

- 固定在 `fixed top-5 right-5 z-50`
- `theme-toggle` 类：36×36 圆形玻璃按钮，hover → border-gold + text-gold
- ☀️ 暗色模式显示（点击切换到亮色），🌙 亮色模式显示（点击切换回暗色）

---

## 管理端规范

管理端（`/admin/*`）使用独立视觉语言，不共享应用端设计：

- 组件库：Ant Design
- 背景：白色（`#fff`）
- 顶部导航：`#1a1a2e`（深色）
- **不** 移动端适配，1280px 桌面优先
- 优先级：功能 > 美观

---

## 合规文案（强制展示）

```
报告页底部：
本报告由 AI 根据您的描述生成，仅供参考，不构成专业职业、心理或法律建议。

输入页按钮下方：
AI生成内容仅供参考，不构成专业职业/心理建议

邀请页面：
本平台采用单级分销机制，邀请人仅对直接邀请的用户产生佣金，与多级传销无关。
```

---

## 决策日志

| 日期 | 决策 | 原因 |
|------|------|------|
| 2026-04-02 | 初始 Luxury Minimal Dark 设计建立 | /design-consultation 首版 |
| 2026-04-03 | 全面升级为 Mesh Gradient Glassmorphism | 用户要求高端毛玻璃 + 渐变网格背景 |
| 2026-04-03 | 三色 Mesh 节点（紫罗兰 + 鎏金 + 青碧） | 色彩对比度充足，与金色品牌色形成层次不平凡的搭配 |
| 2026-04-03 | Light/Dark 双模式 + data-theme 属性 + localStorage 持久化 | 用户强需求；防 FOUC 通过 initTheme() 在首帧前注入 |
| 2026-04-03 | 三层玻璃深度（blur 20/24/32px） | 与背景 Mesh 形成 Z 轴空间感；单层 blur 会失去层次 |
| 2026-04-03 | 主按钮 ::after hover 光泽扫过 | 高端感微交互，无 JS 帧开销，CSS only |
| 2026-04-03 | ThemeToggle fixed top-5 right-5 | 全局可访问，不干扰内容布局 |
| 2026-04-03 | 报告模块保留金色光晕（shadow-gold） | 付费内容必须视觉上"发光"；升级后仍是核心价值信号 |
| 2026-04-02 | 汉字大字距 0.18em（仅模块标题 2-6 字） | 铭文感差异化；此次重构保留 |
