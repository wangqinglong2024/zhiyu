# T05-007: 后端 API — 级别综合考核 & 证书签发

> 分类: 05-系统课程-考核 (Course Assessment)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 7

## 需求摘要

实现级别综合考核（Level Exam）的完整 API 流程，含 4 个考核模块（听力、阅读、词汇语法、写作），总题量 30-50 道。双重通过条件：总分 ≥ 85 分且每个模块 ≥ 60 分。不通过需 24 小时冷却后重考。通过后自动签发电子证书（调用 T05-003 的证书表写入），支持成绩报告和各模块雷达图数据。写作模块由 Dify AI 辅助批改。

## 相关上下文

- 产品需求: `product/apps/04-course-assessment/04-level-exam.md` — 级别综合考核完整 PRD
- 产品需求: `product/apps/04-course-assessment/05-certificate.md` — 证书签发 PRD
- 产品需求: `product/apps/04-course-assessment/00-index.md` §三.3 — 综合考核规则
- 产品需求: `product/apps/04-course-assessment/06-data-nonfunctional.md` — 数据流和非功能需求
- API 规范: `grules/04-api-design.md` — RESTful 设计规约
- 编码规范: `grules/05-coding-standards.md` §三 — 后端编码规范
- 关联任务: T05-003（证书 DB）、T05-004（题型引擎）、T05-010（前端考核页面）

## 技术方案

### API 端点设计

#### 1. 检查考核资格

```
GET /api/v1/levels/:levelId/exam/eligibility
Authorization: Bearer {token}

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "eligible": true,              // 是否可以考试
    "reason": null,                // 不可考原因
    "lastAttemptAt": null,         // 上次考核时间
    "nextAvailableAt": null,       // 下次可考时间（24h 冷却后）
    "completedUnits": 4,           // 已完成单元数
    "totalUnits": 4,               // 总单元数
    "hasCertificate": false        // 是否已有该级别证书
  }
}
```

**逻辑**:
- 验证用户已通过该 Level 所有单元测评
- 检查 24h 冷却（上次不通过距今是否超 24h）
- 检查是否已持有该级别证书

#### 2. 开始综合考核

```
POST /api/v1/levels/:levelId/exam
Authorization: Bearer {token}

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "attemptId": "uuid",
    "modules": [
      {
        "module": "listening",
        "moduleName": { "zh": "听力", "en": "Listening" },
        "questions": RenderedQuestion[],
        "count": 10,
        "passingScore": 60
      },
      {
        "module": "reading",
        "moduleName": { "zh": "阅读", "en": "Reading" },
        "questions": RenderedQuestion[],
        "count": 10,
        "passingScore": 60
      },
      {
        "module": "vocabulary_grammar",
        "moduleName": { "zh": "词汇语法", "en": "Vocabulary & Grammar" },
        "questions": RenderedQuestion[],
        "count": 10,
        "passingScore": 60
      },
      {
        "module": "writing",
        "moduleName": { "zh": "写作", "en": "Writing" },
        "questions": RenderedQuestion[],
        "count": 5,
        "passingScore": 60
      }
    ],
    "totalCount": 35,
    "passingScore": 85,
    "timeLimit": null             // P1 阶段无时间限制
  }
}
```

**逻辑**:
- 调用 eligibility 逻辑校验资格
- 调用 QuestionEngine 按 4 个 module 分别抽题
- 创建 quiz_attempts（assessment_type='level_exam'）
- 冻结题目快照

#### 3. 保存/恢复进度

```
PUT  /api/v1/assessments/:attemptId/progress  -- 同 T05-006
GET  /api/v1/assessments/:attemptId/progress   -- 同 T05-006
```

