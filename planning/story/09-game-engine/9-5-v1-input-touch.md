# ZY-09-05v1 · 输入：触摸 / 手势

> Epic：E09 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 移动端玩家
**I want** 触屏游戏支持点击、拖拽、轻扫、长按
**So that** 在手机上玩感受不输键盘 / 手柄。

## 上下文
- TouchInput：基于 Pointer Events（统一鼠标/触屏）
- 手势：tap / drag / swipe (4 方向) / longpress / pinch
- 与 KeyboardInput 抽象一致：暴露 `pointers`、`gestures`、`onGesture(cb)`

## Acceptance Criteria
- [ ] `TouchInput` 实现 5 类手势
- [ ] 手势阈值可配置
- [ ] 多指支持 ≥ 2
- [ ] 单测 + storybook 演示

## 测试方法
```bash
cd /opt/projects/zhiyu/system
pnpm --filter @zhiyu/game test input.touch
```

## DoD
- [ ] 5 手势识别率 ≥ 95%（自动测试样本）

## 依赖
- 上游：ZY-09-05
