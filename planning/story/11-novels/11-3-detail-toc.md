# ZY-11-03 · 小说详情页 + 目录

> Epic：E11 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 用户
**I want** 看小说封面 / 简介 / 评分 / 标签 / 章节目录 / 加入书架
**So that** 决定开读，并能快速跳到任意章节。

## 上下文
- 路由：`/novels/:slug`
- 目录：分页 / 跳页 / 跳到上次阅读章节按钮（高亮）
- 加入书架（接 favorites entity_type='novel'）
- 分享：原生 share + 复制链接

## Acceptance Criteria
- [ ] 顶部封面 + 加入书架按钮
- [ ] 章节目录 lazy 分页（每页 100 章）
- [ ] 上次阅读章节高亮 + "继续阅读"按钮
- [ ] 评分组件（仅显示，本期不开评分写入）
- [ ] 4 语标题/简介

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-fe pnpm --filter @zhiyu/web exec vitest run novels.detail
```
- MCP Puppeteer：跳章节 → 加书架 → 分享

## DoD
- [ ] 大目录 (≥1000 章) 流畅
- [ ] 加书架成功提示

## 依赖
- 上游：ZY-11-01 / ZY-06-04（favorites）
