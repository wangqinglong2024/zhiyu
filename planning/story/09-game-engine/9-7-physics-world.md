# ZY-09-07 · 物理世界（Matter.js 封装）

> Epit：E09 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 游戏工程师
**I want** Matter.js 封装的 PhysicsWorld，包含常用 body 工厂、与 Pixi DisplayObject 同步
**So that** 弹球 / 切水果 / 物理小怪都能复用。

## 上下文
- World 创建 + gravity 配置
- BodyFactory：rectangle / circle / polygon / fromVertices
- 同步：每帧把 body.position/angle 写入 displayObject
- 碰撞事件分发：onCollision(group:'enemy', cb)

## Acceptance Criteria
- [ ] `PhysicsWorld.create(opts)` + step(dt)
- [ ] BodyFactory 4 种
- [ ] sync(displayObject, body) helper
- [ ] 碰撞事件按 group / category
- [ ] 单测：两 body 重力下下落 1s 后到位

## 测试方法
```bash
cd /opt/projects/zhiyu/system
pnpm --filter @zhiyu/game test physics
```

## DoD
- [ ] 60 FPS 下 200 个 body 流畅

## 依赖
- 上游：ZY-09-01 / 02
