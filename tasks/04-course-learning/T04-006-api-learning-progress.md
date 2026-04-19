# T04-006: 后端 API — 学习进度

> 分类: 04-系统课程-学习 (Course Learning)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 5

## 需求摘要

实现学习进度管理 API，包括：记录课时学习进度（断点续学自动保存）、查询用户全局学习进度、更新课时状态（状态机流转）、解锁判断（前一单元测评通过才能解锁下一单元）、Level 完成状态更新。进度更新必须支持并发安全（乐观锁），断点续学数据每 30 秒自动保存。

## 相关上下文

- 产品需求: `product/apps/03-course-learning/05-lesson-page.md` §七（学习进度自动保存 — 每 30 秒 + 退出时保存）
- 产品需求: `product/apps/03-course-learning/04-level-detail.md` §三.3（单元解锁条件规则）
- 产品需求: `product/apps/03-course-learning/01-course-homepage.md` §三（Level 地图进度展示）
- 产品需求: `product/apps/03-course-learning/07-data-nonfunctional.md` §一.2（学习进度数据流）
- 设计规范: `grules/04-api-design.md`（URL 规范、统一响应）
- 设计规范: `grules/05-coding-standards.md` §三（三层分离 + 并发安全 — 乐观锁）
- 关联任务: T04-002（进度表）→ 本任务 → T04-010（课程首页前端）、T04-013（课时学习页前端）

## 技术方案

### API 设计

#### 1. 保存课时学习进度（断点续学）

```
PUT /api/v1/courses/lessons/:lessonId/progress
鉴权级别: 1（需登录）
```

请求体:
```json
{
  "scroll_position": 0.65,
  "viewed_vocab_ids": ["v1", "v2", "v5"],
  "played_audio_ids": ["a1", "a3"],
  "last_section_index": 3,
  "study_seconds_delta": 30
}
```

业务规则:
- 首次调用自动创建进度记录，状态从 `not_started` → `in_progress`
- 后续调用仅更新 `resume_data` JSONB 和 `total_study_seconds`
- 幂等处理：相同数据重复提交不报错
- 并发安全：使用 `updated_at` 乐观锁

#### 2. 更新课时学习状态

```
POST /api/v1/courses/lessons/:lessonId/status
鉴权级别: 1（需登录）
```

请求体:
```json
{
  "status": "content_done"
}
```

业务规则:
- 状态流转校验: `not_started → in_progress → content_done → completed`
- 不允许跳跃（如直接 not_started → completed）
- `completed` 状态由课时小测验完成后触发（T05 模块），本 API 支持接收
- 课时完成后触发：
  - 更新 `user_unit_progress` 的 `completed_lessons` 计数
  - 检查该单元是否全部课时完成，更新单元状态
  - 将重点词汇 + 语法点自动加入 SRS 复习队列

#### 3. 查询用户学习概览

```
GET /api/v1/courses/progress/overview
鉴权级别: 1（需登录）
```

响应:
```json
{
  "code": 0,
  "data": {
    "current_level": 3,
    "current_level_progress": 65.0,
    "total_completed_lessons": 130,
    "total_study_hours": 42.5,
    "streak_days": 7,
    "srs_due_today": 12,
    "levels_progress": [
      { "level_number": 1, "status": "completed", "progress": 100 },
      { "level_number": 2, "status": "completed", "progress": 100 },
      { "level_number": 3, "status": "in_progress", "progress": 65 }
    ]
  }
}
```

#### 4. 获取单元解锁状态

```
GET /api/v1/courses/levels/:levelId/unlock-status
鉴权级别: 1（需登录）
```

返回该 Level 下所有单元的解锁状态，供前端 Level 详情页展示。

#### 5. 初始化用户课程进度

```
POST /api/v1/courses/progress/initialize
鉴权级别: 1（需登录）
```

请求体:
```json
{
  "start_level": 1
}
```

业务规则:
- 首次进入课程 Tab 时调用
- 将指定 Level 设为 `in_progress`，第一个 Unit 设为 `unlocked`
- 入学测试完成后调用（start_level = 推荐 Level）
- 幂等：已初始化过则不重复操作

### 三层架构

```
Router: src/routers/v1/course-progress.ts
Service: src/services/course-progress-service.ts
Repository: src/repositories/course-progress-repository.ts
```

### 状态机实现

