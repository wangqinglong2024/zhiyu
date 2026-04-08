# UI/UX 设计规范 (UI/UX Design Standards)

> **版本**: v1.0 | **最后更新**: 2025-07-16
>
> **适用范围**：所有基于本规范体系的项目。覆盖视觉设计、交互设计、动效设计、响应式策略、无障碍、设计交付。
> **目标水准**：对标 Apple HIG + Google Material Design 3 + Linear/Stripe/Vercel 级别的顶尖设计品质。
> **与其他文件的关系**：
> - `rules.md` §一 定义了 Cosmic Refraction 设计系统的**技术实现参数**（CSS 变量、动画帧）
> - `product-design.md` 定义了**原型工作流**（Stitch MCP 操作、PRD 审查）
> - **本文件**定义**设计哲学、视觉语言、交互范式、品质标杆**——是设计决策的"宪法"

---

## 一、设计哲学 (Design Philosophy)

### 1. 核心信条

> **"Less, but better." — Dieter Rams**

| 信条 | 解释 | 落地检验方式 |
|------|------|------------|
| **极简克制** | 每个像素都有理由存在，删到不能再删为止 | 遮住任一元素——如果页面功能不受影响，就该删 |
| **通透呼吸** | 界面如同"被光线穿透的水晶"，层次通过透明度和模糊区分，非实色块堆砌 | 截图后降低到 10% 亮度——能看到背景透过来 |
| **情感共鸣** | 每个页面有明确的情绪目标，通过色彩温度、留白、动效节奏传达 | 能用一个形容词概括页面给人的感觉 |
| **物理隐喻** | UI 元素模拟真实世界的物理行为——重力、惯性、弹性、光影 | 动效能让人联想到一种真实材质 |
| **即时反馈** | 用户的每个操作在 100ms 内获得视觉响应 | 录屏逐帧检验操作延迟 |

### 2. 设计人格 (Design Persona)

本设计系统的"人格"是：

> **冷静而温暖、高级而亲切、科技感与人文感并存**

如同深夜东京的高层落地窗：城市灯火辉煌（Rose/Sky/Amber 光斑），透过一层磨砂玻璃（毛玻璃面板），远处朦胧而近处清晰，静谧中隐含微妙呼吸（粒子与网格漂移）。

### 3. 与竞品的设计定位

| 产品 | 设计风格 | 我们的差异 |
|------|---------|----------|
| Apple | 极简留白 + 系统字体 + 高对比 | 我们用**毛玻璃材质**增加光学深度和科技感 |
| Linear | 深色极简 + 无装饰 + 键盘优先 | 我们用**渐变网格 + 粒子动效**增加情感温度 |
| Stripe | 明亮渐变 + 精致排版 + 信任感 | 我们用**暗色基调 + 玻璃折射**打造沉浸感 |
| Vercel | 黑白极端 + 代码美学 + 快感 | 我们用 **Rose/Sky/Amber 三色**突破黑白单调 |

---

## 二、视觉设计体系 (Visual Design System)

### 1. 色彩体系 (Color System)

#### 核心色板

| 角色 | 色值 (Dark) | 色值 (Light) | 使用场景 | 情绪含义 |
|------|-----------|-------------|---------|---------|
| **Rose 暖玫瑰** | `#e11d48` | `#fda4af` | 主行动点 (CTA)、强调色、通知 | 热情、紧迫、活力 |
| **Sky 冷天蓝** | `#0284c7` | `#7dd3fc` | 次要操作、链接、信息提示 | 信任、冷静、专业 |
| **Amber 琥珀金** | `#d97706` | `#fde68a` | 标签、徽章、高亮、奖励 | 价值、稀缺、愉悦 |

#### 色彩规则铁律

- 🚫 **严禁使用紫色**（Purple/Violet/Lavender），包括任何接近紫色的蓝红混合色
- ✅ 三色通过**不透明度衰减**获得层次：100% → 80% → 60% → 40% → 20% → 10%
- ✅ 中性色使用纯灰度（不带色相倾向的灰）：`#fafafa` → `#a3a3a3` → `#404040` → `#171717` → `#0e0e0e`
- ✅ 语义色固定不变：成功 `#22c55e`、警告 `#f59e0b`、错误 `#ef4444`、信息 `#3b82f6`
- ✅ 大面积用色控制：一个页面的"有颜色区域"（非中性色）不超过总面积的 15%——色彩因稀缺而珍贵

