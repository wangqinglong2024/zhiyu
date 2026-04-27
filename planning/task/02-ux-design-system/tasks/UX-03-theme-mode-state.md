# UX-03 · 实现主题模式状态

## 来源

- `planning/ux/04-theme-system.md`
- `planning/prds/06-user-account`

## 需求落实

- 支持 light、dark、system。
- 已登录用户使用 `preferences.theme`；未登录用户使用本地存储。
- 主题只切 CSS variables，不重载路由。
- Profile 与 Admin 使用同一主题状态逻辑。

## 验收清单

- [ ] 明暗主题所有核心页面可用。
- [ ] 登录后主题偏好可持久化。
- [ ] system 模式跟随 OS 变化。
- [ ] 主题切换不闪屏、不抖动。