# T05-005: 后端 API — 课时小测验

> 分类: 05-系统课程-考核 (Course Assessment)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 5

## 需求摘要

实现课时小测验（Lesson Quiz）的完整 API 流程。课时小测验在用户完成一节课后触发，包含 3-5 道题目，不设通过门槛，答错的题自动写入 SRS 复习系统。支持即时逐题反馈模式（答一题立即判分并显示解析），不支持暂停续答。

## 相关上下文

- 产品需求: `product/apps/04-course-assessment/02-lesson-quiz.md` — 课时小测验完整 PRD
- 产品需求: `product/apps/04-course-assessment/00-index.md` §三.1 — 课时小测验规则
- API 规范: `grules/04-api-design.md` — RESTful 设计规约
- 编码规范: `grules/05-coding-standards.md` §三 — 后端编码规范
- 关联任务: T05-004（题型引擎，前置）、T04-004（SRS 系统）、T05-009（前端小测验页面）

## 技术方案

### API 端点设计

#### 1. 开始小测验

```
POST /api/v1/lessons/:lessonId/quiz
Authorization: Bearer {token}

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "attemptId": "uuid",
    "questions": RenderedQuestion[],  // 3-5 道题目
    "totalCount": 5,
    "timeLimit": null                 // 小测验无时间限制
  }
}
```

**逻辑**:
- 调用 QuestionEngine 按 lessonId 抽 3-5 题
- 创建 quiz_attempts 记录（assessment_type='lesson_quiz', status='in_progress'）
- 冻结题目快照到 quiz_attempts.question_ids
- 返回渲染态题目（不含正确答案）

#### 2. 提交单题答案（即时反馈）

```
POST /api/v1/assessments/:attemptId/answers
Authorization: Bearer {token}

Body:
{
  "questionId": "uuid",
  "userAnswer": { ... },             // 各题型格式不同
  "timeSpentMs": 12000               // 答题用时（毫秒）
}

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "isCorrect": true,
    "scoreEarned": 20,
    "correctAnswer": { ... },        // 正确答案（即时反馈显示）
    "explanation": {
      "zh": "...",
      "en": "..."
    },
    "knowledgeTags": ["grammar-的", "vocabulary-图书馆"]
  }
}
```

**逻辑**:
- 验证 attemptId 属于当前用户且 status='in_progress'
- 验证 questionId 在 quiz_attempts.question_ids 中
- 验证该题未答过（quiz_answers 中无记录）
- 调用 GradingEngine 判分
- 保存 quiz_answers 记录
- 返回判分结果和解析

#### 3. 完成小测验

```
POST /api/v1/assessments/:attemptId/submit
Authorization: Bearer {token}

Body: {}  // 无需额外参数，所有答案已逐题提交
// ⚠️ 路由架构：T05-005/006/007 共享 /api/v1/assessments/:attemptId/submit 路径
// 在 assessment/index.ts 中统一注册，通过查询 attempt.type 分派到对应 service

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "totalScore": 80.0,
    "maxScore": 100.0,
    "correctCount": 4,
    "totalCount": 5,
    "passed": true,                  // 小测验始终 true（无门槛）
    "wrongQuestionIds": ["uuid"],    // 错题列表
    "srsItemsCreated": 1            // 写入 SRS 的错题数量
  }
}
```

**逻辑**:
- 验证所有题目已答
- 计算总分和统计
- 更新 quiz_attempts 状态为 'graded'
- 错题自动写入 SRS 系统（调用 T04-004 的 SRS 接口）
- 返回结果统计

### SRS 错题写入

```typescript
// 对每道错题调用 SRS 服务
for (const wrongAnswer of wrongAnswers) {
  await srsService.addItem({
    userId,
    itemType: 'quiz_wrong',
    contentId: wrongAnswer.questionId,
    knowledgeTags: wrongAnswer.knowledgeTags,
    sourceType: 'lesson_quiz',
    sourceId: attemptId
  })
}
```

### 中间件 & 校验

- 身份认证中间件（Bearer Token）
- Zod 验证请求体
- 权限检查（用户只能操作自己的 attempt）
- 重复提交保护（同一题不可重复作答）

## 范围（做什么）