#### 色彩搭配原则

```
主色调（Rose）：占比 60% 的有色区域 → CTA、选中态、核心导航
辅色调（Sky）：占比 30% → 链接、辅助按钮、hover 态
点缀色（Amber）：占比 10% → 标签、徽章、惊喜元素（如积分、成就）
```

### 2. 字体体系 (Typography)

#### 字体选择

| 用途 | 字体 | 回退 | 理由 |
|------|------|------|------|
| 标题/品牌 | **Manrope** | `system-ui, sans-serif` | Geometric Sans，几何精确 + 现代感 + 极好的数字表现 |
| 正文/UI | **Inter** | `system-ui, sans-serif` | 为屏幕阅读而生，极致可辨识度，x-height 大 |
| 代码 | **JetBrains Mono** | `monospace` | 0/O、1/l/I 区分度最佳 |

#### 字体层级 (Type Scale)

采用 **1.250 (Major Third)** 比例尺度，基准 16px：

| 级别 | 用途 | 大小 | 行高 | 字重 | 字间距 |
|------|------|------|------|------|--------|
| Display | 着陆页英雄标题 | 48px / 3rem | 1.1 | 800 | -0.02em |
| H1 | 页面主标题 | 32px / 2rem | 1.2 | 700 | -0.015em |
| H2 | 区块标题 | 24px / 1.5rem | 1.3 | 700 | -0.01em |
| H3 | 卡片标题 | 20px / 1.25rem | 1.4 | 600 | 0 |
| Body L | 长文本/文章 | 18px / 1.125rem | 1.7 | 400 | 0 |
| Body | 正文默认 | 16px / 1rem | 1.6 | 400 | 0 |
| Body S | 辅助说明 | 14px / 0.875rem | 1.5 | 400 | 0.005em |
| Caption | 标签/时间戳 | 12px / 0.75rem | 1.5 | 500 | 0.02em |
| Overline | 分类/标签头 | 11px / 0.6875rem | 1.4 | 600 | 0.08em |

#### 排版铁律

- **标题紧凑、正文宽松**：标题行高 1.1~1.3（紧凑有力），正文行高 1.5~1.7（舒适阅读）
- **负字间距提升标题品质**：≥24px 的标题必须用负字间距（-0.01em ~ -0.02em）
- **中英混排**：中文正文使用 `"Inter", "PingFang SC", "Noto Sans CJK SC", sans-serif`
- **数字等宽**：金额、统计数字使用 `font-variant-numeric: tabular-nums`，确保对齐
- **文本截断**：单行截断用 `text-overflow: ellipsis`；多行截断用 `-webkit-line-clamp`

### 3. 间距系统 (Spacing)

采用 **4px 基础网格** + **8px 递进**系统：

| Token | 值 | 使用场景 |
|-------|-----|---------|
| `--space-0` | 0 | — |
| `--space-1` | 4px | 图标与文字的微间距 |
| `--space-2` | 8px | 紧凑表单元素间距 |
| `--space-3` | 12px | 列表项内部 padding |
| `--space-4` | 16px | 卡片内部 padding、表单字段间距 |
| `--space-5` | 20px | 区块标题与内容的间距 |
| `--space-6` | 24px | 卡片间距（普通） |
| `--space-8` | 32px | 页面区块间距 |
| `--space-10` | 40px | 大区块分隔 |
| `--space-12` | 48px | 页面顶部留白 |
| `--space-16` | 64px | 着陆页区块间距 |
| `--space-20` | 80px | 页面底部安全区 |

#### 间距铁律

- **8 的倍数**：所有外边距和 padding 必须是 8 的倍数（4px 仅限微调）
- **呼吸感**：移动端卡片间距 ≥ 16px，桌面端 ≥ 24px
- **安全区**：底部 Tab Bar 上方必须留 ≥ 80px 空白，防遮挡

