# ZY-09-09 · 横屏全屏 / 设备适配

> Epic：E09 · 估算：S · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 游戏玩家
**I want** 部分游戏横屏 / 全屏运行，刘海安全区适配
**So that** 操作空间最大化。

## 上下文
- API：requestFullscreen + screen.orientation.lock('landscape')
- iOS Safari 不支持 orientation.lock → 提示用户旋转
- safeAreaInsets via env(safe-area-inset-*) 传给 PixiRenderer
- PWA standalone 模式优先

## Acceptance Criteria
- [ ] `useFullscreen()` hook
- [ ] orientation lock 失败回退提示
- [ ] safe area padding 注入 scene
- [ ] 退出全屏自动暂停游戏

## 测试方法
- MCP Puppeteer mobile 模式：进入游戏 → 横屏 → 退出

## DoD
- [ ] iOS 提示卡可用
- [ ] safe area 不遮挡 UI

## 依赖
- 上游：ZY-09-01..03
