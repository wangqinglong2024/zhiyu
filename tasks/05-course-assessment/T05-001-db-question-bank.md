# T05-001: 数据库 Schema — 题库

> 分类: 05-系统课程-考核 (Course Assessment)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 3

## 需求摘要

为考核系统创建题库相关的数据库 Schema，包含 `questions` 表（存储所有题目）和 `question_options` 表（存储选择题选项）。需支持 7 种题型（单选/多选/听力选择/拼音标注/排序组句/填空/阅读理解）的枚举定义，以及难度标签、知识点关联、选项随机顺序等字段。所有表必须启用 RLS。

## 相关上下文

- 产品需求: `product/apps/04-course-assessment/00-index.md` §三 — 三级考核对照表
- 产品需求: `product/apps/04-course-assessment/01-question-types.md` — 7 种题型详细定义
- 产品需求: `product/apps/04-course-assessment/06-data-nonfunctional.md` §一 — 数据流向
- 编码规范: `grules/05-coding-standards.md` §四 — 数据库编码规范
- 环境配置: `grules/env.md` §3 — Supabase 配置
- 关联任务: T04-001（课程学习 DB Schema，前置）→ T05-002、T05-004（后续依赖本任务）

## 技术方案

### 数据库设计

#### 枚举类型

```sql
-- 题型枚举
CREATE TYPE question_type AS ENUM (
  'single_choice',       -- 单选题
  'multiple_choice',     -- 多选题
  'listening_choice',    -- 听力选择题
  'pinyin_annotation',   -- 拼音标注题
  'sentence_ordering',   -- 排序组句题
  'fill_in_blank',       -- 填空题
  'reading_comprehension' -- 阅读理解题
);

-- 题目难度枚举
CREATE TYPE question_difficulty AS ENUM (
  'easy',     -- 简单
  'medium',   -- 中等
  'hard'      -- 较难
);

-- 考核层级枚举（题目适用的考核范围）
CREATE TYPE assessment_level AS ENUM (
  'lesson_quiz',    -- 课时小测验
  'unit_test',      -- 单元测评
  'level_exam'      -- 级别综合考核
);

-- 考核模块枚举（级别综合考核的模块）
CREATE TYPE exam_module AS ENUM (
  'listening',        -- 听力
  'reading',          -- 阅读
  'vocabulary_grammar', -- 词汇语法
  'writing'           -- 书写
);
```

#### questions 表

```sql
CREATE TABLE questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 题目归属
  level_id        UUID NOT NULL REFERENCES levels(id),      -- 所属 Level
  unit_id         UUID REFERENCES units(id),                 -- 所属单元（可为空，表示 Level 级通用题）
  lesson_id       UUID REFERENCES lessons(id),               -- 所属课时（可为空，表示单元/Level 级题）

  -- 题目内容
  question_type   question_type NOT NULL,                    -- 题型
  difficulty      question_difficulty NOT NULL DEFAULT 'easy', -- 难度
  exam_module     exam_module,                               -- 综合考核模块（仅 level_exam 使用）
  assessment_levels assessment_level[] NOT NULL DEFAULT '{lesson_quiz}', -- 适用考核层级（数组，一题可适用多层级）

  -- 题干
  stem_zh         TEXT NOT NULL,                             -- 中文题干
  stem_pinyin     TEXT,                                      -- 题干拼音
  stem_en         TEXT,                                      -- 英文翻译
  stem_vi         TEXT,                                      -- 越南语翻译

  -- 附件（可选）
  audio_url       TEXT,                                      -- 音频 URL（听力题必填）
  image_url       TEXT,                                      -- 图片 URL（可选）

  -- 答案数据（JSON 存储灵活答案结构）
  correct_answer  JSONB NOT NULL,                            -- 正确答案（结构因题型而异）
  -- 单选/多选: {"option_ids": ["uuid1"]} / {"option_ids": ["uuid1", "uuid2"]}
  -- 拼音标注: {"pinyins": ["tú", "shū", "guǎn"]}
  -- 排序组句: {"order": [3, 0, 2, 1]}  -- 正确排列的词语索引
  -- 填空: {"answers": [["在", "正在"], ["玩", "玩耍"]]}  -- 每空多个可接受答案
  -- 阅读理解: 同单选题

  -- 解析
  explanation_zh  TEXT,                                      -- 中文解析
  explanation_en  TEXT,                                      -- 英文解析
  explanation_vi  TEXT,                                      -- 越南语解析

  -- 排序组句专用数据
  sentence_words  JSONB,                                     -- 打乱的词语数组 ["我", "在", "图书馆", "看书"]

  -- 拼音标注专用数据
  target_chars    TEXT,                                      -- 待标注汉字（如 "图书馆"）

  -- 填空专用
  blank_sentence  TEXT,                                      -- 含空位的句子（用 ______① 标记）

  -- 阅读理解专用
  reading_passage_id UUID REFERENCES reading_passages(id),   -- 关联阅读文章

  -- 知识点标签（用于 SRS 关联和薄弱知识点分析）
  knowledge_tags  TEXT[] DEFAULT '{}',                        -- 知识点标签数组

  -- 元数据
  is_active       BOOLEAN NOT NULL DEFAULT true,             -- 是否启用
  usage_count     INTEGER NOT NULL DEFAULT 0,                -- 被抽取使用次数
  correct_rate    DECIMAL(5,2) DEFAULT 0,                    -- 历史正确率
  score_value     INTEGER NOT NULL DEFAULT 5,                -- 单题分值

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_questions_level ON questions(level_id);
CREATE INDEX idx_questions_unit ON questions(unit_id);
CREATE INDEX idx_questions_lesson ON questions(lesson_id);
CREATE INDEX idx_questions_type ON questions(question_type);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_module ON questions(exam_module);
CREATE INDEX idx_questions_active ON questions(is_active) WHERE is_active = true;
CREATE INDEX idx_questions_assessment_levels ON questions USING GIN(assessment_levels);
CREATE INDEX idx_questions_knowledge_tags ON questions USING GIN(knowledge_tags);
```

