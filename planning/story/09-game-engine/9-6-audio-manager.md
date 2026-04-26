# ZY-09-06 · 音频管理器

> Epic：E09 · 估算：S · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 游戏工程师
**I want** 统一 AudioManager：BGM / SFX / 语音三轨独立音量、淡入淡出、移动端 user-gesture 解锁
**So that** 各游戏接入即可，不重复处理 webaudio 兼容。

## 上下文
- 基于 Howler；三 group：bgm / sfx / voice
- 全局 mute；音量持久化 user_settings
- iOS Safari user-gesture unlock

## Acceptance Criteria
- [ ] `AudioManager.play(id, opts)`、stop、pause、setVolume(group)
- [ ] 三 group 音量独立
- [ ] BGM 淡入 ≤ 500ms
- [ ] 单测 mock Howl

## 测试方法
```bash
cd /opt/projects/zhiyu/system
pnpm --filter @zhiyu/game test audio
```

## DoD
- [ ] 移动端 unlock 通

## 依赖
- 上游：ZY-09-01 / 04
