# ZY-09-01 · 游戏引擎骨架 `@zhiyu/game`

> Epic：E09 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 游戏前端工程师
**I want** 一个独立 monorepo 包 `@zhiyu/game`，含 Engine / Scene / Loader / Audio / Input / Physics 抽象
**So that** 12 款小游戏共享同一引擎、不重复造轮子。

## 上下文
- 目录：`system/packages/game/src/{core,scenes,assets,audio,input,physics,ui}`
- 依赖：pixi.js@^8、matter-js@^0.20、howler@^2.2、gsap@^3
- 不引入 Phaser / cocos / unity-webgl
- 与 `@zhiyu/ui` 解耦；游戏可独立打包

## Acceptance Criteria
- [ ] package.json + tsconfig + 入口 `src/index.ts`
- [ ] core `Engine` 类：lifecycle (init/start/stop/destroy)、tick (60Hz)、resize、pause/resume
- [ ] 暴露 `createGame(config)` 工厂
- [ ] 单测：mock requestAnimationFrame，tick 计数正确
- [ ] storybook 一个空白 canvas 演示

## 测试方法
```bash
cd /opt/projects/zhiyu/system
pnpm --filter @zhiyu/game test
pnpm --filter @zhiyu/game build
```

## DoD
- [ ] 包独立可 build
- [ ] tick 单测绿

## 不做
- 真实 Pixi 渲染 / 资源（后续 story）

## 依赖
- 上游：ZY-01-01..06
- 下游：ZY-09-02..10
