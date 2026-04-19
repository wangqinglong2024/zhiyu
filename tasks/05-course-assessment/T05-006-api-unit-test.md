# T05-006: 后端 API — 单元测评

> 分类: 05-系统课程-考核 (Course Assessment)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 5

## 需求摘要

实现单元测评（Unit Test）的完整 API 流程。单元测评在用户完成一个单元（Unit）所有课时后解锁，包含 10-15 道题目，采用统一提交模式（答完所有题一次性提交判分），通过门槛为 70 分，不通过可立即重考（无冷却时间）。支持答题进度保存（防断线丢失），通过后解锁下一单元。

## 相关上下文

- 产品需求: `product/apps/04-course-assessment/03-unit-test.md` — 单元测评完整 PRD
- 产品需求: `product/apps/04-course-assessment/00-index.md` §三.2 — 单元测评规则
- API 规范: `grules/04-api-design.md` — RESTful 设计规约
- 编码规范: `grules/05-coding-standards.md` §三 — 后端编码规范
- 关联任务: T05-004（题型引擎，前置）、T05-005（课时小测验参考）、T05-009（前端单元测评页面）

## 技术方案

### API 端点设计

#### 1. 开始单元测评

```
POST /api/v1/units/:unitId/test
Authorization: Bearer {token}

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "attemptId": "uuid",
    "questions": RenderedQuestion[],  // 10-15 道题目
    "totalCount": 15,
    "timeLimit": null,               // P1 无时间限制
    "passingScore": 70
  }
}
```

**逻辑**:
- 验证用户已完成该单元所有课时（依赖课程进度数据）
- 调用 QuestionEngine 按 unitId 抽 10-15 题（题型分布按 PRD 要求）
- 创建 quiz_attempts 记录（assessment_type='unit_test', status='in_progress'）
- 冻结题目快照
- 返回渲染态题目（不含正确答案）

#### 2. 保存答题进度

```
PUT /api/v1/assessments/:attemptId/progress
Authorization: Bearer {token}

Body:
{
  "currentIndex": 8,                // 当前答到第几题
  "answers": {                      // 已作答的答案
    "question-uuid-1": { "optionId": "uuid-a" },
    "question-uuid-2": { "pinyins": ["tú", "shū", "guǎn"] },
    ...
  },
  "dataSignature": "hmac-sha256-hex"  // 客户端不需手动计算，服务端签发
}

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "savedAt": "2025-01-01T00:00:00Z",
    "dataSignature": "hmac-sha256-hex"  // 服务端重新签名返回
  }
}
```

**逻辑**:
- 验证 attemptId 属于当前用户且状态为 in_progress
- 更新/创建 quiz_progress 记录
- 服务端用 HMAC-SHA256 签名进度数据
- 返回签名给客户端（下次恢复时验证）

#### 3. 恢复答题进度

```
GET /api/v1/assessments/:attemptId/progress
Authorization: Bearer {token}

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "currentIndex": 8,
    "answers": { ... },
    "savedAt": "2025-01-01T00:00:00Z",
    "questions": RenderedQuestion[]   // 重新返回题目列表（从快照恢复）
  }
}
```

**逻辑**:
- 验证签名完整性
- 从 quiz_progress 恢复已保存的答案
- 从 quiz_attempts.question_ids 重新加载题目

#### 4. 统一提交判分

```
POST /api/v1/assessments/:attemptId/submit
Authorization: Bearer {token}

Body:
{
  "answers": [
    {
      "questionId": "uuid",
      "userAnswer": { ... },
      "timeSpentMs": 15000
    },
    ...
  ]
}

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "totalScore": 80.0,
    "maxScore": 100.0,
    "passingScore": 70,
    "passed": true,
    "correctCount": 12,
    "totalCount": 15,
    "results": [
      {
        "questionId": "uuid",
        "isCorrect": true,
        "scoreEarned": 6.67,
        "correctAnswer": { ... },
        "explanation": { "zh": "..." }
      },
      ...
    ],
    "wrongQuestionIds": ["uuid-1", "uuid-2", "uuid-3"],
    "srsItemsCreated": 3,
    "unitUnlocked": "uuid-next-unit"  // 通过时返回下一单元 ID
  }
}
```

**逻辑**:
- 验证所有题目均已提交答案
- 批量调用 GradingEngine 判分
- 计算总分
- 更新 quiz_attempts 状态为 graded，写入分数
- 写入 quiz_answers 记录
- 错题写入 SRS
- 通过（≥70分）时：更新课程进度，解锁下一单元
- 不通过时：返回 passed=false，允许立即重考

### 单元解锁逻辑

```typescript
// 通过后解锁下一单元
if (totalScore >= 70) {
  await courseProgressService.unlockNextUnit(userId, unitId)
}
```

### 防断线设计

