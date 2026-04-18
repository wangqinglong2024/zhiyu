# T05-004: 后端 API — 题型引擎

> 分类: 05-系统课程-考核 (Course Assessment)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 8

## 需求摘要

构建服务端题型引擎，负责根据考核层级、知识点范围和难度分布从题库中随机抽取题目，并将题目数据格式化为前端可直接渲染的结构。引擎必须在服务端完成出题（防作弊），客户端只负责渲染和提交答案。支持 7 种题型的出题逻辑，包括选项随机排序、听力音频打包、阅读材料关联等。同时实现通用判分引擎，根据题型自动校验答案并计分。

## 相关上下文

- 产品需求: `product/apps/04-course-assessment/00-index.md` §三 — 三级考核的题目数量/难度规则
- 产品需求: `product/apps/04-course-assessment/01-question-types.md` — 7 种题型交互和校验规则
- 产品需求: `product/apps/04-course-assessment/06-data-nonfunctional.md` §二.3 — 防作弊措施
- API 规范: `grules/04-api-design.md` — RESTful API 设计规约
- 编码规范: `grules/05-coding-standards.md` §三 — 后端编码规范
- 关联任务: T05-001（题库表）→ T05-005/006/007（各层级 API）、T05-008（前端题型组件）

## 技术方案

### 分层架构

```
backend/src/
├── services/
│   ├── question-engine.ts       -- 题型引擎核心服务
│   └── grading-engine.ts        -- 判分引擎核心服务
├── repositories/
│   └── question-repo.ts         -- 题库数据访问层
├── models/
│   ├── question.ts              -- 题目类型（T05-001 已创建）
│   └── quiz-attempt.ts          -- 考核尝试类型（T05-002 已创建）
└── routers/v1/
    └── assessment/              -- 考核路由（T05-005/006/007 创建）
```

### 出题引擎（QuestionEngine）

```typescript
// services/question-engine.ts

interface QuestionPickConfig {
  levelId: string
  unitId?: string          // 单元测评时指定
  lessonId?: string        // 课时小测验时指定
  assessmentType: 'lesson_quiz' | 'unit_test' | 'level_exam'
  examModule?: 'listening' | 'reading' | 'vocabulary_grammar' | 'writing'
  count: number            // 抽取题目数量
  difficultyDistribution?: {  // 难度分布（百分比）
    easy: number            // 如 0.6
    medium: number          // 如 0.3
    hard: number            // 如 0.1
  }
  excludeQuestionIds?: string[]  // 排除已用题目 ID
}

interface RenderedQuestion {
  id: string
  questionType: QuestionType
  index: number            // 题目在本次考核中的序号
  stemZh: string
  stemPinyin?: string
  stemEn?: string
  stemVi?: string
  audioUrl?: string
  imageUrl?: string
  scoreValue: number

  // 选择题选项（已随机排序，不包含 is_correct 信息）
  options?: {
    id: string
    label: string          // A/B/C/D（重新标注）
    contentZh: string
    contentPinyin?: string
    contentEn?: string
    contentVi?: string
    imageUrl?: string
  }[]

  // 排序组句专用
  sentenceWords?: string[]  // 打乱的词语数组

  // 拼音标注专用
  targetChars?: string      // 待标注汉字

  // 填空专用
  blankSentence?: string    // 含空位标记的句子
  blankCount?: number       // 空位数量

  // 阅读理解专用
  readingPassage?: {
    titleZh: string
    titlePinyin?: string
    contentZh: string
    contentPinyin?: string
    contentEn?: string
    contentVi?: string
  }
}
```

### 判分引擎（GradingEngine）

```typescript
// services/grading-engine.ts

interface GradingResult {
  questionId: string
  isCorrect: boolean
  scoreEarned: number
  scoreMax: number
  correctAnswer: unknown     // 正确答案（用于前端展示解析）
  explanation?: {
    zh: string
    en?: string
    vi?: string
  }
  knowledgeTags: string[]    // 关联知识点（用于 SRS 和薄弱分析）
}

// 各题型判分策略
// 单选题: 选项 ID 完全匹配
// 多选题: 选项 ID 集合完全匹配（多选少选均为错）
// 拼音标注: 逐字比较，忽略大小写和前后空格
// 排序组句: 词语顺序完全匹配
// 填空: 逐空比较，支持同义词列表
// 听力选择: 同单选题
// 阅读理解: 同单选题
```

### 题库数据访问（QuestionRepo）

```typescript
// repositories/question-repo.ts

// 按条件随机抽取题目
// 使用 PostgreSQL 的 ORDER BY random() LIMIT n
// 对于大题库，使用 TABLESAMPLE 或预计算随机列优化性能
```

### API 端点（本任务仅设计，具体路由在 T05-005/006/007 创建）

| 端点 | 方法 | 用途 | 鉴权 |
|------|------|------|------|
| `POST /api/v1/assessments/generate` | POST | 生成考核题目（内部调用） | service_role |
| `POST /api/v1/assessments/grade` | POST | 批量判分（内部调用） | service_role |

### 防作弊设计

1. **服务端出题**：题目 ID 和正确答案只存在服务端，前端 RenderedQuestion 不含 correct_answer
2. **选项随机**：每次出题选项顺序随机打乱，同一题不同用户看到不同 ABCD 顺序
3. **题目快照**：出题时将题目 ID 列表冻结到 quiz_attempts.question_ids，防止答题过程中题库变更影响判分
4. **答题时间记录**：前端提交每题用时（time_spent_ms），服务端记录用于异常检测
5. **进度签名**：quiz_progress.data_signature 使用 HMAC-SHA256 签名，防止本地篡改