```typescript
// 合法的状态流转映射
const LESSON_STATUS_TRANSITIONS: Record<string, string[]> = {
  'not_started':  ['in_progress'],
  'in_progress':  ['content_done'],
  'content_done': ['completed'],
  'completed':    [], // 终态
}

// Service 层校验
function validateStatusTransition(current: string, next: string): boolean {
  return LESSON_STATUS_TRANSITIONS[current]?.includes(next) ?? false
}
```

### 解锁规则

```
Unit 解锁条件（Service 层判断）:
  Level 内第 1 个 Unit → 默认解锁
  后续 Unit → 前一 Unit 的 assessment_passed = true

Lesson 解锁条件:
  Unit 内第 1 个 Lesson → Unit 解锁即可学习
  后续 Lesson → 前一 Lesson status = 'completed'
```

## 范围（做什么）

- 创建 5 个进度相关 API 端点
- 实现状态机流转校验
- 实现单元/课时解锁判断逻辑
- 实现断点续学数据保存（resume_data JSONB 更新）
- 课时完成后自动触发 SRS 队列添加（调用 SRS Service）
- 实现并发安全（乐观锁 `updated_at`）

## 边界（不做什么）

- 不实现课时小测验逻辑（T05 模块，但接受状态更新为 completed）
- 不实现单元测评逻辑（T05 模块）
- 不实现综合考核逻辑（T05 模块）
- 不实现前端自动保存定时器

## 涉及文件

- 新建: `backend/src/routers/v1/course-progress.ts`
- 新建: `backend/src/services/course-progress-service.ts`
- 新建: `backend/src/repositories/course-progress-repository.ts`
- 修改: `backend/src/routers/v1/index.ts` — 注册进度路由
- 修改: `backend/src/models/learning-progress.ts` — 补充请求/响应类型

## 依赖

- 前置: T04-002（进度表）、T04-004（SRS 表 — 课时完成后添加复习项）
- 后续: T04-010（课程首页前端）、T04-013（课时学习页前端）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 用户首次打开课时页面 **WHEN** `PUT /api/v1/courses/lessons/:id/progress` **THEN** 创建进度记录，状态自动设为 `in_progress`
2. **GIVEN** 用户正在学习 **WHEN** 多次 PUT 更新 scroll_position **THEN** `resume_data` 正确更新，`total_study_seconds` 累加
3. **GIVEN** 课时状态为 `in_progress` **WHEN** POST status=`content_done` **THEN** 状态更新成功
4. **GIVEN** 课时状态为 `not_started` **WHEN** POST status=`completed` **THEN** 返回 400（非法状态跳跃）
5. **GIVEN** 单元内最后一个课时完成 **WHEN** 查询单元进度 **THEN** `completed_lessons` = `total_lessons`
6. **GIVEN** 前一单元测评未通过 **WHEN** 查询下一单元解锁状态 **THEN** 状态为 `locked`
7. **GIVEN** 前一单元测评通过（≥70 分） **WHEN** 查询下一单元解锁状态 **THEN** 状态为 `unlocked`
8. **GIVEN** 用户未初始化进度 **WHEN** `POST /api/v1/courses/progress/initialize` start_level=1 **THEN** L1 设为 in_progress，L1U1 设为 unlocked
9. **GIVEN** 进度已初始化 **WHEN** 重复调用 initialize **THEN** 幂等处理，不重复创建
10. **GIVEN** 课时完成 **WHEN** 检查 SRS 队列 **THEN** 该课时的重点词汇已自动加入 SRS

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build`
2. `docker compose ps` + `docker compose logs --tail=30 backend`
3. 通过 curl 依次测试 5 个 API 端点
4. 验证状态机流转（合法 + 非法跳跃）
5. 验证断点续学数据保存和读取
6. 验证解锁判断逻辑
7. 验证 SRS 自动添加

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功
- [ ] 5 个 API 端点正常响应
- [ ] 状态机流转校验正确
- [ ] 断点续学数据正确保存/读取
- [ ] 解锁判断逻辑正确
- [ ] 课时完成后 SRS 自动添加
- [ ] 并发安全（乐观锁）
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞

## 执行结果报告

结果文件路径: `/tasks/result/04-course-learning/T04-006-api-learning-progress.md`

## 自检重点

- [ ] 安全: authMiddleware 守卫全部端点
- [ ] 安全: 用户只能更新自己的进度
- [ ] 性能: 无 N+1 查询
- [ ] 并发安全: 乐观锁防止并发覆盖
- [ ] 三层分离: 职责清晰
