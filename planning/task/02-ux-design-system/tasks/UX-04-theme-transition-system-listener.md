# UX-04 · 主题切换与系统监听

## 来源

- `planning/ux/04-theme-system.md`
- `planning/ux/12-motion.md`

## 需求落实

- 监听 `prefers-color-scheme`，仅在 system 模式下响应。
- 切换动画限制在 background/color/border/shadow，时长 180ms。
- 响应 `prefers-reduced-motion`，关闭主题过渡。
- 所有图标按钮有 tooltip 与 aria-label。

## 验收清单

- [ ] system 主题切换自动响应。
- [ ] reduced motion 下无过渡动画。
- [ ] 主题按钮可键盘操作。
- [ ] Header、TabBar、Modal 同步切换。