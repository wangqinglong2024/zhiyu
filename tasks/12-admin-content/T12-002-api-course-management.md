# T12-002: 后端 API — 课程内容管理 (Course Content Management API)

> 分类: 12-管理后台-内容管理 (Admin Content Management)
> 状态: 📋 待开发
> 复杂度: L(大)
> 预估文件数: 15+

## 需求摘要

为管理后台课程模块实现完整的后端 API，支持 Level → Unit → Lesson 三级结构管理。包含三级结构的 CRUD、拖拽排序（sort_order 字段更新）、Lesson 内容编辑（讲解型/练习型/复习型）、课程题目 CRUD（7 种题型）、Level 上线/下线状态管理。所有接口需管理员鉴权 + 操作日志。

## 相关上下文

- 产品需求: `product/admin/02-admin-content/02-course-management.md` — 课程管理 PRD
- 数据模型: `product/admin/02-admin-content/04-data-nonfunctional.md` — 数据流向
- 课程体系: `course/00-index.md` — 12 级课程框架（Level→Unit→Lesson 定义）
- API 规约: `grules/04-api-design.md` — CRUD、嵌套资源路由
- 编码规范: `grules/05-coding-standards.md` §三 — 后端编码规范
- 全局架构: `grules/01-rules.md` — 技术栈
- 关联任务: T04-001（课程数据库表）、T11-003（管理员鉴权中间件）

## 技术方案

### 数据库表结构（引用 T04-001 已创建的表）

```sql
-- levels 表（12 个 Level 为固定种子数据）
CREATE TABLE levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_number INT UNIQUE NOT NULL,          -- 1-12
  name_zh TEXT NOT NULL,                     -- 中文名称
  name_en TEXT NOT NULL,                     -- 英文名称
  name_vi TEXT NOT NULL,                     -- 越南语名称
  stage TEXT NOT NULL,                       -- 阶段: beginner/basic/core/advanced
  grade TEXT,                                -- 对应年级
  hsk_level TEXT,                            -- HSK 等级
  cefr_level TEXT,                           -- CEFR 等级
  status TEXT DEFAULT 'developing',          -- developing | online | offline
  is_free BOOLEAN DEFAULT false,             -- L1-L3 免费
  price DECIMAL(10,2),                       -- 付费价格
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- units 表
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID REFERENCES levels(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_vi TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- lessons 表
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  title_zh TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_vi TEXT NOT NULL,
  lesson_type TEXT NOT NULL,                 -- lecture | practice | review
  knowledge_module TEXT NOT NULL,             -- M1-M9
  -- 讲解型专有字段
  content_zh TEXT,                           -- 教学正文（中文，含 ruby 拼音）
  content_en TEXT,                           -- 教学正文（英文）
  content_vi TEXT,                           -- 教学正文（越南语）
  example_sentences JSONB DEFAULT '[]',      -- 示例句列表
  audio_url TEXT,                            -- 课时朗读音频 URL
  images TEXT[] DEFAULT '{}',                -- 教学配图 URL 数组
  key_vocabulary JSONB DEFAULT '[]',         -- 重点词汇列表
  grammar_points JSONB DEFAULT '[]',         -- 语法点列表
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- questions 表（课程题目，绑定 Lesson）
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  question_type TEXT NOT NULL,               -- single_choice | multi_choice | fill_blank | sorting | matching | listening | reading_aloud
  description_zh TEXT NOT NULL,              -- 题干（中文）
  description_en TEXT NOT NULL,              -- 题干（英文）
  description_vi TEXT NOT NULL,              -- 题干（越南语）
  difficulty INT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  knowledge_tags TEXT[] DEFAULT '{}',
  type_config JSONB NOT NULL,               -- 题型专有配置（选项/答案/音频等）
  explanation_zh TEXT,                       -- 解析（中文）
  explanation_en TEXT,                       -- 解析（英文）
  explanation_vi TEXT,                       -- 解析（越南语）
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### API 端点设计

```
前缀: /api/v1/admin/courses

# Level 管理
GET    /levels                           — 获取全部 12 个 Level
PATCH  /levels/:levelId/status           — 切换 Level 状态（上线/下线）

# Unit 管理
GET    /levels/:levelId/units            — 获取某 Level 下全部 Unit
POST   /levels/:levelId/units            — 新建 Unit
PUT    /units/:unitId                    — 编辑 Unit
DELETE /units/:unitId                    — 删除 Unit（需无 Lesson）
PATCH  /levels/:levelId/units/reorder    — 批量更新 Unit 排序

