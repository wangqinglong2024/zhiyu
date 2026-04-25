---
stepsCompleted: ["init","context-scan","principles","tokens","theme","layout","components","screens","game","accessibility","motion"]
inputDocuments:
  - planning/prds/01-overall/**
  - planning/prds/02-discover-china/**
  - planning/prds/03-courses/**
  - planning/prds/04-games/**
  - planning/prds/05-novels/**
  - planning/prds/06-user-account/**
  - planning/prds/07-learning-engine/**
  - planning/prds/08-economy/**
  - planning/prds/09-referral/**
  - planning/prds/10-payment/**
  - planning/prds/11-customer-service/**
  - planning/prds/12-admin/**
  - planning/prds/13-security/**
  - planning/prds/14-content-factory/**
  - planning/prds/15-i18n/**
---

# 知语 Zhiyu · UX 设计规范总目录

> **作者**：UX Agent (BMAD `bmad-create-ux-design`)
> **日期**：2026-04-25
> **依据**：`planning/prds/**` 全 15 模块 PRD
> **核心约束**（用户硬性要求）：
> 1. **透明毛玻璃** 风格全局应用
> 2. **亮 / 暗模式** 完整支持，可一键切换
> 3. **游戏强制横屏**，且同时支持 浏览器 + 手机 触控
> 4. 适用于 应用端（PWA）+ 管理后台（Web）

---

## 文件结构

| # | 文件 | 内容 | 状态 |
|:---:|---|---|:---:|
| 00 | [00-index.md](./00-index.md) | 总目录 | ✅ |
| 01 | [01-design-principles.md](./01-design-principles.md) | 设计原则、品牌气质、关键约束 | ✅ |
| 02 | [02-design-tokens.md](./02-design-tokens.md) | 色彩 / 字体 / 间距 / 圆角 / 阴影 / 动效时长 Token | ✅ |
| 03 | [03-glassmorphism-system.md](./03-glassmorphism-system.md) | 毛玻璃材质规范（厚度 / 模糊 / 边框 / 内阴影 / 性能策略） | ✅ |
| 04 | [04-theme-system.md](./04-theme-system.md) | 亮暗双模主题（CSS 变量 / 切换交互 / 用户偏好） | ✅ |
| 05 | [05-layout-and-responsive.md](./05-layout-and-responsive.md) | 响应式断点、栅格、安全区、横竖屏处理 | ✅ |
| 06 | [06-navigation-routing.md](./06-navigation-routing.md) | TabBar、面包屑、路由前缀、浮窗、模态导航 | ✅ |
| 07 | [07-components-core.md](./07-components-core.md) | 按钮 / 输入 / 表单 / 卡片 / 弹窗 / 列表 / 头像 | ✅ |
| 08 | [08-components-feedback.md](./08-components-feedback.md) | Toast / Banner / 空状态 / 骨架屏 / 加载 / 错误 | ✅ |
| 09 | [09-screens-app.md](./09-screens-app.md) | 应用端 · 全部 4 Tab + 详情屏幕规范 | ✅ |
| 10 | [10-game-ux.md](./10-game-ux.md) | 12 款游戏统一横屏 UX + HUD + 桌面键鼠 + 移动触控 | ✅ |
| 11 | [11-screens-admin.md](./11-screens-admin.md) | 管理后台全模块屏幕 | ✅ |
| 12 | [12-motion.md](./12-motion.md) | 动效与微交互（时长 / 缓动 / 过渡 / 触觉反馈） | ✅ |
| 13 | [13-accessibility.md](./13-accessibility.md) | WCAG 2.1 AA / 屏幕阅读器 / 键盘 / 色盲 | ✅ |
| 14 | [14-i18n-fonts.md](./14-i18n-fonts.md) | 4 语 i18n / 字体策略 / 货币 / 日期本地化 | ✅ |
| 15 | [15-assets-iconography.md](./15-assets-iconography.md) | Logo / 图标 / 插画 / Cover / 音频资源管理 | ✅ |
| 16 | [16-performance-quality.md](./16-performance-quality.md) | 性能预算 / PWA 离线 / 监控 / 测试 / 安全 | ✅ |

---

## 输出与下游消费

- **架构师**：阅读全部，特别是 03 / 04 / 05 / 13（决定渲染层、毛玻璃性能、横屏画布）
- **前端开发**：07 / 08 / 09 / 10 / 11 / 12 / 13 是组件实现源
- **设计师 / 视觉**：01-04 是设计语言基础
- **测试 / QA**：每屏含验收 ID，可写自动化测试

## 与 `frontend-patterns.md` 一致性
本规范与 `/memories/repo/frontend-patterns.md` (repo memory) 现有 React 19 + Vite + Tailwind 4 + Three.js + ThemeContext 实现保持完全一致，扩展定义 12 游戏画布层 + 后台模块 UX，两端复用同一 design tokens。

## 关键决策摘要（必读）

| 决策项 | 内容 |
|---|---|
| **设计语言** | 透明毛玻璃（Glassmorphism）+ 流体网格渐变（MeshGradient）+ 微粒子（Three.js） |
| **主题色** | Primary `Rose #e11d48` + Secondary `Sky #0284c7` + Tertiary `Amber #d97706`，**禁用紫色** |
| **主题切换** | 亮 / 暗 / 跟随系统 三档；切换 300ms 平滑过渡 |
| **字体** | en/vi/id `Plus Jakarta Sans`、th `Sarabun`、zh `Noto Sans SC`，按语种异步加载 |
| **响应式** | 移动优先，断点 `sm 640 / md 768 / lg 1024 / xl 1280`，PWA 在 `2xl 1536` 居中 |
| **游戏画布** | 强制 16:9 横屏，竖屏遮罩"请旋转"；桌面画布固定居中 |
| **触控** | 最小命中区 48×48 dp；游戏专属虚拟摇杆 / 4 键 / 拖拽手势 |
| **PWA** | 离线 Service Worker 缓存课程 / 文章；通知 OneSignal 备用 |
| **后台** | 同 design tokens，Sidebar + 主区两栏；密度更高（紧凑表格） |
| **i18n** | 4 语 (en/vi/th/id)，CJK 字段 `word-break: keep-all`，Vi 长词 `word-break: break-word` |
| **动画时长** | 200ms（轻交互） / 300ms（页面） / 500ms（场景） / 800ms（庆祝） |
| **动效降级** | `prefers-reduced-motion` 全部动画退化到 fade |

## 设计 → 实现交付物

- **Figma 文件**（v1.0 W-2 交付）：组件库 + 屏幕快照 + 互动原型
- **Storybook**（v1.0 W0 上线）：与 ui 包同步
- **Tailwind preset**（packages/ui/tailwind-preset.ts）：导出 design tokens
- **CSS 变量**（packages/ui/styles/theme.css）：亮暗变量声明

## 变更治理

任何 UX 变更需：
1. 提 PR 至 `planning/ux/**`
2. 设计师 + PM + 1 名前端开发会签
3. 同步更新 Figma + Storybook + Tailwind preset
4. CHANGELOG 记录

## Change Log

| 日期 | 版本 | 作者 | 变更 |
|---|---|---|---|
| 2026-04-25 | v1.0 | UX Agent | 初版完整 UX 规范（16 文件） |