### 4. 圆角系统 (Border Radius)

| Token | 值 | 使用场景 |
|-------|-----|---------|
| `--radius-sm` | 8px | 标签、徽章、小按钮 |
| `--radius-md` | 12px | 输入框、下拉菜单 |
| `--radius-lg` | 16px | Toast、弹窗 |
| `--radius-xl` | 20px | 聊天气泡 |
| `--radius-2xl` | 24px | 卡片（.glass-card） |
| `--radius-3xl` | 32px | 底部弹出面板 (Bottom Sheet) |
| `--radius-full` | 9999px | 按钮（药丸形）、头像 |

#### 圆角嵌套规则

内外层圆角需满足视觉和谐公式：

```
内层圆角 = 外层圆角 - 外层 padding
```

示例：卡片 `rounded-3xl (24px)` + `padding 16px` → 内部按钮 `rounded-lg (8px)` ✅

### 5. 阴影系统 (Elevation & Shadow)

采用**弥散式阴影**（非锐利投影），模拟自然光环境散射：

| 层级 | Light 模式 | Dark 模式 | 使用场景 |
|------|-----------|-----------|---------|
| **Level 0** | 无阴影 | 无阴影 | 内嵌/平面元素 |
| **Level 1** | `0 1px 3px rgba(0,0,0,0.04)` | `0 1px 3px rgba(0,0,0,0.3)` | 卡片默认态 |
| **Level 2** | `0 4px 12px rgba(0,0,0,0.06)` | `0 4px 12px rgba(0,0,0,0.5)` | 卡片 Hover 态 |
| **Level 3** | `0 8px 24px rgba(0,0,0,0.08)` | `0 8px 24px rgba(0,0,0,0.6)` | 弹窗、浮层 |
| **Level 4** | `0 16px 48px rgba(0,0,0,0.12)` | `0 16px 48px rgba(0,0,0,0.7)` | 模态对话框 |

**阴影铁律**：
- 暗色模式阴影浓度必须更高（因为背景本身就暗）
- 毛玻璃面板的阴影额外叠加 `inset 0 1px 0 rgba(255,255,255, var(--glass-inset-opacity))` 内高光
- 禁止使用纯黑投影 `rgba(0,0,0,1)`——自然界不存在绝对黑的影子

### 6. 图标系统 (Iconography)

| 属性 | 规范 |
|------|------|
| **图标库** | Lucide Icons（统一风格：Stroke 1.5px，24×24 视口） |
| **尺寸** | 16px（紧凑/标签内）/ 20px（按钮内）/ 24px（独立操作）/ 32px（空状态引导） |
| **颜色** | 继承当前文字颜色 (`currentColor`)，不单独指定 |
| **状态** | 选中态可切换为 `fill` 版本（如心形图标点赞后变实心） |
| **新增图标** | 禁止混用多个图标库，所有图标必须来自 Lucide |

---

## 三、交互设计范式 (Interaction Patterns)

### 1. 导航体系

#### 移动端导航层级

```
第 1 层：底部 Tab Bar（3~5 个核心入口，常驻）
第 2 层：二级页面（从 Tab 内容点入，顶部导航栏含返回按钮）
第 3 层：弹出层（Bottom Sheet / 全屏 Modal，浮于页面上方）
```

- Tab Bar 固定底部，高度 56px + 底部安全区（iOS `env(safe-area-inset-bottom)`）
- 当前选中 Tab 图标变为 Rose 色填充态 + Label 变 Rose 色
- 页面滚动时 Tab Bar 不隐藏（核心导航永远可达）

#### 桌面端导航

```
顶部：全局导航栏（Logo + 核心入口 + 用户头像/搜索）
左侧：功能侧边栏（当前模块的子导航，可折叠）
内容区：自适应宽度，最大 1280px 居中
```

### 2. 页面状态矩阵（每个页面必须覆盖 7 种状态）

