# UX-09 · 组件 Stories 与本地测试

## 来源

- `planning/ux/16-performance-quality.md`
- `planning/rules.md`

## 需求落实

- 为核心组件建立本地 Storybook stories。
- 每个组件覆盖 light/dark、4 语长文案、loading/disabled/error 状态。
- 使用本地 React Testing Library 与 axe-core 检测。
- 本地截图基线仅存 Docker/dev 产物，不接云视觉回归。

## 验收清单

- [ ] 组件 stories 可在 Docker 中启动。
- [ ] axe 检查无阻断问题。
- [ ] 长越南语/泰语文案不撑破控件。
- [ ] 无云测试/云视觉服务依赖。