## 范围（做什么）

- 实现 `QuestionEngine` 服务（出题核心逻辑）
  - 按考核层级/知识点范围/难度分布抽题
  - 选项随机排序
  - 题目数据格式化为 RenderedQuestion
  - 排除已用题目（防重复）
- 实现 `GradingEngine` 服务（判分核心逻辑）
  - 7 种题型的答案校验策略
  - 计分和正确率计算
  - 返回解析和知识点标签
- 实现 `QuestionRepo` 数据访问层
  - 按条件查询题目
  - 随机抽取优化
- 创建题型相关的 Zod 验证 Schema（用户提交答案的验证）
- 实现进度数据 HMAC 签名/验签工具

## 边界（不做什么）

- 不写具体的考核层级 API 路由（T05-005/006/007）
- 不写前端题目渲染组件（T05-008）
- 不写 SRS 写入逻辑（T05-005 中调用 T04-004 的 SRS 接口）
- 不写 AI 批改逻辑（T05-007 中对接 Dify）

## 涉及文件

- 新建: `backend/src/services/question-engine.ts` — 出题引擎
- 新建: `backend/src/services/grading-engine.ts` — 判分引擎
- 新建: `backend/src/repositories/question-repo.ts` — 题库数据访问
- 新建: `backend/src/models/rendered-question.ts` — 渲染态题目类型
- 新建: `backend/src/models/grading-result.ts` — 判分结果类型
- 新建: `backend/src/utils/hmac-signer.ts` — HMAC 签名工具
- 修改: `backend/src/models/question.ts` — 补充出题相关类型
- 修改: `backend/src/models/quiz-attempt.ts` — 补充提交答案 Schema

## 依赖

- 前置: T05-001（题库 DB Schema）
- 后续: T05-005（课时小测验 API）、T05-006（单元测评 API）、T05-007（综合考核 API）、T05-008（前端题型组件）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 题库中有 Level 1 课时 1 的 20 道单选题（难度分布：easy 12 / medium 6 / hard 2）  
   **WHEN** 调用 QuestionEngine.generate({ lessonId, assessmentType: 'lesson_quiz', count: 5, difficultyDistribution: { easy: 0.6, medium: 0.3, hard: 0.1 } })  
   **THEN** 返回 5 道题，难度分布接近 60%/30%/10%，题目不重复

2. **GIVEN** 生成的 RenderedQuestion 返回给前端  
   **WHEN** 检查返回数据  
   **THEN** 不包含 correct_answer 字段、不包含 is_correct 字段

3. **GIVEN** 选择题有 4 个选项 A/B/C/D  
   **WHEN** 多次调用 generate 获取同一题  
   **THEN** 选项顺序不同（概率验证，10 次中至少有 1 次顺序不同）

4. **GIVEN** 用户提交单选题答案 { optionId: "uuid-a" }  
   **WHEN** 调用 GradingEngine.grade(questionId, userAnswer)  
   **THEN** 正确时返回 isCorrect=true, scoreEarned=满分；错误时返回 isCorrect=false, scoreEarned=0

5. **GIVEN** 用户提交拼音标注答案 { pinyins: ["tú", "shū", "guǎn"] }  
   **WHEN** 正确答案为 ["tú", "shū", "guǎn"]  
   **THEN** 判定正确，忽略大小写

6. **GIVEN** 用户提交排序组句答案 { order: [2, 0, 3, 1] }  
   **WHEN** 正确答案为 { order: [3, 0, 2, 1] }  
   **THEN** 判定错误

7. **GIVEN** 用户提交填空答案 { answers: ["在", "散步"] }  
   **WHEN** 正确答案为 { answers: [["在", "正在"], ["散步", "走路"]] }  
   **THEN** 两空均判定正确（匹配同义词列表）

8. **GIVEN** 进度数据 JSON 和 HMAC 密钥  
   **WHEN** 调用 hmacSign(data) 生成签名，然后调用 hmacVerify(data, signature)  
   **THEN** 验证通过；篡改数据后验证失败

9. **GIVEN** TypeScript 编译  
   **WHEN** 执行 `npx tsc --noEmit`  
   **THEN** 零类型错误

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. 向题库插入测试种子数据（各题型各 10+ 道题）
4. 在容器内调用 QuestionEngine 和 GradingEngine 的单元测试函数
5. 验证出题随机性、题目数量、难度分布
6. 验证 7 种题型的判分正确性
7. 验证防作弊设计（返回数据不含正确答案）
8. 编译检查：`docker compose exec backend npx tsc --noEmit`

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功
- [ ] 出题引擎：各题型均可正确抽取和格式化
- [ ] 出题引擎：选项随机排序生效
- [ ] 出题引擎：返回数据不泄露正确答案
- [ ] 判分引擎：7 种题型判分逻辑全部正确
- [ ] 判分引擎：同义词/大小写/空格容错正确
- [ ] HMAC 签名/验签功能正常
- [ ] 防作弊：题目快照冻结正确

### 测试不通过处理

- 发现问题 → 修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞

## 执行结果报告

结果文件路径: `/tasks/result/05-course-assessment/T05-004-api-question-engine.md`

## 自检重点

- [ ] 服务端出题，前端不暴露正确答案
- [ ] 选项随机排序
- [ ] 7 种题型判分策略完整
- [ ] 填空题同义词匹配
- [ ] 拼音标注忽略大小写
- [ ] HMAC 签名使用安全的密钥管理（从环境变量读取）
- [ ] 无 N+1 查询（抽题用批量查询）
- [ ] 随机抽题性能可接受（大题库场景）
