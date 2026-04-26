# ZY-09-04 · 资源加载器（MVP）

> Epic：E09 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 游戏工程师
**I want** 统一 AssetLoader：按 manifest 预加载图集 / 音频 / 字体 / 数据 JSON，支持进度回调
**So that** 游戏首屏可显示真实加载进度并避免运行时卡顿。

## 上下文
- manifest 形式：`{ images:[], spritesheets:[], audio:[], json:[], fonts:[] }`
- Pixi Assets API + Howler 预加载
- 缓存：内存 LRU；同一资源重复 add 直接命中
- 离线：通过 SW（ZY-05-01）二级缓存

## Acceptance Criteria
- [ ] `AssetLoader.preload(manifest, onProgress)` Promise
- [ ] 多类型并发 + 个体失败不中断（错误聚合）
- [ ] 单测：mock fetch，进度从 0 → 1

## 测试方法
```bash
cd /opt/projects/zhiyu/system
pnpm --filter @zhiyu/game test loader
```

## DoD
- [ ] 进度精度 ≥ 1%
- [ ] 错误聚合返回

## 依赖
- 上游：ZY-09-01