复用 T05-006 的进度保存/恢复逻辑。

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
      "timeSpentMs": 20000
    },
    ...
  ]
}

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "totalScore": 88.5,
    "maxScore": 100.0,
    "passingScore": 85,
    "passed": true,
    "moduleResults": [
      {
        "module": "listening",
        "score": 90.0,
        "maxScore": 100.0,
        "passingScore": 60,
        "passed": true,
        "correctCount": 9,
        "totalCount": 10
      },
      {
        "module": "reading",
        "score": 80.0,
        "maxScore": 100.0,
        "passingScore": 60,
        "passed": true,
        "correctCount": 8,
        "totalCount": 10
      },
      {
        "module": "vocabulary_grammar",
        "score": 90.0,
        "maxScore": 100.0,
        "passingScore": 60,
        "passed": true,
        "correctCount": 9,
        "totalCount": 10
      },
      {
        "module": "writing",
        "score": 85.0,
        "maxScore": 100.0,
        "passingScore": 60,
        "passed": true,
        "correctCount": 4,
        "totalCount": 5
      }
    ],
    "results": [ ... ],            // 逐题判分结果
    "wrongQuestionIds": ["uuid-1", "uuid-2"],
    "srsItemsCreated": 2,
    "certificate": {               // 通过时签发证书
      "certificateNo": "ZY-L03-20250101-A1B2",
      "levelName": "Level 3",
      "hskLevel": "HSK 3",
      "cefrLevel": "CEFR B1",
      "issuedAt": "2025-01-01T00:00:00Z"
    },
    "nextRetakeAt": null           // 不通过时返回下次可考时间
  }
}
```

**逻辑**:
- 批量判分（客观题由 GradingEngine 自动判分）
- 写作题调用 Dify AI API 辅助批改（降级：AI 不可用时走规则判分）
- 按模块计算分数
- 双重条件判断：总分 ≥ 85 AND 每模块 ≥ 60
- 通过时：
  - 签发证书：调用 `generate_certificate_no()`，插入 `user_certificates` 表
  - 解锁下一 Level
  - 更新课程进度
- 不通过时：
  - 记录本次考核时间（用于 24h 冷却计算）
  - 错题写入 SRS

#### 5. 获取成绩报告（历史）

```
GET /api/v1/levels/:levelId/exam/reports
Authorization: Bearer {token}

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "attempts": [
      {
        "attemptId": "uuid",
        "totalScore": 88.5,
        "passed": true,
        "moduleScores": { ... },
        "createdAt": "2025-01-01T00:00:00Z",
        "certificateNo": "ZY-L03-..."
      }
    ]
  }
}
```

#### 6. 获取证书详情

```
GET /api/v1/certificates/:certificateNo
Authorization: Bearer {token}

