# ZY-07-02 · 10-step 推进引擎

> Epic：E07 · 估算：L · 状态：ready-for-dev
> 代码根：`/opt/projects/zhiyu/system/`
> 顶层约束：[planning/00-rules.md](../../00-rules.md)

## User Story
**As a** 学员
**I want** 一节课按 10 步骤递进（导入 → 词 → 句 → 拼音 → 听 → 说 → 读 → 写 → 练 → 测）
**So that** 每节课节奏稳定，掌握牢固。

## 上下文
- 步骤合约：每步定义 `type / payload schema / pass criteria`，由 `lesson.steps jsonb` 描述（接 ZY-08-01 step-spec）。
- 推进规则：完成当前 step 才能解锁下一 step；可回退查看；最后一步「测」需 ≥ 70% 通过整课。
- 通过 → 解锁下一 lesson + 写 enrollment.progress。

## Acceptance Criteria
- [ ] BE 引擎 `LessonEngine.advance(userId, lessonId, payload)` 校验 + 落 lesson_progress
- [ ] 各 step 单元测试（10 类）
- [ ] 整课通过自动 update enrollments.current_lesson_id
- [ ] 「测」未达 70% → 提示重测，不解锁

## 测试方法
```bash
cd /opt/projects/zhiyu/system/docker
docker compose exec zhiyu-app-be pnpm vitest run lesson.engine
```

## DoD
- [ ] 10 step 单测全绿
- [ ] 解锁规则正确

## 不做
- 步骤 UI 组件（属 ZY-08-05）

## 依赖
- 上游：ZY-07-01 / ZY-08-01
- 下游：ZY-07-03..07