| 状态 | 设计要求 | 参考水准 |
|------|---------|---------|
| **空状态 (Empty)** | 品牌插画 + 引导文案 + CTA 按钮 + 3~4个 `.glass-decor` 浮动方块 | Linear 空状态 |
| **加载中 (Loading)** | Skeleton 骨架屏（形状匹配最终内容），禁止纯 Spinner | Facebook/YouTube 骨架屏 |
| **首次加载 (First Load)** | 全屏骨架屏 + 品牌 Logo 呼吸动画 | Vercel 首屏加载 |
| **成功 (Success)** | 轻量 Toast（2s 自动消失）或页面内成功插画 | Stripe 支付成功 |
| **错误 (Error)** | "说人话"的错误描述 + 可执行的解决方案 + 重试按钮 | Figma 错误页 |
| **部分加载 (Partial)** | 列表底部加载更多指示器 + Pull-to-Refresh | Twitter/Instagram 无限滚动 |
| **离线 (Offline)** | 顶部 Banner 提示网络状态 + 缓存数据可浏览 | Google Docs 离线提示 |

### 3. 手势与触控交互

| 手势 | 操作 | 实现要求 |
|------|------|---------|
| **Tap** | 核心操作 | 点击区域 ≥ 44×44pt，`active` 态缩小 `scale(0.97)` |
| **Long Press** | 辅助操作弹出 | 400ms 触发，Haptic 反馈（支持时） |
| **Swipe Left** | 列表项操作（删除/归档） | 露出操作按钮 + 红色背景预览 |
| **Swipe Right** | 返回上一页 | iOS 原生手势，不自定义覆盖 |
| **Pull Down** | 刷新当前页 | 下拉 > 60px 触发，自定义 Loading 动画 |
| **Pinch** | 缩放（图片/地图） | 仅对媒体内容启用 |

铁律：
- **拇指热区**：核心操作（CTA、提交、发送）放在屏幕下部 2/3 区域
- **禁止隐藏手势**：所有手势操作必须有对应的可视化按钮作为替代入口
- **误触防护**：破坏性操作（删除/支付）需二次确认，不可通过单次手势完成

### 4. 表单设计

#### 输入框规范

| 属性 | 普通表单 | 聊天输入区 |
|------|---------|----------|
| 圆角 | `rounded-full` (药丸形) | `rounded-xl` |
| 外壳 | `.glass-input` (毛玻璃) | 包在 `.glass-elevated` 面板中 |
| Focus | 弥散光晕 `box-shadow: 0 0 0 4px var(--input-focus-glow)` | 同左 |
| 标签 | 浮动标签 (Float Label) 或顶部标签 | 无标签（Placeholder 提示） |
| 校验 | 实时校验 + 红色边框 + 行内错误信息 | — |

- **禁止浏览器默认 focus ring**：只允许弥散光晕 (glow)
- **必须有清除按钮**：输入内容后右侧出现 × 清除按钮
- **Autocomplete**：email/phone/name 类型字段启用浏览器自动填充

#### 表单体验铁律

1. **即时校验**：输入完成（blur）后立即校验，不等到提交
2. **错误定位**：提交失败时自动滚动到第一个错误字段并 focus
3. **禁止清空**：表单提交失败后，已填内容必须保留
4. **加载态**：提交按钮变为 Loading + Disabled，防重复提交
5. **成功反馈**：提交成功 → Toast 通知 + 适当重定向/清空

### 5. 反馈系统

| 类型 | 组件 | 时机 | 持续时间 |
|------|------|------|---------|
| **操作成功** | Toast (绿色) | 操作完成后 | 2s 自动消失 |
| **操作失败** | Toast (红色) | 操作失败后 | 需手动关闭 |
| **信息提示** | Toast (蓝色) | 系统通知 | 3s 自动消失 |
| **确认操作** | 模态对话框 | 破坏性操作前 | 用户手动选择 |
| **进度反馈** | 进度条/环 | 上传、下载、处理中 | 任务完成后消失 |
| **网络状态** | 顶部 Banner | 网络变化时 | 恢复后自动消失 |

Toast 规范：
- 位置：顶部居中（距顶 16px），禁止底部弹出（会被 Tab Bar 遮挡）
- 动画：从上方滑入 `translateY(-100%) → translateY(0)`，300ms ease-out
- 堆叠：多个 Toast 垂直堆叠，间距 8px，最多同时显示 3 个