Response 200:
{
  "code": 0,
  "message": "success",
  "data": {
    "certificateNo": "ZY-L03-20250101-A1B2",
    "userNickname": "张三",
    "levelNameZh": "第三级",
    "levelNameEn": "Level 3",
    "levelNumber": 3,
    "hskLevel": "HSK 3",
    "cefrLevel": "CEFR B1",
    "totalScore": 88.5,
    "moduleScores": { ... },
    "issuedAt": "2025-01-01T00:00:00Z"
  }
}
```

### Dify AI 写作批改对接

```typescript
// services/writing-grader.ts
async function gradeWriting(question: Question, userAnswer: string): Promise<GradingResult> {
  try {
    const response = await difyClient.createCompletion({
      inputs: {
        prompt: question.stemZh,
        answer: userAnswer,
        level: question.levelNumber,
        rubric: question.gradingRubric  // 评分标准
      },
      user: userId
    })
    return parseAiGradingResult(response)
  } catch {
    // AI 不可用时降级为关键词匹配
    return fallbackGrading(question, userAnswer)
  }
}
```

### 24h 冷却逻辑

```typescript
// 服务端 24h 冷却校验（使用 T05-002 的 can_retake_exam 函数）
const canRetake = await db.rpc('can_retake_exam', {
  p_user_id: userId,
  p_level_id: levelId
})
if (!canRetake) {
  throw new ForbiddenError('距上次考核不足 24 小时，请稍后再试')
}
```

## 范围（做什么）

- 实现 7 个 API 端点：资格检查、开始考核、保存进度、恢复进度、提交判分、成绩报告、证书详情
- 4 模块分别出题和分别计分
- 双重通过条件判断
- 24h 冷却期服务端校验
- 通过后自动签发证书（写入 user_certificates）
- Dify AI 写作批改对接（含降级方案）
- 不通过时错题写入 SRS
- 成绩报告和历史查询

## 边界（不做什么）

- 不做前端考核页面和证书展示（T05-010）
- 不做证书 Canvas 图片生成（T05-010）
- 不做证书分享功能（MVP 不做）
- 不做考试计时（P1 阶段无限时）

## 涉及文件

- 新建: `backend/src/routers/v1/assessment/level-exam.ts` — 综合考核路由
- 新建: `backend/src/routers/v1/assessment/certificates.ts` — 证书路由
- 新建: `backend/src/services/level-exam-service.ts` — 综合考核业务逻辑
- 新建: `backend/src/services/certificate-service.ts` — 证书签发服务
- 新建: `backend/src/services/writing-grader.ts` — 写作 AI 批改
- 新建: `backend/src/validators/level-exam-schema.ts` — 请求体 Zod Schema
- 修改: `backend/src/routers/v1/index.ts` — 注册新路由

## 依赖

- 前置: T05-001（题库 DB）、T05-002（考核记录 DB）、T05-003（证书 DB）、T05-004（题型引擎）
- 外部: T04-009（SRS 复习 API）、T04-006（课程进度服务）、Dify AI（写作批改）
- 后续: T05-010（前端考核和证书页面）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 用户已完成 Level 3 所有单元测评  
   **WHEN** 调用资格检查 API  
   **THEN** eligible=true

2. **GIVEN** 用户未完成 Level 3 所有单元  
   **WHEN** 调用资格检查 API  
   **THEN** eligible=false, reason="请先完成所有单元测评"

3. **GIVEN** 用户上次不通过距今不足 24h  
   **WHEN** 调用开始考核 API  
   **THEN** 返回 403，nextAvailableAt 显示冷却结束时间

4. **GIVEN** 用户有资格  
   **WHEN** 调用开始考核 API  
   **THEN** 返回 4 个模块的题目，总题量 30-50 道

5. **GIVEN** 用户完成所有模块答题  
   **WHEN** 提交判分  
   **THEN** 返回总分、各模块分数、通过状态

6. **GIVEN** 总分 88 且所有模块 ≥ 60  
   **WHEN** 查看提交结果  
   **THEN** passed=true，certificate 字段含证书信息

7. **GIVEN** 总分 90 但听力模块 55 分  
   **WHEN** 查看提交结果  
   **THEN** passed=false（某模块未达 60 分门槛）

8. **GIVEN** 总分 80  
   **WHEN** 查看提交结果  
   **THEN** passed=false（总分未达 85 分门槛），nextRetakeAt 显示 24h 后时间

9. **GIVEN** 用户通过考核获得证书  
   **WHEN** 调用 `GET /api/v1/certificates/{certificateNo}`  
   **THEN** 返回完整证书信息

10. **GIVEN** 用户已有 Level 3 证书  
    **WHEN** 重考 Level 3 并通过  
    **THEN** 不签发新证书（首次通过的证书保持有效）

11. **GIVEN** 写作题提交  
    **WHEN** Dify AI 可用  
    **THEN** 调用 AI 批改并返回详细反馈

12. **GIVEN** 写作题提交  
    **WHEN** Dify AI 不可用  
    **THEN** 降级为关键词匹配判分，不阻塞考核流程

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build`
2. 执行全部 Migration（T05-001/002/003）和种子数据
3. 模拟完成所有单元测评 → 调用资格检查 → 验证 eligible
4. 开始考核 → 验证 4 模块题目返回
5. 保存/恢复进度 → 验证数据完整
6. 提交答案（通过场景：总分 ≥ 85 且每模块 ≥ 60）→ 验证证书签发
7. 提交答案（不通过场景：总分不足/模块不足）→ 验证 24h 冷却
8. 测试 24h 内重考 → 验证 403
9. 查询成绩报告 → 验证历史记录
10. 查询证书详情 → 验证证书数据完整
11. 编译检查：`docker compose exec backend npx tsc --noEmit`

### 测试通过标准

- [ ] Docker 构建成功，TypeScript 零编译错误
- [ ] 资格检查逻辑正确
- [ ] 4 模块出题正确
- [ ] 双重通过条件判断正确
- [ ] 证书签发正确（编号格式、数据快照）
- [ ] 24h 冷却期生效
- [ ] 重考不覆盖首次证书
- [ ] 写作 AI 批改对接（或降级正常）
- [ ] 成绩报告查询正确
- [ ] 错题写入 SRS

### 测试不通过处理

- 发现问题 → 修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞

## 执行结果报告

结果文件路径: `/tasks/result/05-course-assessment/T05-007-api-level-exam.md`

## 自检重点

- [ ] 双重通过条件：总分 ≥ 85 AND 每模块 ≥ 60（两个都要满足）
- [ ] 24h 冷却是服务端校验（不依赖前端时间）
- [ ] 证书只签发一次（首次通过，重考通过不覆盖）
- [ ] 证书数据为快照（用户昵称、Level 名称冻结）
- [ ] 写作 AI 批改有降级方案
- [ ] 证书编号格式：ZY-L{XX}-{YYYYMMDD}-{XXXX}
- [ ] 模块分数独立计算（不是简单加权）
