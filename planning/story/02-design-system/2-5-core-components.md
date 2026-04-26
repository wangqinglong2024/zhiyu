# ZY-02-05 · 核心组件（Button / Input / Card / Modal / ...）

> Epic：E02 · 估算：L · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 前端开发者
**I want** 一组与 Cosmic Refraction 视觉一致的核心 UI 组件
**So that** 业务页面只组合不重复造轮子，确保跨页一致性。

## 上下文
- 物理路径：`system/packages/ui/src/components/`
- 基于 shadcn/ui（Radix Primitives）二开；颜色与圆角全走 tokens；不引入 MUI / Ant Design。
- 必须支持键盘 + 屏幕阅读器（ARIA），WCAG AA。
- 国际化：组件不内置文案，全部通过 props（避免与 i18n 耦合）。

## Acceptance Criteria
- [ ] 组件清单：`Button` (variants: primary/secondary/ghost/danger; sizes: sm/md/lg)、`IconButton`、`Input` / `Textarea` / `Select` / `Combobox`、`Switch` / `Checkbox` / `Radio`、`Card` (variants: glass/flat)、`Modal` / `Dialog` / `Drawer`、`Tabs`、`Tooltip`、`Popover`、`DropdownMenu`、`Avatar`、`Badge`、`Tag`、`Divider`、`Skeleton`
- [ ] 每个组件附 README + 示例 + 类型完整 + 可控/非受控双模式
- [ ] 全部支持 forwardRef、`asChild` 模式（Radix）
- [ ] 暗色 / 亮色双主题视觉验收
- [ ] 单元覆盖率 ≥ 70%（vitest + testing-library）

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-fe pnpm --filter @zhiyu/ui test
docker compose exec zhiyu-app-fe pnpm --filter @zhiyu/ui build
```
- MCP Puppeteer：在 Storybook（接 ZY-02-07）逐组件截图比对

## DoD
- [ ] 组件清单完成
- [ ] a11y 自检（jest-axe）无 violations
- [ ] tree-shaking 验证：单 import Button 后产物 < 8 KB

## 不做
- 反馈型 / 布局型组件（属 ZY-02-06）
- 页面级模版（属 ZY-05）

## 依赖
- 上游：ZY-02-01 / 02 / 04
- 下游：ZY-05 / ZY-08 / ZY-17
