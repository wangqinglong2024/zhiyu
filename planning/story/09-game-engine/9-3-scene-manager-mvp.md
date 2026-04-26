# ZY-09-03 · 场景管理器（MVP）

> Epic：E09 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 游戏工程师
**I want** 标准场景接口 `Scene { enter / exit / update / render }` 与 SceneManager 切换、转场
**So that** 12 款游戏的菜单 / 玩法 / 结算用一致流程组织。

## 上下文
- SceneManager：栈式（push/pop/replace）+ 异步过渡（fade ≤ 200ms）
- Scene 暴露 onEnter/onExit/update(dt)/render
- 路由层 `/games/:slug` mount Engine + 推首场景

## Acceptance Criteria
- [ ] Scene 接口 + 抽象基类 BaseScene
- [ ] SceneManager.push/pop/replace + 转场
- [ ] 三个示例 scene（Splash/Menu/Play）演示
- [ ] 单测：场景生命周期顺序正确

## 测试方法
```bash
cd /opt/projects/zhiyu/system
pnpm --filter @zhiyu/game test scene
```

## DoD
- [ ] 三场景互转无内存泄漏

## 依赖
- 上游：ZY-09-01 / 02