# Lesson 管理
GET    /units/:unitId/lessons            — 获取某 Unit 下全部 Lesson
POST   /units/:unitId/lessons            — 新建 Lesson
GET    /lessons/:lessonId                — 获取 Lesson 详情（含完整内容）
PUT    /lessons/:lessonId                — 编辑 Lesson 内容
DELETE /lessons/:lessonId                — 删除 Lesson（级联删题目）
POST   /lessons/:lessonId/duplicate      — 复制 Lesson
PATCH  /units/:unitId/lessons/reorder    — 批量更新 Lesson 排序

# 课程题目管理
GET    /lessons/:lessonId/questions      — 获取某 Lesson 下全部题目
POST   /lessons/:lessonId/questions      — 新建题目
PUT    /questions/:questionId            — 编辑题目
DELETE /questions/:questionId            — 删除题目
PATCH  /lessons/:lessonId/questions/reorder — 批量更新题目排序
```

### Zod Schema 定义

```typescript
// backend/src/models/course.ts
import { z } from 'zod';

export const LevelStatusEnum = z.enum(['developing', 'online', 'offline']);

export const LessonTypeEnum = z.enum(['lecture', 'practice', 'review']);

export const KnowledgeModuleEnum = z.enum([
  'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9'
]);

export const QuestionTypeEnum = z.enum([
  'single_choice', 'multi_choice', 'fill_blank',
  'sorting', 'matching', 'listening', 'reading_aloud'
]);

// Unit
export const CreateUnitSchema = z.object({
  name_zh: z.string().min(1).max(30),
  name_en: z.string().min(1).max(60),
  name_vi: z.string().min(1).max(60),
});

// Lesson
export const CreateLessonSchema = z.object({
  title_zh: z.string().min(1).max(30),
  title_en: z.string().min(1).max(80),
  title_vi: z.string().min(1).max(80),
  lesson_type: LessonTypeEnum,
  knowledge_module: KnowledgeModuleEnum,
});

export const UpdateLessonSchema = z.object({
  title_zh: z.string().min(1).max(30).optional(),
  title_en: z.string().min(1).max(80).optional(),
  title_vi: z.string().min(1).max(80).optional(),
  knowledge_module: KnowledgeModuleEnum.optional(),
  content_zh: z.string().max(50000).optional(),
  content_en: z.string().max(50000).optional(),
  content_vi: z.string().max(50000).optional(),
  example_sentences: z.array(z.object({
    text_zh: z.string(),
    pinyin: z.string(),
    text_en: z.string(),
    text_vi: z.string(),
  })).optional(),
  audio_url: z.string().url().optional().nullable(),
  images: z.array(z.string().url()).max(5).optional(),
  key_vocabulary: z.array(z.object({
    hanzi: z.string(),
    pinyin: z.string(),
    meaning_en: z.string(),
    meaning_vi: z.string(),
    example_zh: z.string().optional(),
  })).optional(),
  grammar_points: z.array(z.object({
    name: z.string(),
    description_zh: z.string(),
    description_en: z.string(),
    description_vi: z.string(),
    examples: z.array(z.object({
      text_zh: z.string(),
      pinyin: z.string(),
      text_en: z.string(),
      text_vi: z.string(),
    })),
  })).optional(),
});

// Question（7 种题型统一入口，type_config 按题型差异化校验）
export const CreateQuestionSchema = z.object({
  question_type: QuestionTypeEnum,
  description_zh: z.string().min(1).max(500),
  description_en: z.string().min(1).max(1000),
  description_vi: z.string().min(1).max(1000),
  difficulty: z.number().int().min(1).max(5),
  knowledge_tags: z.array(z.string().max(15)).max(5).optional(),
  type_config: z.record(z.unknown()), // 按 question_type 动态校验
  explanation_zh: z.string().max(2000).optional(),
  explanation_en: z.string().max(2000).optional(),
  explanation_vi: z.string().max(2000).optional(),
});

// 排序
export const ReorderSchema = z.object({
  ordered_ids: z.array(z.string().uuid()).min(1),
});
```

### 题型 type_config 校验

```typescript
// 根据 question_type 动态校验 type_config
const SingleChoiceConfig = z.object({
  options: z.array(z.object({
    content_zh: z.string(), content_en: z.string(), content_vi: z.string(),
    is_correct: z.boolean(),
  })).min(2).max(6),
});

const MultiChoiceConfig = z.object({
  options: z.array(z.object({
    content_zh: z.string(), content_en: z.string(), content_vi: z.string(),
    is_correct: z.boolean(),
  })).min(2).max(6),
  // 校验 is_correct 至少 2 个为 true
});