- 实现 3 个 API 端点：开始小测验、提交单题答案、完成小测验
- 路由注册到 Express Router
- 请求参数 Zod 校验
- 调用 QuestionEngine 出题
- 调用 GradingEngine 判分（逐题即时反馈）
- 完成时写入 SRS（调用 T04-004 接口）
- 统一错误处理

## 边界（不做什么）

- 不做暂停续答功能（课时小测验不支持）
- 不做通过门槛判断（课时小测验无门槛）
- 不做前端页面（T05-009）
- 不做 SRS 服务本身（依赖 T04-004）

## 涉及文件

- 新建: `backend/src/routers/v1/assessment/lesson-quiz.ts` — 课时小测验路由
- 新建: `backend/src/routers/v1/assessment/index.ts` — assessment 路由汇总（统一注册 /api/v1/assessments 前缀，T05-005/006/007 共享此入口，按 attempt.type 分派到不同 service）
- 新建: `backend/src/services/lesson-quiz-service.ts` — 课时小测验业务逻辑
- 新建: `backend/src/validators/lesson-quiz-schema.ts` — 请求体 Zod Schema
- 修改: `backend/src/routers/v1/index.ts` — 注册新路由
- 修改: `backend/src/services/question-engine.ts` — 按课时抽题配置（如需微调）

## 依赖

- 前置: T05-001（题库 DB）、T05-002（考核记录 DB）、T05-004（题型引擎）
- 外部: T04-009（SRS 复习 API，错题写入）
- 后续: T05-009（前端小测验页面）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 用户已完成 Lesson 1 的学习  
   **WHEN** 调用 `POST /api/v1/lessons/{lessonId}/quiz`  
   **THEN** 返回 3-5 道与该课时相关的题目，quiz_attempts 表新增一条 in_progress 记录

2. **GIVEN** 用户正在小测验中  
   **WHEN** 提交某道单选题答案 `POST /api/v1/assessments/{attemptId}/answers`  
   **THEN** 即时返回判分结果（isCorrect/correctAnswer/explanation）

3. **GIVEN** 用户对同一道题已提交过答案  
   **WHEN** 再次提交该题答案  
   **THEN** 返回 409 Conflict 错误

4. **GIVEN** 用户的 attemptId 不属于该用户  
   **WHEN** 尝试提交答案  
   **THEN** 返回 403 Forbidden

5. **GIVEN** 所有题目已答完  
   **WHEN** 调用 `POST /api/v1/assessments/{attemptId}/submit`  
   **THEN** 返回总分、正确数、错题列表，quiz_attempts 状态变为 graded

6. **GIVEN** 用户答错 2 道题  
   **WHEN** 完成小测验  
   **THEN** 2 道错题被写入 SRS 系统

7. **GIVEN** 用户小测验得分为 60/100  
   **WHEN** 查看结果  
   **THEN** passed 字段为 true（小测验无通过门槛）

8. **GIVEN** 未认证用户  
   **WHEN** 调用任意考核 API  
   **THEN** 返回 401 Unauthorized

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动
2. 执行 Migration（T05-001/002 的表 + 种子数据）
3. 插入测试用户和测试课时题目
4. 调用开始小测验 API → 验证返回题目格式和数量
5. 逐题提交答案 → 验证即时反馈
6. 测试重复提交 → 验证 409
7. 完成小测验 → 验证结果统计和 SRS 写入
8. 测试权限（非本人 attempt → 403）
9. 编译检查：`docker compose exec backend npx tsc --noEmit`

### 测试通过标准

- [ ] Docker 构建成功
- [ ] TypeScript 零编译错误
- [ ] 开始小测验返回 3-5 道题
- [ ] 逐题即时反馈正确
- [ ] 重复提交同一题返回 409
- [ ] 权限验证正确（401/403）
- [ ] 完成后错题写入 SRS
- [ ] quiz_attempts 状态正确流转

### 测试不通过处理

- 发现问题 → 修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞

## 执行结果报告

结果文件路径: `/tasks/result/05-course-assessment/T05-005-api-lesson-quiz.md`

## 自检重点

- [ ] URL 使用 kebab-case（`/api/v1/lessons/:lessonId/quiz`）
- [ ] 统一返回格式 `{code, message, data}`
- [ ] Zod 验证所有请求体
- [ ] 正确答案只在即时反馈时返回（不在题目列表中）
- [ ] SRS 写入失败不阻塞小测验完成（降级处理）
- [ ] 无 N+1 查询
