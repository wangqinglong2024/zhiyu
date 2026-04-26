# ZY-09-05 · 输入：键盘（MVP）

> Epic：E09 · 估算：S · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 游戏工程师
**I want** 统一键盘输入抽象（pressed / justPressed / justReleased）
**So that** 各游戏不用直接监听 keydown/up，可重映射、可禁用。

## 上下文
- KeyboardInput：每帧 Engine.tick 前 sample
- 默认映射 `up/down/left/right/action/cancel/pause`，可自定义
- 焦点丢失时所有 key 释放

## Acceptance Criteria
- [ ] `KeyboardInput` 类 + 默认 binding
- [ ] `isDown`、`wasJustDown`、`wasJustUp`
- [ ] 单测：模拟 keydown/up 事件

## 测试方法
```bash
cd /opt/projects/zhiyu/system
pnpm --filter @zhiyu/game test input.keyboard
```

## DoD
- [ ] 三种状态判定准确

## 依赖
- 上游：ZY-09-01
