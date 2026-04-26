# ZY-08-03 · 课程列表 / Stage 页 / 详情页

> Epic：E08 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 学员
**I want** 浏览所有赛道、查看每赛道的 12 个 stage、进入 stage 看课时列表
**So that** 我能选择适合自己的学习路径。

## 上下文
- 路由：`/learn`（赛道）→ `/learn/:track`（12 stage 网格）→ `/learn/:track/:stage`（lesson 列表）→ `/learn/:track/:stage/:lessonId`（学习页 ZY-08-04）。
- stage 卡片显示难度 chip / 完成进度环 / 锁/解锁状态。
- 推荐排序：根据 hsk_self_level highlight 第一个未学 stage。

## Acceptance Criteria
- [ ] 3 级路由建立
- [ ] stage 卡片 + 进度环
- [ ] 未解锁 stage 显示锁 + 引导
- [ ] 4 语切换标题/描述
- [ ] 离线缓存上次访问列表

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-fe pnpm --filter @zhiyu/web exec vitest run learn
```
- MCP Puppeteer：浏览 12 赛道 → 1 赛道 → 1 stage

## DoD
- [ ] 进度环准确
- [ ] 离线兜底显示

## 依赖
- 上游：ZY-08-02 / ZY-07-01