---

## 四、动效设计 (Motion Design)

### 1. 动效三原则

| 原则 | 解释 | 反例 |
|------|------|------|
| **有意义** | 每个动效必须传递信息（方向、层级、状态变化） | 纯装饰性的花哨弹跳 |
| **尊重时间** | 不让用户等待动效完成才能操作 | 强制观看 2s 的入场动画 |
| **物理一致** | 遵循同一套缓动曲线和时间参数 | 有的弹跳、有的线性、有的回弹 |

### 2. 缓动曲线标准

| 名称 | CSS 值 | 使用场景 |
|------|--------|---------|
| **Standard** | `cubic-bezier(0.2, 0, 0, 1)` | 通用过渡（默认选这个） |
| **Decelerate** | `cubic-bezier(0, 0, 0, 1)` | 元素进入视口（从外到内） |
| **Accelerate** | `cubic-bezier(0.3, 0, 1, 1)` | 元素离开视口（从内到外） |
| **Spring** | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 弹性反馈（按钮点击、状态切换） |

### 3. 时间参数规范

| 类型 | 时长 | 使用场景 |
|------|------|---------|
| **Micro** | 100~150ms | 按钮状态变化、hover、颜色切换 |
| **Short** | 200~300ms | 组件展开/折叠、Toast 滑入 |
| **Medium** | 300~500ms | 页面过渡、模态弹出 |
| **Long** | 500~800ms | 全屏切换、复杂编排动效 |
| **Ambient** | 20~25s | 背景渐变网格漂移、呼吸动效 |

**铁律**：
- 所有可交互元素必须有 `transition-all duration-300 ease-out`
- Hover 状态必须包含 `translateY(-1px)` 微悬浮
- Active/按压状态：`scale(0.97)` + 100ms
- Disabled 状态：`opacity-0.45` + `cursor-not-allowed`，无任何过渡动效

### 4. 页面转场

| 转场类型 | 效果 | 使用场景 |
|---------|------|---------|
| **Push** | 新页面从右侧推入 | 列表 → 详情（向前导航） |
| **Pop** | 当前页面向右滑出 | 详情 → 列表（返回导航） |
| **Fade** | 交叉淡入淡出 | Tab 切换、同级页面切换 |
| **Slide Up** | 从底部上滑 | Bottom Sheet、全屏弹窗 |
| **Stagger** | 列表元素依次渐入 | 首屏内容加载完成后 |

Stagger 动画参数：
```css
/* 列表项依次渐入（每项延迟 50ms） */
.stagger-item {
  opacity: 0;
  transform: translateY(8px);
  animation: stagger-in 400ms cubic-bezier(0.2, 0, 0, 1) forwards;
}
.stagger-item:nth-child(1) { animation-delay: 0ms; }
.stagger-item:nth-child(2) { animation-delay: 50ms; }
.stagger-item:nth-child(3) { animation-delay: 100ms; }
/* ... 最多 10 项，之后统一 500ms */
```

### 5. 无障碍动效

**强制要求**：所有动效必须尊重 `prefers-reduced-motion`：

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 五、响应式设计 (Responsive Design)

### 1. 断点系统

| 断点名 | 宽度 | 设备 | 列数 |
|--------|------|------|------|
| `xs` | < 640px | 手机竖屏 | 1 列 |
| `sm` | ≥ 640px | 手机横屏/小平板 | 2 列 |
| `md` | ≥ 768px | 平板竖屏 | 2~3 列 |
| `lg` | ≥ 1024px | 平板横屏/小笔记本 | 3~4 列 |
| `xl` | ≥ 1280px | 桌面 | 4 列 |
| `2xl` | ≥ 1536px | 大屏桌面 | 内容最大宽度 1280px 居中 |

### 2. Mobile-First 铁律

- 默认样式 = 手机样式，所有 `md:` / `lg:` / `xl:` 向上扩展
- 手机端先设计、先开发、先测试
- 移动端是**第一等公民**，桌面端是移动端的"放大版"

### 3. 布局适配策略

