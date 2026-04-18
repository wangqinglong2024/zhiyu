# T12-003: 后端 API — 题库管理 (Question Bank Management API)

> 分类: 12-管理后台-内容管理 (Admin Content Management)
> 状态: 📋 待开发
> 复杂度: L(大)
> 预估文件数: 10+

## 需求摘要

实现独立于课程 Lesson 的**评测题库**管理 API 和**考核配置**管理 API。评测题库用于三级考核体系（课时小测验 / 单元阶段测评 / 级别综合考核），题目与课程练习题分开管理。考核配置允许运营人员调整每级考核的题量、通过分数、重考间隔等参数。支持 7 种题型、按 Level/层级/题型/难度筛选、批量导入（CSV/Excel）。

## 相关上下文

- 产品需求: `product/admin/02-admin-content/02-course-management.md` §六（评测题目管理）+ §七（考核配置）
- 数据模型: `product/admin/02-admin-content/04-data-nonfunctional.md`
- 课程体系: `course/00-index.md` §四 — 三级考核体系
- API 规约: `grules/04-api-design.md`
- 编码规范: `grules/05-coding-standards.md`
- 关联任务: T05-001（评测数据库表）、T11-003（管理员鉴权）、T12-002（课程题目 Schema 复用）

## 技术方案

### 数据库表结构（引用 T05-001 已创建的表）

```sql
-- assessment_questions 表（独立评测题库）
CREATE TABLE assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID REFERENCES levels(id),
  assessment_tier TEXT NOT NULL,            -- quiz | unit_test | level_exam
  question_type TEXT NOT NULL,              -- 7 种题型（同 questions 表）
  description_zh TEXT NOT NULL,
  description_en TEXT NOT NULL,
  description_vi TEXT NOT NULL,
  difficulty INT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  knowledge_tags TEXT[] DEFAULT '{}',
  type_config JSONB NOT NULL,              -- 题型专有配置（结构同课程题目）
  explanation_zh TEXT,
  explanation_en TEXT,
  explanation_vi TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- assessment_config 表（考核配置）
CREATE TABLE assessment_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier TEXT NOT NULL UNIQUE,                -- quiz | unit_test | level_exam
  question_count_min INT NOT NULL,
  question_count_max INT NOT NULL,
  question_count_default INT NOT NULL,
  passing_score INT,                        -- null 表示无通过门槛（quiz）
  min_section_score INT,                    -- null 表示无单项最低分
  retry_interval_hours INT DEFAULT 0,       -- 0 表示无间隔
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 索引
CREATE INDEX idx_aq_level ON assessment_questions(level_id);
CREATE INDEX idx_aq_tier ON assessment_questions(assessment_tier);
CREATE INDEX idx_aq_type ON assessment_questions(question_type);
```

### 评测题型限制规则

```typescript
// 按评测层级限制可用题型
const TIER_ALLOWED_TYPES: Record<string, string[]> = {
  quiz: ['single_choice', 'multi_choice', 'sorting', 'fill_blank'],
  unit_test: ['single_choice', 'multi_choice', 'fill_blank', 'sorting', 'listening', 'matching'],
  level_exam: ['single_choice', 'multi_choice', 'fill_blank', 'sorting', 'matching', 'listening', 'reading_aloud'],
};
```

### API 端点设计

```
前缀: /api/v1/admin/assessment

# 评测题库
GET    /questions                    — 评测题目列表（分页 + 筛选）
GET    /questions/:id                — 评测题目详情
POST   /questions                    — 新建评测题目
PUT    /questions/:id                — 编辑评测题目
DELETE /questions/:id                — 删除评测题目
POST   /questions/import             — 批量导入（CSV/Excel）
GET    /questions/export             — 批量导出（CSV）

# 考核配置
GET    /config                       — 获取全部考核配置（3 条）
PUT    /config/:tier                 — 更新某级考核配置
POST   /config/reset                 — 重置为默认值
```

### Zod Schema 定义

