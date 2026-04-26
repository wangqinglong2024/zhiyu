# ZY-08-02 · 课程 / 课时 API

> Epic：E08 · 估算：M · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** FE
**I want** 拉取课程列表、模块详情、课时正文（含步骤）的统一接口
**So that** 列表、详情、学习页都能驱动起来。

## 上下文
- C 端 API：仅返回 `published`；带 `is_free` 标记；正文按 ZY-04-04 取 lng。
- 鉴权：未登录可查列表 / 详情，但学习接口需要登录 + entitlement（接 ZY-07 / ZY-13）。
- 缓存：`stale-while-revalidate` 60s。

## Acceptance Criteria
- [ ] `GET /api/v1/courses?track&stage&level&lng` 列表
- [ ] `GET /api/v1/courses/:id` 详情（含课时大纲）
- [ ] `GET /api/v1/lessons/:id` 课时（含 step payload）
- [ ] `GET /api/v1/me/courses` 我的课程（汇总 enrollments）
- [ ] OpenAPI 描述生成（zod-to-openapi）

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run courses.api
```

## DoD
- [ ] OpenAPI 文档可见
- [ ] 未授权 lesson 返 402

## 依赖
- 上游：ZY-08-01 / ZY-04-04
- 下游：ZY-08-03..06