| 布局元素 | 手机 (xs) | 平板 (md) | 桌面 (xl) |
|---------|----------|----------|----------|
| 导航 | 底部 Tab Bar | 底部 Tab Bar | 顶部导航 + 侧边栏 |
| 卡片网格 | 单列 | 双列 | 三列/四列 |
| 内容宽度 | 100% - 32px padding | 100% - 48px padding | 最大 1280px 居中 |
| 对话框 | 全屏 Bottom Sheet | 居中悬浮卡片 (480px) | 居中悬浮卡片 (480px) |
| 表格 | 卡片列表（表格变卡片） | 横向滚动表格 | 完整表格 |
| 侧边栏 | 隐藏（汉堡菜单触发） | 折叠图标模式 | 展开完整 |

### 4. 触控 vs 指针适配

```css
/* 触控设备：增大点击区域 */
@media (pointer: coarse) {
  .interactive-element {
    min-height: 44px;
    min-width: 44px;
    padding: 12px;
  }
}

/* 精确指针（鼠标）：可以稍微紧凑 */
@media (pointer: fine) {
  .interactive-element {
    min-height: 32px;
    padding: 8px;
  }
}
```

---

## 六、无障碍设计 (Accessibility)

> **目标等级：WCAG 2.1 AA 合规**

### 1. 色彩对比度

| 元素 | 最低对比度 | 工具 |
|------|----------|------|
| 普通正文 (< 18px) | **4.5:1** | Chrome DevTools / Lighthouse |
| 大标题 (≥ 18px 或 14px Bold) | **3:1** | |
| 图标/图形 | **3:1** | |
| 占位符文本 | **3:1**（禁止 < 2:1 的浅灰色占位符） | |

**毛玻璃特殊处理**：
- 由于毛玻璃背景不确定性，文字必须有 `text-shadow` 或半透明底色兜底
- 关键信息（金额、状态）不依赖背景色区分——必须有文字/图标明确表达

### 2. 语义化 HTML

```
✅ 必须使用语义标签：
<header>、<nav>、<main>、<section>、<article>、<aside>、<footer>

✅ 装饰性元素：
aria-hidden="true"（渐变网格 blob、粒子背景、浮动玻璃方块）

✅ 交互元素：
<button> 用于操作（非 <div onClick>）
<a> 用于导航（非 <span onClick>）
所有 <img> 必须有 alt 属性（装饰性图片 alt=""）

✅ 表单：
<label> 关联 <input>（for + id）
错误信息用 aria-describedby 关联到对应输入框
必填字段用 aria-required="true"
```

### 3. 键盘导航

- 所有核心操作可通过 **Tab + Enter / Space** 完成
- 焦点顺序必须与视觉顺序一致
- 弹窗打开时焦点圈定在弹窗内（Focus Trap）
- 弹窗关闭后焦点回到触发元素
- 自定义组件（如下拉菜单、Tab 切换）必须实现完整 ARIA 角色

### 4. 屏幕阅读器

- 动态内容变化（Toast、计数更新）使用 `aria-live="polite"`
- 加载态使用 `aria-busy="true"` + `role="status"`
- 图标按钮必须有 `aria-label`（如 `<button aria-label="关闭弹窗">×</button>`）

---

## 七、设计到代码的交付规范 (Design-to-Code Handoff)

### 1. 设计 Token 与 CSS 变量映射

所有设计参数通过 CSS 自定义属性传递，禁止在组件中硬编码：

```css
:root {
  /* 色彩 */
  --color-primary: #e11d48;
  --color-secondary: #0284c7;
  --color-tertiary: #d97706;
  --color-surface: #ffffff;
  --color-on-surface: #171717;

  /* 毛玻璃 */
  --glass-bg: rgba(255, 255, 255, 0.25);
  --glass-blur: 24px;
  --glass-saturate: 1.8;
  --glass-border: rgba(255, 255, 255, 0.45);
  --glass-inset: rgba(255, 255, 255, 0.5);

  /* 间距 */
  --space-unit: 4px;

  /* 圆角 */
  --radius-card: 24px;
  --radius-button: 9999px;
  --radius-input: 9999px;

  /* 动效 */
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --duration-micro: 150ms;
  --duration-short: 300ms;
}

.dark {
  --color-surface: #0e0e0e;
  --color-on-surface: #fafafa;
  --glass-bg: rgba(255, 255, 255, 0.07);
  --glass-border: rgba(255, 255, 255, 0.12);
  --glass-inset: rgba(255, 255, 255, 0.08);
}
```

