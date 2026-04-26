# ZY-04-05 · i18n Lint + RTL 就绪检查

> Epic：E04 · 估算：S · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 团队
**I want** 自动检测硬编码文案与 RTL 布局问题
**So that** 不会有"Hello"漏在代码里、不会有阿语下错位的图标。

## 上下文
- ESLint 插件 `eslint-plugin-i18next` + 自定义规则禁止 JSX 字面量字符串（中英文）。
- RTL 检查：所有 padding / margin 必须用 logical properties（`ps-`, `pe-`, `ms-`, `me-`），CI 跑 stylelint 拒 `pl-/pr-/ml-/mr-`（提供 codemod 一次性迁移）。
- husky 提交时执行。

## Acceptance Criteria
- [ ] ESLint 规则启用，CI 即 pre-commit 阻止硬编码
- [ ] stylelint 规则：仅允许逻辑属性
- [ ] 4 语 × 关键页面 MCP Puppeteer 截图归档至 `planning/qa-reports/i18n-screenshots/`
- [ ] 翻译键覆盖率脚本：找出 en 有但 ar 缺失的 key 列表

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-fe pnpm lint
docker compose exec zhiyu-app-fe pnpm i18n:coverage
```

## DoD
- [ ] lint 全绿
- [ ] 4 语截图归档

## 不做
- 翻译记忆库（TM）

## 依赖
- 上游：ZY-04-01..04
