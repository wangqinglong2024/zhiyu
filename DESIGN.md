# Design System — 内观（AI 认知镜）

> **工作规则：** 做任何 UI/视觉决策前必须先读本文件。
> 所有字体、颜色、间距、动效选择均以此为准。偏离需显式说明原因。

---

## 产品上下文

- **产品：** 内观 / AI 认知镜
- **一句话：** 付费 ¥28.8，用 AI 看清自己困境的本质
- **目标用户：** 中国都市上班族，25-40 岁，正处于职场或情感困境中。他们不只是在用工具，他们在求助。
- **平台：** H5 Web（移动端优先，最大宽 440px），管理端桌面优先
- **产品类型：** 付费 AI 内容工具

---

## 审美方向

- **方向：** Luxury Minimal Dark（鎏金极简暗）
- **装饰级别：** intentional（精心克制）— 金色是唯一装饰语言，其余一律退让
- **意境：** A24 电影字幕卡 × 古青铜铸造 × 深夜私人诊室。用户付了钱才看到报告，设计必须让他觉得值。
- **设计原则：** 黑暗是背景，金色是唯一说话的颜色。不过度装饰，不使用渐变泡泡/圆形图标网格/居中平铺等 AI 烂俗套路。

---

## 颜色体系

### CSS Custom Properties

```css
/* === 背景层 === */
--bg-base:       #0A0A0F;
--bg-mesh:       radial-gradient(ellipse 80% 60% at 20% 30%, rgba(201,168,76,0.07) 0%, transparent 60%),
                 radial-gradient(ellipse 60% 40% at 80% 70%, rgba(201,168,76,0.04) 0%, transparent 55%),
                 radial-gradient(ellipse 100% 100% at 50% 50%, #0D0C14 0%, #0A0A0F 100%);

/* === 玻璃面板层 === */
--surface-1:     rgba(255,255,255,0.05);   /* 卡片底层 */
--surface-2:     rgba(255,255,255,0.08);   /* 浮层 / 激活态 */
--surface-3:     rgba(255,255,255,0.12);   /* 模态框 / 最高层 */
--border-soft:   rgba(255,255,255,0.08);
--border-base:   rgba(255,255,255,0.12);
--border-gold:   rgba(201,168,76,0.35);    /* 高亮边框 */

/* === 金色体系 === */
--gold-light:    #E8C97A;
--gold-base:     #C9A84C;                  /* 主色 */
--gold-dark:     #A8872E;
--gold-glow:     rgba(201,168,76,0.15);    /* 报告区域光晕 */
--gold-grad:     linear-gradient(135deg, #A8872E 0%, #C9A84C 40%, #E8C97A 100%);

/* === 文字体系 === */
--text-primary:   #F0EDE6;
--text-secondary: rgba(240,237,230,0.60);
--text-muted:     rgba(240,237,230,0.35);
--text-disabled:  rgba(240,237,230,0.20);
--text-gold:      #C9A84C;

/* === 语义颜色 === */
--success: #4CAF82;
--warning: #E8A838;
--error:   #E05454;
--info:    #5B8FE8;
```

### 使用规则

| 用途 | Token |
|------|-------|
| 主要 CTA 按钮背景 | `--gold-grad` |
| 报告模块标题文字 | `--text-gold` |
| 报告模块边框 | `--border-gold` |
| 报告模块阴影 | `--shadow-gold` |
| 普通卡片 | `--surface-1` + `--border-base` |
| 所有错误提示 | `--error` |
| 提现成功/已打款 | `--success` |

---

## 字体体系

### 字体栈

```css
/* 主字体（中文，不可替换） */
--font-cn: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Noto Sans SC', sans-serif;

/* 数字/拉丁补充（金额、时间戳、百分比专用） */
--font-num: 'Geist', 'Geist Mono', monospace;
/* 加载：https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap */
/* 所有数字显示必须加：font-variant-numeric: tabular-nums */
```

### 字号体系

```css
--text-xs:   11px;  /* line-height: 1.4 — 辅助说明、法律文本 */
--text-sm:   13px;  /* line-height: 1.5 — 标签、次要信息 */
--text-base: 15px;  /* line-height: 1.7 — 正文、报告内容（主力字号）*/
--text-md:   17px;  /* line-height: 1.5 — 小标题、按钮 */
--text-lg:   20px;  /* line-height: 1.4 — 模块标题 */
--text-xl:   24px;  /* line-height: 1.3 — 页面标题 */
--text-2xl:  32px;  /* line-height: 1.2 — Hero 大字 */
--text-3xl:  40px;  /* line-height: 1.1 — 海报数字/引言 */
```

### 字重

| 用途 | font-weight |
|------|-------------|
| 正文 | 400 |
| 标签 / 按钮 | 500 |
| 标题 | 600 |
| 大字 / 金句 | 700 |

### 刻意差异点 — 汉字大字距

报告模块标题（2-6 字）使用 `letter-spacing: 0.18em`，例如：

```css
/* 报告页模块标题：核心症结、三条路径、认知升维 */
.report-section-title {
  font-size: var(--text-lg);
  font-weight: 600;
  letter-spacing: 0.18em;
  color: var(--text-gold);
}
```

**严禁**将此字距用于正文或超过 6 个汉字的文本，会导致阅读障碍。

---

## 间距体系

**基准单位：8px**，密度：comfortable（移动端优先）