#### question_options 表

```sql
CREATE TABLE question_options (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id     UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

  -- 选项内容
  label           CHAR(1) NOT NULL,                          -- A/B/C/D/E
  content_zh      TEXT NOT NULL,                             -- 中文选项内容
  content_pinyin  TEXT,                                      -- 拼音
  content_en      TEXT,                                      -- 英文翻译
  content_vi      TEXT,                                      -- 越南语翻译
  image_url       TEXT,                                      -- 图片选项（听力题/阅读题可用）

  is_correct      BOOLEAN NOT NULL DEFAULT false,            -- 是否为正确选项
  sort_order      INTEGER NOT NULL DEFAULT 0,                -- 默认排列顺序

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_question_options_question ON question_options(question_id);
```

#### reading_passages 表（阅读理解文章）

```sql
CREATE TABLE reading_passages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id        UUID NOT NULL REFERENCES levels(id),

  title_zh        TEXT NOT NULL,                             -- 文章标题
  title_pinyin    TEXT,
  content_zh      TEXT NOT NULL,                             -- 文章正文
  content_pinyin  TEXT,
  content_en      TEXT,                                      -- 英文翻译
  content_vi      TEXT,                                      -- 越南语翻译

  word_count      INTEGER NOT NULL DEFAULT 0,                -- 字数
  is_active       BOOLEAN NOT NULL DEFAULT true,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reading_passages_level ON reading_passages(level_id);
```

#### RLS 策略

```sql
-- 启用 RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_passages ENABLE ROW LEVEL SECURITY;

-- 题库对已登录用户只读（题目通过 API 抽取，不直接暴露）
-- 实际出题通过服务端 SERVICE_ROLE_KEY 操作，绕过 RLS
CREATE POLICY "questions_read_authenticated" ON questions
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "options_read_authenticated" ON question_options
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM questions WHERE questions.id = question_options.question_id AND questions.is_active = true)
  );

CREATE POLICY "passages_read_authenticated" ON reading_passages
  FOR SELECT TO authenticated USING (is_active = true);

-- 管理员可完全操作（通过 SERVICE_ROLE_KEY）
```

### Migration 文件

```
supabase/migrations/
└── {timestamp}_create_question_bank.sql
```

## 范围（做什么）

- 创建 `question_type`、`question_difficulty`、`assessment_level`、`exam_module` 枚举类型
- 创建 `questions` 表（含所有题型所需字段）
- 创建 `question_options` 表（选择题选项）
- 创建 `reading_passages` 表（阅读理解文章）
- 创建所有必要索引（level/unit/lesson/type/difficulty/module/GIN 索引）
- 启用 RLS 并创建访问策略
- 创建 `updated_at` 自动更新触发器
- 生成 Migration SQL 文件