### 2. 命名规范

设计 Token 命名遵循：`--{类别}-{属性}-{变体}`

```
--color-primary       （色彩/主色）
--color-primary-light （色彩/主色/浅色变体）
--glass-blur          （毛玻璃/模糊值）
--space-4             （间距/4号）
--radius-card         （圆角/卡片）
--duration-short      （时长/短）
```

### 3. 组件库与设计系统同步

```
Stitch 设计系统 (Cosmic Refraction)
        │
        ├─→ rules.md §一（技术参数文档）
        │
        ├─→ 前端 CSS 变量 (@theme + :root)
        │
        └─→ 前端组件库 (components/ui/*)
```

**三方一致性铁律**：设计系统、规范文档、前端代码的参数值在任何时刻必须完全一致。

---

## 八、设计质量审查清单 (Design QA Checklist)

> 每个页面上线前必须通过此清单。

### 视觉品质
- [ ] 色彩体系正确（Rose/Sky/Amber，无紫色）
- [ ] 字体正确（Manrope 标题 + Inter 正文）
- [ ] 间距严格遵循 8px 网格
- [ ] 圆角体系一致（按钮 full、卡片 3xl、输入框 full）
- [ ] 毛玻璃效果正常（blur + saturate + 透明边框 + 内高光）
- [ ] Light/Dark 模式均正常且参数正确
- [ ] 无孤立色块（每个颜色都在色板之内）

### 交互品质
- [ ] 所有按钮有 hover/active/disabled 三态
- [ ] hover 有微悬浮 `translateY(-1px)` 动效
- [ ] 所有过渡动画使用标准缓动曲线和时间参数
- [ ] 表单即时校验 + 错误定位 + 内容保留
- [ ] 所有破坏性操作有二次确认
- [ ] Toast 从顶部滑入、自动消失、可堆叠

### 响应式
- [ ] 手机 (375px) 显示正常
- [ ] 平板 (768px) 显示正常
- [ ] 桌面 (1280px) 显示正常
- [ ] 超宽屏 (1920px) 内容不拉伸、居中显示

### 无障碍
- [ ] 色彩对比度 ≥ 4.5:1（正文）/ 3:1（大标题）
- [ ] 可键盘完整操作（Tab + Enter）
- [ ] 装饰元素 `aria-hidden="true"`
- [ ] 图片有 `alt`、图标按钮有 `aria-label`
- [ ] `prefers-reduced-motion` 生效

### 性能
- [ ] 移动端毛玻璃嵌套 ≤ 2 层
- [ ] Three.js 粒子移动端 ≤ 50 个
- [ ] 首屏无大图阻塞（图片 lazy loading）
- [ ] CSS 动画使用 `transform`/`opacity`（GPU 加速属性）

---

## 九、设计灵感与参考库 (Design References)

> AI 和设计者在做设计决策时，应参考以下产品的设计水准。

| 参考产品 | 学习要点 | 链接 |
|---------|---------|------|
| **Linear** | 极致的暗色系简洁设计、键盘交互、微动效 | linear.app |
| **Stripe** | 文档排版、渐变运用、清晰的信息层级 | stripe.com |
| **Vercel** | 黑白极端、代码美学、部署流程可视化 | vercel.com |
| **Raycast** | 毛玻璃运用、命令面板交互模式 | raycast.com |
| **Arc Browser** | 空间管理、色彩运用、侧边栏交互 | arc.net |
| **Apple HIG** | 无障碍、触控标准、一致性原则 | developer.apple.com/design |
| **Material 3** | 设计 Token 体系、动态色彩、表达式组件 | m3.material.io |
| **Tailwind UI** | 组件结构、响应式模式、实用主义美学 | tailwindui.com |
