# ZY-09-02 · PixiJS Application 与渲染层

> Epic：E09 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 游戏工程师
**I want** 一个封装好的 `PixiRenderer`，自适应分辨率、设备像素比、低端机降级
**So that** 各游戏 scene 直接 `add(displayObject)` 即可，不关心底层。

## 上下文
- Pixi v8 Application；`autoDensity:true`；`resolution=Math.min(devicePixelRatio,2)`
- 低端检测（`navigator.deviceMemory<4 || hwConcurrency<4`）→ 降到 1x + 关闭 antialias
- ResizeObserver 容器变化重 resize
- WebGL 失败回退 canvas2d

## Acceptance Criteria
- [ ] `PixiRenderer` 类：mount(el)、unmount()、resize()
- [ ] 集成 Engine 的 tick → app.ticker
- [ ] 单测：mount 后 canvas 出现；unmount 后释放
- [ ] storybook：FPS 显示

## 测试方法
```bash
cd /opt/projects/zhiyu/system
pnpm --filter @zhiyu/game test pixiRenderer
```

## DoD
- [ ] DPR 正确
- [ ] 降级路径触发

## 依赖
- 上游：ZY-09-01
