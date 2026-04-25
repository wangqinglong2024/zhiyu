# Story 9.11: InputManager V1（多点触控 / 缩放 / 旋转 / 长按）

Status: ready-for-dev

## Story

作为 **游戏开发者**，
我希望 **InputManager 在 MVP 基础上扩展多点触控、缩放、旋转、长按事件**，
以便 **特定玩法（消消乐、记忆翻牌、连线）能识别复杂手势**。

## Acceptance Criteria

1. 在 9-5 MVP 基础上扩展事件：`pinch`（缩放）、`rotate`、`longPress`（>500ms）、`doubleTap`（<300ms）。
2. 多点触控正确处理 2 finger 同时移动。
3. 单元测试：4 种新手势各 ≥ 3 用例。
4. 文档示例：在哪些游戏中使用何种手势。
5. 性能：事件分发 < 1ms。
6. 不破坏 9-5 MVP 已有 API（向后兼容）。

## Tasks / Subtasks

- [ ] **扩展手势**（AC: 1,2）
  - [ ] pinch / rotate
  - [ ] longPress / doubleTap timer
- [ ] **测试**（AC: 3）
- [ ] **文档**（AC: 4）

## Dev Notes

### 关键约束
- pinch / rotate 仅在 2 finger 触发，1 finger 不计算。
- longPress 与 drag 互斥（一旦移动 > 阈值取消 longPress）。

### 关联后续 stories
- 9-5 MVP 前置
- 10-06 / 10-11 / 10-12 等使用复杂手势

### Project Structure Notes
- `packages/game-engine/src/core/InputManager.ts`（扩展）

### References
- `planning/epics/09-game-engine.md` ZY-09-05 V1

### 测试标准
- 单元：每手势 ≥ 3
- 性能：< 1ms 分发

## Dev Agent Record

### Context Reference
### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
