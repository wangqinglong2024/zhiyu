# ZY-07-04 · 生词本与错题本

> Epic：E07 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 学员
**I want** 在一处看到我所有标记的生词与做错的题
**So that** 集中突破弱项。

## 上下文
- 生词本 = `favorites where entity_type='word'`（接 ZY-06-04）。
- 错题本 = `zhiyu.mistake_log(user_id, lesson_id, step_index, question_id, payload jsonb, created_at)`，由引擎错答时落库。
- 重做错题 → 调 SRS 改 grade=again。

## Acceptance Criteria
- [ ] `mistake_log` 表 + 自动写入触发（在 ZY-07-02 引擎错答路径）
- [ ] `GET /api/v1/me/wordbook` / `/me/mistakes`（分页 + 来源 lesson 过滤）
- [ ] FE `/me/wordbook`、`/me/mistakes` 两页
- [ ] 重做错题 → 答对自动从列表移除（保留历史 7 天可见）
- [ ] 导出 CSV（按需触发）

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run wordbook mistakes
```

## DoD
- [ ] 列表分页 + 过滤通
- [ ] 答对后自动移除

## 依赖
- 上游：ZY-06-04 / ZY-07-02 / ZY-07-03