```typescript
// backend/src/models/assessment.ts
import { z } from 'zod';

export const AssessmentTierEnum = z.enum(['quiz', 'unit_test', 'level_exam']);

export const AssessmentQuestionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  level_number: z.coerce.number().int().min(1).max(12).optional(),
  tier: AssessmentTierEnum.optional(),
  question_type: z.string().optional(),
  difficulty: z.coerce.number().int().min(1).max(5).optional(),
  keyword: z.string().optional(),
});

export const CreateAssessmentQuestionSchema = z.object({
  level_id: z.string().uuid(),
  assessment_tier: AssessmentTierEnum,
  question_type: z.string(),  // 动态校验是否在 TIER_ALLOWED_TYPES 内
  description_zh: z.string().min(1).max(500),
  description_en: z.string().min(1).max(1000),
  description_vi: z.string().min(1).max(1000),
  difficulty: z.number().int().min(1).max(5),
  knowledge_tags: z.array(z.string().max(15)).max(5).optional(),
  type_config: z.record(z.unknown()),
  explanation_zh: z.string().max(2000).optional(),
  explanation_en: z.string().max(2000).optional(),
  explanation_vi: z.string().max(2000).optional(),
});

export const UpdateAssessmentConfigSchema = z.object({
  question_count_default: z.number().int().min(1).max(50).optional(),
  passing_score: z.number().int().min(0).max(100).optional().nullable(),
  min_section_score: z.number().int().min(0).max(100).optional().nullable(),
  retry_interval_hours: z.number().int().min(0).max(168).optional(),
});
```

### 批量导入方案

```typescript
// 支持 CSV 和 Excel 格式导入
// 导入流程:
// 1. 前端上传文件 → 后端解析
// 2. 逐行校验（Zod Schema + 题型限制）
// 3. 返回校验结果预览（成功数 / 失败数 / 失败详情）
// 4. 前端确认后执行实际导入
// 5. 导入完成后返回成功/失败统计

interface ImportPreviewResponse {
  total_rows: number;
  valid_count: number;
  invalid_count: number;
  invalid_rows: { row: number; errors: string[] }[];
}

interface ImportResultResponse {
  imported_count: number;
  failed_count: number;
  failed_rows: { row: number; errors: string[] }[];
}
```

### Service 层

```typescript
// backend/src/services/assessment.service.ts
export class AssessmentService {
  // 评测题库
  async listQuestions(query: AssessmentQuestionListQuery): Promise<PaginatedResult<AssessmentQuestion>>;
  async getQuestion(id: string): Promise<AssessmentQuestion>;
  async createQuestion(data: CreateAssessmentQuestionInput, userId: string): Promise<AssessmentQuestion>;
  async updateQuestion(id: string, data: UpdateInput, userId: string): Promise<AssessmentQuestion>;
  async deleteQuestion(id: string, userId: string): Promise<void>;
  async importQuestions(fileBuffer: Buffer, fileType: 'csv' | 'xlsx', userId: string): Promise<ImportPreviewResponse>;
  async confirmImport(validRows: ParsedQuestion[], userId: string): Promise<ImportResultResponse>;
  async exportQuestions(query: Partial<AssessmentQuestionListQuery>): Promise<Buffer>;
  
  // 题型限制校验
  validateQuestionTypeForTier(tier: string, questionType: string): void;
  
  // 考核配置
  async getAllConfig(): Promise<AssessmentConfig[]>;
  async updateConfig(tier: string, data: UpdateConfigInput, userId: string): Promise<AssessmentConfig>;
  async resetConfig(userId: string): Promise<AssessmentConfig[]>;
}
```

## 范围（做什么）

- 创建 `assessment.ts` Zod Schema + TypeScript 类型
- 实现 AssessmentQuestionRepository 数据访问层
- 实现 AssessmentConfigRepository 数据访问层
- 实现 AssessmentService 业务逻辑（含题型限制校验、批量导入/导出）
- 实现 Controller + Router 注册
- 实现 CSV/Excel 文件解析和校验逻辑
- 实现导出为 CSV 功能
- 复用 T12-002 的 7 种题型 type_config Zod 校验
- 所有写操作记录 audit_log

## 边界（不做什么）

- 不实现课程练习题目 API（T12-002 已完成）
- 不实现文件上传到 Supabase Storage（仅解析上传的 CSV/Excel 文件内容）
- 不建表（T05-001 已完成）
- 不实现 C 端考核功能（属于 T05 模块）
- 不实现前端页面（T12-008 负责）

## 涉及文件

