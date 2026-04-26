# ZY-11-06 · 书架 + TTS + 推荐

> Epic：E11 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 读者
**I want** 在「我」首页看到我的书架，每本带最新章节红点 + 上次阅读位置；首页推荐对路新书
**So that** 持续阅读体验顺滑。

## 上下文
- 书架数据 = favorites where entity_type='novel' + 关联 reading_progress + 最新章节
- 推荐策略 v1：按 hsk_self_level / 最近阅读类型 / 全站热度加权（不上 ML 模型）
- TTS：浏览器 SpeechSynthesis（无外部 SaaS），保留 hooks 待 v1.5 接更优 voice

## Acceptance Criteria
- [ ] `GET /api/v1/me/bookshelf` 返回书架带红点 / 进度
- [ ] `GET /api/v1/recommend/novels?lng` 返回 8-12 本
- [ ] FE 书架页 + 红点 + 移除 + 排序
- [ ] 首页 / 我 入口卡片
- [ ] TTS 在 reader 内启用速度切换

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run bookshelf recommend.novels
```

## DoD
- [ ] 红点准确
- [ ] 推荐合理

## 不做
- 协同过滤推荐（v1.5）

## 依赖
- 上游：ZY-11-01..05 / ZY-06-04