const FillBlankConfig = z.object({
  text_zh: z.string(),  // 含 ____ 占位符
  text_en: z.string(),
  text_vi: z.string(),
  blanks: z.array(z.object({
    accepted_answers: z.array(z.string()).min(1),
    match_mode: z.enum(['exact', 'ignore_tone', 'pinyin_accepted']),
  })),
});

const SortingConfig = z.object({
  items: z.array(z.object({
    content_zh: z.string(), content_en: z.string(), content_vi: z.string(),
  })).min(2).max(8),
  // 录入顺序即正确顺序
});

const MatchingConfig = z.object({
  pairs: z.array(z.object({
    left_zh: z.string(), left_en: z.string(), left_vi: z.string(),
    right_zh: z.string(), right_en: z.string(), right_vi: z.string(),
  })).min(2).max(8),
});

const ListeningConfig = z.object({
  audio_url: z.string().url(),
  options: SingleChoiceConfig.shape.options,
});

const ReadingAloudConfig = z.object({
  text_zh: z.string().max(200),
  pinyin: z.string(),
  text_en: z.string(),
  text_vi: z.string(),
  audio_url: z.string().url(),
  scoring_dimensions: z.array(z.enum([
    'pronunciation', 'tone', 'fluency', 'rhythm'
  ])).min(1),
  reading_hint_zh: z.string().optional(),
  reading_hint_en: z.string().optional(),
  reading_hint_vi: z.string().optional(),
});
```

### Service 层核心逻辑

```typescript
// backend/src/services/course.service.ts
export class CourseService {
  // Level
  async getAllLevels(): Promise<LevelWithStats[]>;  // 包含 unit_count, lesson_count, question_count
  async updateLevelStatus(levelId: string, status: LevelStatus, userId: string): Promise<Level>;
  
  // Unit（含排序逻辑）
  async getUnitsByLevel(levelId: string): Promise<Unit[]>;
  async createUnit(levelId: string, data: CreateUnitInput, userId: string): Promise<Unit>;
  async updateUnit(unitId: string, data: UpdateUnitInput, userId: string): Promise<Unit>;
  async deleteUnit(unitId: string, userId: string): Promise<void>; // 校验无 Lesson
  async reorderUnits(levelId: string, orderedIds: string[], userId: string): Promise<void>;
  
  // Lesson
  async getLessonsByUnit(unitId: string): Promise<Lesson[]>;
  async getLessonDetail(lessonId: string): Promise<LessonDetail>;
  async createLesson(unitId: string, data: CreateLessonInput, userId: string): Promise<Lesson>;
  async updateLesson(lessonId: string, data: UpdateLessonInput, userId: string): Promise<Lesson>;
  async deleteLesson(lessonId: string, userId: string): Promise<void>;
  async duplicateLesson(lessonId: string, userId: string): Promise<Lesson>;
  async reorderLessons(unitId: string, orderedIds: string[], userId: string): Promise<void>;
  