- 新建: `backend/src/models/assessment.ts` — Zod Schema + 类型
- 新建: `backend/src/repositories/assessment-question.repository.ts`
- 新建: `backend/src/repositories/assessment-config.repository.ts`
- 新建: `backend/src/services/assessment.service.ts`
- 新建: `backend/src/controllers/assessment.controller.ts`
- 新建: `backend/src/routers/v1/admin/assessment.router.ts`
- 新建: `backend/src/utils/csv-parser.ts` — CSV/Excel 解析工具
- 修改: `backend/src/routers/v1/admin/index.ts` — 注册评测路由

## 依赖

- 前置: T05-001（评测数据库表）、T11-003（管理员鉴权）、T12-002（题型 Schema 可复用）
- 后续: T12-008（题库管理前端页面）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 管理员已登录  
   **WHEN** 调用 `GET /api/v1/admin/assessment/questions?level_number=1&tier=quiz&page=1`  
   **THEN** 返回 Level 1 课时小测验题目列表，分页正确

2. **GIVEN** 管理员创建评测题目，tier=quiz，question_type=listening  
   **WHEN** 调用 `POST /api/v1/admin/assessment/questions`  
   **THEN** 返回错误「课时小测验不支持听力选择题」（listening 不在 quiz 允许范围内）

3. **GIVEN** 管理员创建评测题目，tier=level_exam，question_type=reading_aloud  
   **WHEN** 调用 `POST /api/v1/admin/assessment/questions` 提交完整数据  
   **THEN** 创建成功，返回题目详情，audit_log 记录

4. **GIVEN** 准备一个包含 10 行题目数据的 CSV 文件（其中 2 行格式错误）  
   **WHEN** 调用 `POST /api/v1/admin/assessment/questions/import` 上传文件  
   **THEN** 返回预览结果：valid_count=8, invalid_count=2, 含失败行详情

5. **GIVEN** 管理员查看考核配置  
   **WHEN** 调用 `GET /api/v1/admin/assessment/config`  
   **THEN** 返回 3 条配置（quiz/unit_test/level_exam），包含所有可配置参数

6. **GIVEN** 管理员更新级别综合考核配置  
   **WHEN** 调用 `PUT /api/v1/admin/assessment/config/level_exam` 设置 passing_score=90  
   **THEN** 配置更新成功，审计日志记录

7. **GIVEN** 管理员调用重置配置  
   **WHEN** 调用 `POST /api/v1/admin/assessment/config/reset`  
   **THEN** 所有配置恢复默认值（quiz: 3-5 题/无门槛，unit_test: 10-15 题/70 分，level_exam: 按级别/85 分/60 分单项/24h 间隔）

8. **GIVEN** 管理员更新 level_exam 配置，min_section_score=95, passing_score=85  
   **WHEN** 调用 `PUT /api/v1/admin/assessment/config/level_exam`  
   **THEN** 返回错误「单项最低分不得大于通过分数」

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` 构建并启动所有服务
2. 等待后端服务健康检查通过
3. 验证评测题目 CRUD 全流程
4. 验证题型限制规则（quiz/unit_test/level_exam 各自允许的题型）
5. 测试 CSV 导入（正常文件 + 含错误文件）
6. 测试考核配置 CRUD + 重置 + 校验规则
7. 验证审计日志完整

### 测试通过标准

- [ ] Docker 构建成功
- [ ] 评测题目 CRUD 全通过
- [ ] 3 种评测层级的题型限制校验正确
- [ ] CSV 导入预览 + 确认导入流程通过
- [ ] 考核配置 CRUD + 重置 + 校验均正确
- [ ] min_section_score ≤ passing_score 校验生效
- [ ] 筛选（Level/层级/题型/难度/关键字）全正确
- [ ] audit_log 记录完整

### 测试不通过处理

- 发现问题 → 修复 → 重新 `docker compose up -d --build` 全量构建 → 重新全量测试
- 同一问题 3 次修复失败 → 标记 🚫 阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/12-admin-content/` 下创建同名结果文件

结果文件路径: `/tasks/result/12-admin-content/T12-003-api-question-management.md`

## 自检重点

- [ ] 评测题目与课程题目使用不同的表但共享 type_config 校验逻辑
- [ ] TIER_ALLOWED_TYPES 映射表正确
- [ ] CSV/Excel 解析使用安全库，防止文件注入
- [ ] 导入文件大小限制（如 ≤ 10MB）
- [ ] 考核配置只有 3 条固定记录，使用 upsert 而非 insert
- [ ] 默认值在数据库种子文件或服务层硬编码
- [ ] 所有写操作记录 audit_log