- 前端每答一题自动调用进度保存接口
- 页面刷新/断线后，检查是否有 in_progress 的 attempt
- 有则自动恢复进度，续答

## 范围（做什么）

- 实现 4 个 API 端点：开始测评、保存进度、恢复进度、提交判分
- 路由注册到 Express Router
- 请求参数 Zod 校验
- 调用 QuestionEngine 出题（按单元范围）
- 调用 GradingEngine 批量判分
- 进度保存/恢复 + HMAC 签名验证
- 通过判断和单元解锁
- 错题写入 SRS

## 边界（不做什么）

- 不做逐题即时反馈（单元测评采用统一提交模式）
- 不做考试时间限制（P1 阶段无限时）
- 不做前端页面（T05-009）
- 不做课程进度服务本身（依赖 T04 的课程进度模块）

## 涉及文件

- 新建: `backend/src/routers/v1/assessment/unit-test.ts` — 单元测评路由
- 新建: `backend/src/services/unit-test-service.ts` — 单元测评业务逻辑
- 新建: `backend/src/validators/unit-test-schema.ts` — 请求体 Zod Schema
- 修改: `backend/src/routers/v1/index.ts` — 注册新路由
- 修改: `backend/src/services/question-engine.ts` — 按单元抽题配置（如需微调）

## 依赖

- 前置: T05-001（题库 DB）、T05-002（考核记录 DB）、T05-004（题型引擎）
- 外部: T04-009（SRS 复习 API）、T04-006（课程进度服务）
- 后续: T05-009（前端单元测评页面）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 用户已完成单元 1 的所有课时  
   **WHEN** 调用 `POST /api/v1/units/{unitId}/test`  
   **THEN** 返回 10-15 道题目，创建 in_progress 的 quiz_attempt 记录

2. **GIVEN** 用户未完成该单元所有课时  
   **WHEN** 调用开始测评 API  
   **THEN** 返回 403 Forbidden，附带 "请先完成所有课时学习" 消息

3. **GIVEN** 用户答到第 8 题  
   **WHEN** 调用 `PUT /api/v1/assessments/{attemptId}/progress` 保存进度  
   **THEN** 返回 200 和签名，quiz_progress 表有记录

4. **GIVEN** 用户断线后重新打开  
   **WHEN** 调用 `GET /api/v1/assessments/{attemptId}/progress`  
   **THEN** 返回已保存的答案、当前位置和题目列表

5. **GIVEN** 进度数据被篡改（签名不匹配）  
   **WHEN** 恢复进度  
   **THEN** 返回 400 Bad Request，要求重新开始

6. **GIVEN** 用户提交所有 15 道题的答案  
   **WHEN** 调用 `POST /api/v1/assessments/{attemptId}/submit`  
   **THEN** 返回总分、逐题判分结果、通过/不通过状态

7. **GIVEN** 用户得分 >= 70 分  
   **WHEN** 查看提交结果  
   **THEN** passed=true，unitUnlocked 返回下一单元 ID

8. **GIVEN** 用户得分 < 70 分  
   **WHEN** 查看提交结果  
   **THEN** passed=false，可立即重新调用开始测评 API

9. **GIVEN** 用户答错 3 道题  
   **WHEN** 提交完成  
   **THEN** 3 道错题写入 SRS 系统

10. **GIVEN** 用户提交的答案数量 < 题目总数  
    **WHEN** 调用提交 API  
    **THEN** 返回 400，提示 "请完成所有题目后再提交"

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build`
2. 执行 Migration 和种子数据
3. 模拟完成课时进度 → 调用开始测评 → 验证题目返回
4. 保存进度 → 恢复进度 → 验证数据一致
5. 提交答案（得分 >= 70）→ 验证通过和单元解锁
6. 新建 attempt → 提交答案（得分 < 70）→ 验证不通过和立即重考
7. 测试篡改签名 → 验证拒绝恢复
8. 编译检查：`docker compose exec backend npx tsc --noEmit`

### 测试通过标准

- [ ] Docker 构建成功，TypeScript 零编译错误
- [ ] 开始测评返回 10-15 道题
- [ ] 未完成课时无法开始测评（403）
- [ ] 进度保存/恢复正常
- [ ] 签名验证有效
- [ ] 统一提交判分正确
- [ ] 通过后解锁下一单元
- [ ] 不通过可立即重考
- [ ] 错题写入 SRS

### 测试不通过处理

- 发现问题 → 修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞

## 执行结果报告

结果文件路径: `/tasks/result/05-course-assessment/T05-006-api-unit-test.md`

## 自检重点

- [ ] URL 使用 kebab-case
- [ ] 统一返回格式 `{code, message, data}`
- [ ] 通过门槛 70 分（hardcode 常量或配置化）
- [ ] 不通过无冷却时间（区别于级别综合考核）
- [ ] HMAC 进度签名正确使用
- [ ] 答案数量校验（必须全部完成才能提交）