```css
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;   /* 移动端页面横向 padding */
--space-6:  24px;   /* 卡片内边距 */
--space-8:  32px;   /* 模块间距 */
--space-10: 40px;   /* 大模块间距 */
--space-12: 48px;   /* Section 间距 */
--space-16: 64px;   /* 页面级大间距 */
```

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
--radius-full: 9999px;   /* 头像、pill 按钮 */
```

---

## 阴影体系

```css
--shadow-glass:    0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08);
--shadow-gold:     0 0 32px rgba(201,168,76,0.18);   /* 报告区域光晕，严格只用在报告页 */
--shadow-elevated: 0 20px 60px rgba(0,0,0,0.6);      /* 模态框 */
```

---

## 毛玻璃面板（Glass Panel）

```css
.glass-panel {
  background: var(--surface-1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-base);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-glass);
}
```

---

## 背景纹理（纸质颗粒）

在 `body` 或根容器上叠加，2% opacity。打破纯数字感，给「内观」一丝古籍质感。

```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.025;
  background-image: url("data:image/svg+xml,..."); /* SVG feTurbulence noise */
  background-size: 200px 200px;
}
```

**性能注意：** 在中低端机型（骁龙 870 以下）上线前需测试 FPS，如有掉帧立即移除。

---

## 动效体系（Framer Motion）

### 时长

```ts
const duration = {
  micro:  0.08,   // 点击反馈、hover
  short:  0.2,    // 按钮状态切换
  medium: 0.35,   // 页面淡入淡出
  long:   0.5,    // 加载动画、生成进度
}
```

### 缓动

```ts
const ease = {
  enter: 'easeOut',       // 进入：快入慢停
  exit:  'easeIn',        // 退出：慢出快消
  move:  'easeInOut',     // 移位
  spring: { type: 'spring', stiffness: 280, damping: 28 },  // 按钮弹压
}
```

### 标准动效片段

```ts
// 页面切换（每个页面根组件）
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -4, transition: { duration: 0.2, ease: 'easeIn' } },
}

// 卡片列表交错进入
const cardVariants = {
  initial: { opacity: 0, y: 12 },
  animate: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.35, ease: 'easeOut', delay: i * 0.06 }
  }),
}

// 按钮点击
const buttonTap = { scale: 0.96, transition: { type: 'spring', stiffness: 280, damping: 28 } }

// 生成中旋转
const spinVariants = {
  animate: { rotate: 360, transition: { duration: 3, ease: 'linear', repeat: Infinity } }
}
```

---

## 组件规范

### 按钮

```
主按钮（Primary）:
  background: var(--gold-grad)
  color: #1a1408（深棕，与金色形成高对比）
  border-radius: var(--radius-md)
  padding: 14px 24px
  font-size: var(--text-md)
  font-weight: 500
  tap: scale(0.96) spring

次按钮（Secondary）:
  background: transparent
  border: 1px solid var(--border-base)
  color: var(--text-primary)
  hover: border-color → var(--border-gold), color → var(--text-gold)

幽灵按钮（Ghost）:
  background: transparent
  border: none
  color: var(--text-secondary)
  用于「返回」「跳过」等低优先级操作
```

### 输入框

登录页使用**底部下划线样式**（无边框感，配合全屏暗色背景更沉浸）：

```css
.input-underline {
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--border-base);
  color: var(--text-primary);
  padding: 12px 0;
}
.input-underline:focus {
  border-bottom-color: var(--gold-base);
  box-shadow: 0 2px 0 rgba(201,168,76,0.4);
}
```

普通场景（提现申请表单等）使用**完整边框输入框**：

```css
.input {
  background: var(--surface-1);
  border: 1px solid var(--border-base);
  border-radius: var(--radius-md);
  padding: 12px 16px;
}
.input:focus {
  border-color: var(--gold-base);
  box-shadow: 0 0 0 3px rgba(201,168,76,0.12);
}
```

### 报告页模块（最重要的组件）

```css
.report-module {
  background: var(--surface-1);
  border: 1px solid var(--border-gold);    /* 金色边框 */
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-glass), var(--shadow-gold);  /* 光晕效果 */
  margin-bottom: 16px;
}
```

**严格规定：** `--shadow-gold` 只允许出现在报告展示页的内容模块上。任何其他场景滥用会破坏「报告 = 有价值」的视觉信号。

---

## 管理端规范

管理端（`/admin/*`）使用独立视觉语言，不共享应用端暗色系统：

- 组件库：Ant Design
- 背景：白色（`#fff`）
- 顶部导航：`#1a1a2e`（深色）
- 正文色：`#1a1a1a`
- 辅助色：Ant Design 默认系统色
- 优先级：功能 > 美观。管理端不需要特别设计，用 Ant Design 默认即可。
- **不**移动端适配，1280px 桌面优先。

---

## 合规文案（强制展示）

```
报告页底部（固定）：
本报告由 AI 根据您的描述生成，仅供参考，不构成专业职业、心理或法律建议。

输入页按钮下方：
AI生成内容仅供参考，不构成专业职业/心理建议

我的邀请页面：
本平台采用单级分销机制，邀请人仅对直接邀请的用户产生佣金，与多级传销无关。
```

---

## 决策日志

| 日期 | 决策 | 原因 |
|------|------|------|
| 2026-04-02 | 初始设计系统建立 | /design-consultation 基于产品文档生成 |
| 2026-04-02 | 字体选择系统默认 + Geist 数字补充 | 中文 H5 必须走系统字体，Geist 仅用于数字，加载代价极低 |
| 2026-04-02 | 汉字大字距 0.18em（仅模块标题） | 差异化：无其他 AI 工具这样做，「铭文感」强化报告价值 |
| 2026-04-02 | 报告模块金色光晕（shadow-gold） | 付费内容必须在视觉上「发光」，强化 ¥28.8 的价值感 |
| 2026-04-02 | 纸质颗粒纹理 2% opacity | 打破纯数字感，与「内观」产品名的古意契合；低端机需测试 |
| 2026-04-02 | --gold-grad 仅用于主 CTA 按钮 | 金色渐变稀缺性原则，泛用则失去强调效果 |
