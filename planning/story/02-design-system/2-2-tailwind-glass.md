# ZY-02-02 · Tailwind v4 + Glassmorphism 基础

> Epic：E02 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 前端工程师
**I want** 在所有 FE 应用统一接入 Tailwind v4 + 一组玻璃拟态（glass）工具类
**So that** 我能用语义化 class 直接写出符合 Cosmic Refraction 视觉的卡片 / 面板 / 弹窗。

## 上下文
- Tailwind v4 用 `@theme` + `@plugin` 配置；preset 由 `@zhiyu/tokens` 提供。
- glass 工具类：`.glass`, `.glass-strong`, `.glass-subtle`, `.glass-on-image`，本质是 `backdrop-filter: blur()` + 半透明背景 + 边框高光。
- 物理路径：每个 FE app（`system/apps/web`、`system/apps/admin`）各自 `tailwind.config.ts` import preset；全局样式集中到 `system/packages/ui/src/styles/global.css`。

## Acceptance Criteria
- [ ] `system/apps/web` / `system/apps/admin` 各自接 Tailwind v4 + preset
- [ ] 提供 `.glass-*` 4 个变体；自动适配亮 / 暗主题
- [ ] 自动注入 `@layer base` 重置（border-box / 字体平滑 / 选区色）
- [ ] PostCSS 流水线：tailwindcss + autoprefixer，无 cssnano（dev 单一环境）
- [ ] 文档：在 packages/ui 内附 `STYLES.md`，列出所有工具类与示例

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-fe pnpm --filter @zhiyu/web build
docker compose exec zhiyu-app-fe pnpm --filter @zhiyu/web exec vitest run styles
```
- MCP Puppeteer：访问 `http://115.159.109.23:3100/__styleguide`（临时路由），截图 4 个 glass 变体在亮暗双主题下

## DoD
- [ ] build 体积报告附 PR（首屏 css ≤ 35 KB gz）
- [ ] glass 在 Safari iOS / Chrome Android 下不出现毛刺（手测）
- [ ] 不引入 daisyUI / shadcn 以外的 UI 库

## 不做
- 主题切换交互（属 ZY-02-03）
- 字体（属 ZY-02-04）
- 组件实现（属 ZY-02-05 / 06）

## 依赖
- 上游：ZY-02-01
- 下游：ZY-02-05 / ZY-05-01（app shell）
