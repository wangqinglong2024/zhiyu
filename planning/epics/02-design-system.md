# Epic E02 · 设计系统与 UI 工具库（Design System）

> 阶段：M0 · 优先级：P0 · 估算：4 周

## 摘要
落地 UX 16 文件中的设计令牌、玻璃态系统、主题、可复用组件，作为所有界面的基石。

## 价值
3 端（app/admin/marketing）UI 一致；新页面开发时间减半。

## 范围
- packages/ui（shadcn/ui 二次封装）
- packages/tokens（design tokens）
- packages/theme（亮 / 暗 / 主题切换）
- Storybook 全组件展示
- 国际化字体 + 排版

## 非范围
- 具体业务页面
- 游戏 UI（在 E09）

## Stories

### ZY-02-01 · Design Tokens 包
**AC**
- [ ] colors / spacing / radius / shadow / motion / type
- [ ] 输出 CSS 变量 + TS 常量 + Tailwind preset
- [ ] 亮 / 暗 双套
**Tech**：ux/02-design-tokens.md
**估**: M

### ZY-02-02 · Tailwind v4 配置
**AC**
- [ ] tailwind.config 引用 tokens
- [ ] Cosmic Refraction 调色板（无紫色）
- [ ] Container queries 启用
- [ ] PurgeCSS 配置
**Tech**：ux/02
**估**: S

### ZY-02-03 · 玻璃态 CSS 系统
**AC**
- [ ] `.glass` `.glass-strong` `.glass-soft` utility
- [ ] backdrop-filter + 浏览器降级
- [ ] 性能预算（最多 3 层叠加）
**Tech**：ux/03-glassmorphism-system.md
**估**: M

### ZY-02-04 · 主题切换（亮 / 暗 / 系统）
**AC**
- [ ] ThemeProvider + useTheme hook
- [ ] 持久化 localStorage
- [ ] 跟随系统切换
- [ ] 切换无闪烁（FOUC 处理）
**Tech**：ux/04-theme-system.md
**估**: M

### ZY-02-05 · 字体子集 + 排版
**AC**
- [ ] Inter (拉丁) + LXGW (中文) + Noto Sans (越泰印)
- [ ] 动态子集化
- [ ] CSS @font-face + preload
- [ ] type scale 应用
**Tech**：ux/14-i18n-typography.md
**估**: M

### ZY-02-06 · 核心组件（Button/Input/Card/Modal/Toast/Drawer）
**AC**
- [ ] 12 基础组件
- [ ] shadcn/ui 二次封装 + 玻璃态
- [ ] 全部 Storybook
- [ ] 可访问性 ≥ AA
**Tech**：ux/07-components-core.md
**估**: L

### ZY-02-07 · 反馈组件（Skeleton/Empty/Error/Loading）
**AC**
- [ ] 8 反馈组件
- [ ] 情绪化插画
- [ ] 全部 Storybook
**Tech**：ux/08-components-feedback.md
**估**: M

### ZY-02-08 · 布局组件（Container/Grid/Stack/Splitter）
**AC**
- [ ] 容器 query 响应
- [ ] 移动 / 平板 / 桌面三档
**Tech**：ux/05-layout-and-responsive.md
**估**: S

### ZY-02-09 · 微交互库
**AC**
- [ ] 按钮按压 / hover 光晕
- [ ] 列表入场动画
- [ ] 减弱动画偏好支持
**Tech**：ux/16-microinteractions.md
**估**: M

### ZY-02-10 · Storybook + 视觉回归
**AC**
- [ ] 全组件 stories
- [ ] Chromatic / Loki 视觉回归
- [ ] CI 集成
- [ ] storybook.zhiyu.io 自动部署
**估**: M

## 风险
- backdrop-filter 在低端 Android 性能差 → 检测 + 降级
- 字体 CJK 体积大 → 子集化必做

## DoD
- [ ] Storybook 全绿
- [ ] 视觉回归基线建立
- [ ] 3 端能复用
- [ ] AA 通过 axe 检查
