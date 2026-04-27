# AD-18 · 实现后台 UX 壳与导航

## PRD 原文引用

- `planning/ux/11-screens-admin.md`：“后台是运营和内容团队的工作台：密度优先、审计优先、批量操作优先。”
- `planning/ux/02-design-tokens.md` 定义“松烟雅瓷”token，后台复用但保持高密度。
- `planning/ux/11-screens-admin.md` 定义登录、Dashboard、内容管理、用户、订单、客服等后台屏幕。

## 需求落实

- 页面：后台全部路由。
- 组件：AdminAppShell、Sidebar、TopBar、Breadcrumbs、ThemeToggle。
- API：无直接 API。
- 数据表：无。
- 状态逻辑：路由切换保留筛选状态；移动端 Sidebar 抽屉。

## 不明确 / 风险

- 风险：后台移动端不是主场景但仍需基本可用。
- 处理：桌面优先，移动端保证导航和表格横向滚动。

## 技术假设

- 与应用端共享 design tokens，但后台布局更高密度。
- 不以外部产品风格为验收标准；以知语 token、一致导航、可扫描表格和审计优先为准。

## 最终验收清单

- [ ] Sidebar/TopBar/Breadcrumbs 可用。
- [ ] 亮暗主题切换生效。
- [ ] 后台主要页面桌面优先布局。
- [ ] 移动端抽屉可导航。