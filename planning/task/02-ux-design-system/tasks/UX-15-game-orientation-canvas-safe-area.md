# UX-15 · 游戏横屏与画布安全区

## 来源

- `planning/ux/10-game-ux.md`

## 需求落实

- 实现 OrientationMask，引导竖屏用户旋转。
- 使用 Screen Orientation API；不支持时只提示。
- 画布基准 1280×720，等比缩放。
- HUD 与虚拟控件避开 safe-area。
- 退出游戏解除方向锁定。

## 验收清单

- [ ] 竖屏进入显示 OrientationMask。
- [ ] 横屏进入画布，HUD 不被刘海/边缘遮挡。
- [ ] 退出后恢复普通方向行为。
- [ ] 低端设备画布缩放无模糊异常。