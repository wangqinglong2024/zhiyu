# ZY-07-07 · 个人学习仪表板

> Epic：E07 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 学员
**I want** 在「我」首页看到 XP / 等级 / 连续天数 / 今日 SRS / 在学课程 / 推荐
**So that** 一眼掌握学习状态与下一步行动。

## 上下文
- 数据来源：`user_progression` + `enrollments` + `srs queue` + `recommendations`（基于 hsk_level + goal）。
- 卡片化布局；可拖拽排序（保存到 user_settings）。
- 离线兜底：用 IndexedDB 缓存上一次数据。

## Acceptance Criteria
- [ ] `GET /api/v1/me/dashboard` 聚合接口（一次返回 6 张卡数据）
- [ ] FE 6 张卡组件（XP / Streak / Today SRS / Continue Learning / Recommend / Achievements）
- [ ] 卡片排序持久化
- [ ] 骨架 + 错误兜底

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run dashboard
```
- MCP Puppeteer：拖拽顺序 → 刷新仍生效

## DoD
- [ ] 聚合接口 ≤ 300ms
- [ ] 6 卡完整显示

## 依赖
- 上游：ZY-07-01..06