## 边界（不做什么）

- 不写后端 API（T05-004）
- 不写出题逻辑（T05-004）
- 不导入种子数据（后续内容管理任务）
- 不创建 quiz_attempts 等考核记录表（T05-002）

## 涉及文件

- 新建: `supabase/migrations/{timestamp}_create_question_bank.sql`
- 新建: `backend/src/models/question.ts` — 题目相关 TypeScript 类型和 Zod Schema
- 新建: `backend/src/models/question-option.ts` — 选项相关类型

## 依赖

- 前置: T04-001（课程学习 DB Schema，提供 levels/units/lessons 表）
- 后续: T05-002（考核记录表）、T05-004（题型引擎 API）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** Migration 已执行  
   **WHEN** 查询 `\dt` 列出所有表  
   **THEN** `questions`、`question_options`、`reading_passages` 表存在

2. **GIVEN** 枚举类型已创建  
   **WHEN** 查询 `\dT+` 列出自定义类型  
   **THEN** `question_type`（7 种值）、`question_difficulty`（3 种值）、`assessment_level`（3 种值）、`exam_module`（4 种值）存在

3. **GIVEN** questions 表已创建  
   **WHEN** 插入一条单选题记录（含 stem_zh、question_type='single_choice'、correct_answer、level_id）  
   **THEN** 插入成功，`id` 和 `created_at` 自动生成

4. **GIVEN** question_options 表已创建  
   **WHEN** 为上述题目插入 4 个选项（A/B/C/D，其中 1 个 is_correct=true）  
   **THEN** 插入成功，外键约束正确

5. **GIVEN** 删除一条 question 记录  
   **WHEN** 查询该题目的 question_options  
   **THEN** 选项已被级联删除（ON DELETE CASCADE）

6. **GIVEN** RLS 已启用  
   **WHEN** 以 anon 角色查询 questions 表  
   **THEN** 返回空结果（匿名用户无权访问）

7. **GIVEN** RLS 已启用  
   **WHEN** 以 authenticated 角色查询 questions 表  
   **THEN** 仅返回 `is_active = true` 的记录

8. **GIVEN** GIN 索引已创建  
   **WHEN** 执行 `SELECT * FROM questions WHERE 'lesson_quiz' = ANY(assessment_levels)`  
   **THEN** 查询使用 GIN 索引，性能正常

9. **GIVEN** 后端类型文件已创建  
   **WHEN** TypeScript 编译 `backend/src/models/question.ts`  
   **THEN** 零类型错误，Zod Schema 与数据库字段完全对应

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. 通过 MCP 工具连接 Supabase 执行 Migration SQL
4. 验证表结构：`\d questions`、`\d question_options`、`\d reading_passages`
5. 验证枚举类型：`\dT+ question_type`
6. 插入测试数据并验证 CRUD
7. 验证 RLS 策略（分别用 anon / authenticated / service_role 测试）
8. 验证索引：`\di` 确认所有索引已创建
9. 编译检查：`docker compose exec backend npx tsc --noEmit`

### 测试通过标准

- [ ] Migration SQL 执行零错误
- [ ] 4 个枚举类型创建成功
- [ ] 3 个表结构正确（字段名、类型、约束）
- [ ] 外键约束生效（question_options → questions 级联删除）
- [ ] RLS 策略正确（anon 无权限、authenticated 只读活跃题目）
- [ ] GIN 索引可用于数组查询
- [ ] TypeScript 类型编译零错误
- [ ] Zod Schema 验证通过

### 测试不通过处理

- 发现问题 → 立即修复 SQL → 重新执行 Migration → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/05-course-assessment/` 下创建同名结果文件

结果文件路径: `/tasks/result/05-course-assessment/T05-001-db-question-bank.md`

## 自检重点

- [ ] 所有表名 snake_case 复数
- [ ] 所有字段名 snake_case
- [ ] UUID 主键使用 `gen_random_uuid()`
- [ ] RLS 启用且策略正确（零信任）
- [ ] 外键约束完整
- [ ] 索引覆盖常用查询路径
- [ ] `updated_at` 触发器已设置
- [ ] 无硬编码魔法数字
- [ ] TypeScript 类型与 DB Schema 完全同步