  // Question
  async getQuestionsByLesson(lessonId: string): Promise<Question[]>;
  async createQuestion(lessonId: string, data: CreateQuestionInput, userId: string): Promise<Question>;
  async updateQuestion(questionId: string, data: UpdateQuestionInput, userId: string): Promise<Question>;
  async deleteQuestion(questionId: string, userId: string): Promise<void>;
  async reorderQuestions(lessonId: string, orderedIds: string[], userId: string): Promise<void>;
}
```

## 范围（做什么）

- 创建 `course.ts` Zod Schema + TypeScript 类型定义（含 7 种题型配置）
- 实现 Level/Unit/Lesson/Question 四层 Repository
- 实现 `CourseService` 业务逻辑（排序、删除校验、复制、状态管理）
- 实现 Controller + Router 注册
- 实现拖拽排序的后端接口（批量更新 sort_order）
- 实现 7 种题型的 type_config 动态 Zod 校验
- 实现 Lesson 复制功能（含题目一并复制）
- 记录所有写操作到 audit_log

## 边界（不做什么）

- 不实现评测题库管理（T12-003 负责）
- 不实现考核配置管理（T12-003 负责）
- 不实现文件上传（音频/图片 URL 由前端上传后回传）
- 不建表（T04-001 已完成）
- 不实现 C 端课程 API（属于 T04 模块）

## 涉及文件

- 新建: `backend/src/models/course.ts` — Zod Schema + 类型
- 新建: `backend/src/repositories/level.repository.ts`
- 新建: `backend/src/repositories/unit.repository.ts`
- 新建: `backend/src/repositories/lesson.repository.ts`
- 新建: `backend/src/repositories/question.repository.ts`
- 新建: `backend/src/services/course.service.ts`
- 新建: `backend/src/controllers/course.controller.ts`
- 新建: `backend/src/routers/v1/admin/course.router.ts`
- 修改: `backend/src/routers/v1/admin/index.ts` — 注册课程路由

## 依赖

- 前置: T04-001（课程数据库表）、T11-003（管理员鉴权中间件）
- 后续: T12-007（课程管理前端页面）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 管理员已登录  
   **WHEN** 调用 `GET /api/v1/admin/courses/levels`  
   **THEN** 返回 12 个 Level，每个包含 unit_count/lesson_count/question_count 统计

2. **GIVEN** 超级管理员已登录  
   **WHEN** 调用 `PATCH /api/v1/admin/courses/levels/:id/status` 设置 `{ status: 'online' }`  
   **THEN** Level 状态更新为 online，audit_log 记录操作

3. **GIVEN** Level 1 下已有 3 个 Unit  
   **WHEN** 调用 `PATCH /api/v1/admin/courses/levels/:levelId/units/reorder` 传入新顺序  
   **THEN** Unit 的 sort_order 按新顺序更新，返回时 Unit 编号自动重排

4. **GIVEN** Unit 1 下有 Lesson  
   **WHEN** 调用 `DELETE /api/v1/admin/courses/units/:unitId`  
   **THEN** 返回错误「请先删除该 Unit 下的所有 Lesson」，Unit 未被删除

5. **GIVEN** 已创建一个讲解型 Lesson  
   **WHEN** 调用 `PUT /api/v1/admin/courses/lessons/:id` 提交教学正文+示例句+词汇+语法点  
   **THEN** Lesson 内容完整更新，所有 JSONB 字段正确存储

6. **GIVEN** 已创建一个练习型 Lesson 且有 5 道题目  
   **WHEN** 调用 `POST /api/v1/admin/courses/lessons/:id/duplicate`  
   **THEN** 新 Lesson 标题加「(副本)」后缀，5 道题目全部复制，排序在列表末尾

7. **GIVEN** 调用 `POST /api/v1/admin/courses/lessons/:id/questions` 提交 single_choice 题型  
   **WHEN** type_config 中 options 仅 1 个  
   **THEN** Zod 校验失败，返回 400 错误「单选题至少需要 2 个选项」

8. **GIVEN** 调用 `POST /api/v1/admin/courses/lessons/:id/questions` 提交 listening 题型  
   **WHEN** type_config 中缺少 audio_url  
   **THEN** Zod 校验失败，返回 400 错误「听力选择题必须提供音频 URL」

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` 构建并启动所有服务
2. 等待后端服务健康检查通过
3. 使用管理员 JWT Token 依次验证：
   - Level 列表 + 统计数据
   - Unit CRUD + 拖拽排序
   - Lesson CRUD + 复制 + 排序
   - 7 种题型分别创建 + 编辑 + 删除
   - Level 上线/下线
4. 验证删除保护规则（有 Lesson 的 Unit 不可删）
5. 验证 Zod 校验各种非法输入
6. 检查 audit_log 表记录

### 测试通过标准

- [ ] Docker 构建成功，后端容器正常运行
- [ ] Level/Unit/Lesson/Question 四级 CRUD 全通过
- [ ] 拖拽排序（reorder）接口正确更新 sort_order
- [ ] 7 种题型 type_config 校验均正确
- [ ] Lesson 复制（含题目）功能正常
- [ ] 删除保护规则生效
- [ ] audit_log 记录完整

### 测试不通过处理

- 发现问题 → 修复 → 重新 `docker compose up -d --build` 全量构建 → 重新全量测试
- 同一问题 3 次修复失败 → 标记 🚫 阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/12-admin-content/` 下创建同名结果文件

结果文件路径: `/tasks/result/12-admin-content/T12-002-api-course-management.md`

## 自检重点

- [ ] 嵌套资源路由设计合理（levels/:id/units、units/:id/lessons 等）
- [ ] 排序接口接收 ordered_ids 数组，非单条 sort_order 更新
- [ ] 7 种题型 type_config Zod 动态校验完整
- [ ] Lesson 复制时题目 ID 全新生成，不复用原 ID
- [ ] Unit 删除前校验无 Lesson
- [ ] Level 统计数据通过子查询或聚合获取，非 N+1 查询
- [ ] 所有写操作记录 audit_log
- [ ] JSONB 字段（example_sentences/key_vocabulary/grammar_points）结构一致
