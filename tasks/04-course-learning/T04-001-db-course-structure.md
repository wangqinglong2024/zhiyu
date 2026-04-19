# T04-001: 数据库 Schema — 课程结构

> 分类: 04-系统课程-学习 (Course Learning)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 4

## 需求摘要

为课程系统创建核心三级层级数据表：`levels`、`units`、`lessons`，支撑 Level → Unit → Lesson 的完整课程结构。每张表需支持多语言（中/英/越）字段、与 course 定义文件中 12 级课程的数据映射、完善的索引策略和 RLS 行级安全策略。本任务是课程模块所有后续任务的数据基础。

## 相关上下文

- 产品需求: `product/apps/03-course-learning/07-data-nonfunctional.md` §一（数据流向）
- 产品需求: `product/apps/03-course-learning/00-index.md`（功能总览）
- 产品需求: `product/apps/03-course-learning/04-level-detail.md`（Level 详情页 → 单元/课时结构）
- 产品需求: `product/apps/03-course-learning/03-paywall.md` §二.3（各 Level 数据：单元数/课时数/词汇量/成语数）
- 产品总纲: `product/00-product-overview.md` §五.1（课程购买规则：L1-L3 免费，L4-L12 $6）
- 内容参考: `course/00-index.md`（12 级结构总览 + HSK/CEFR 对标）
- 内容参考: `course/level-01.md` ~ `course/level-12.md`（各级详细内容定义）
- 设计规范: `grules/05-coding-standards.md` §四（Supabase 交互规范、Migration 规范）
- 环境配置: `grules/env.md`
- 关联任务: T02-014（全局框架数据库基础）→ 本任务 → T04-002, T04-003, T04-004, T04-005

## 技术方案

### 数据库设计

#### 表 1: `levels` — 课程等级

```sql
-- 课程等级表：12 个固定等级
CREATE TABLE public.levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level_number SMALLINT NOT NULL UNIQUE CHECK (level_number BETWEEN 1 AND 12),
  
  -- 多语言名称
  name_zh VARCHAR(50) NOT NULL,       -- 中文名称（如"识字启蒙"）
  name_en VARCHAR(100) NOT NULL,      -- 英文名称（如"First Steps"）
  name_vi VARCHAR(100) NOT NULL,      -- 越南语名称
  
  -- 多语言描述
  description_zh TEXT,
  description_en TEXT,
  description_vi TEXT,
  
  -- 对标信息
  hsk_level VARCHAR(20) NOT NULL,     -- HSK 等级（如"HSK 1"、"HSK 7-8"）
  cefr_level VARCHAR(10) NOT NULL,    -- CEFR 等级（如"A1"、"C1"）
  school_stage VARCHAR(50),           -- 对应学段（如"小学一年级上"）
  
  -- 课程数据指标（来自 course/ 定义）
  total_units SMALLINT NOT NULL DEFAULT 0,    -- 单元总数
  lessons_per_unit SMALLINT NOT NULL DEFAULT 5, -- 每单元课时数
  total_lessons SMALLINT NOT NULL DEFAULT 0,  -- 总课时数
  cumulative_vocab INTEGER NOT NULL DEFAULT 0, -- 累计词汇量
  cumulative_chars INTEGER NOT NULL DEFAULT 0, -- 累计识字量
  cumulative_idioms INTEGER NOT NULL DEFAULT 0,-- 累计成语数
  cumulative_poems INTEGER NOT NULL DEFAULT 0, -- 累计背诵古诗数
  estimated_hours SMALLINT NOT NULL DEFAULT 30,-- 预估学时
  
  -- 定价
  is_free BOOLEAN NOT NULL DEFAULT false,     -- L1-L3 为 true
  price_usd DECIMAL(5,2) NOT NULL DEFAULT 6.00, -- 美元价格
  coin_price INTEGER NOT NULL DEFAULT 600,    -- 知语币价格
  
  -- 排序与展示
  sort_order SMALLINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_levels_number ON public.levels (level_number);
CREATE INDEX idx_levels_active ON public.levels (is_active) WHERE is_active = true;
```

#### 表 2: `units` — 学习单元

```sql
-- 学习单元表：每个 Level 包含 8-12 个单元
CREATE TABLE public.units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id UUID NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  unit_number SMALLINT NOT NULL,       -- 单元序号（Level 内从 1 开始）
  
  -- 多语言名称
  name_zh VARCHAR(100) NOT NULL,
  name_en VARCHAR(200) NOT NULL,
  name_vi VARCHAR(200) NOT NULL,
  
  -- 多语言描述
  description_zh TEXT,
  description_en TEXT,
  description_vi TEXT,
  
  -- 单元元数据
  total_lessons SMALLINT NOT NULL DEFAULT 5,
  
  sort_order SMALLINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE (level_id, unit_number)
);

-- 索引
CREATE INDEX idx_units_level ON public.units (level_id);
CREATE INDEX idx_units_level_order ON public.units (level_id, sort_order);
```

#### 表 3: `lessons` — 课时

```sql
-- 课时表：每个 Unit 包含 5-6 个课时
CREATE TABLE public.lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  lesson_number SMALLINT NOT NULL,     -- 课时序号（Unit 内从 1 开始）
  
  -- 多语言标题
  title_zh VARCHAR(200) NOT NULL,
  title_en VARCHAR(300) NOT NULL,
  title_vi VARCHAR(300) NOT NULL,
  
  -- 教学内容（JSON 结构，支持多语言渲染）
  content JSONB NOT NULL DEFAULT '{}',
  -- content 结构示例:
  -- {
  --   "sections": [
  --     {
  --       "type": "text",
  --       "pinyin": "...",
  --       "zh": "...",
  --       "en": "...",
  --       "vi": "...",
  --       "audio_url": "..."
  --     }
  --   ]
  -- }
  
  -- 重点词汇（JSONB 数组）
  key_vocabulary JSONB NOT NULL DEFAULT '[]',
  -- 结构: [{ "word": "阳台", "pinyin": "yángtái", "en": "balcony", "vi": "ban công", "example_zh": "...", "example_en": "...", "example_vi": "...", "audio_url": "..." }]
  
  -- 语法点（JSONB 数组）
  grammar_points JSONB NOT NULL DEFAULT '[]',
  -- 结构: [{ "title_zh": "...", "title_en": "...", "formula": "...", "explanation_zh": "...", "explanation_en": "...", "explanation_vi": "...", "correct_examples": [...], "wrong_examples": [...] }]
  
  -- 音频资源
  audio_url VARCHAR(500),              -- 课时整体音频 URL
  
  -- 元数据
  estimated_minutes SMALLINT DEFAULT 15, -- 预估学习时间（分钟）
  vocab_count SMALLINT DEFAULT 0,       -- 本课时词汇数
  
  sort_order SMALLINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE (unit_id, lesson_number)
);

-- 索引
CREATE INDEX idx_lessons_unit ON public.lessons (unit_id);
CREATE INDEX idx_lessons_level ON public.lessons (level_id);
CREATE INDEX idx_lessons_unit_order ON public.lessons (unit_id, sort_order);
```

#### RLS 策略

```sql
-- 启用 RLS
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- levels: 所有已登录用户可读
CREATE POLICY "levels_select_authenticated" ON public.levels
  FOR SELECT TO authenticated USING (is_active = true);

-- units: 所有已登录用户可读
CREATE POLICY "units_select_authenticated" ON public.units
  FOR SELECT TO authenticated USING (is_active = true);

-- lessons: 所有已登录用户可读（内容权限在 API 层控制）
CREATE POLICY "lessons_select_authenticated" ON public.lessons
  FOR SELECT TO authenticated USING (is_active = true);

-- 管理员写入策略（service_role 绕过 RLS，此处仅供参考）
-- INSERT/UPDATE/DELETE 通过 service_role 在后端执行
```

#### updated_at 自动更新触发器

```sql
-- 复用全局 updated_at 触发器函数（假设 T01 已创建）
CREATE TRIGGER set_levels_updated_at
  BEFORE UPDATE ON public.levels
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_units_updated_at
  BEFORE UPDATE ON public.units
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

## 范围（做什么）

- 创建 `levels` 表（12 级课程等级）
- 创建 `units` 表（学习单元）
- 创建 `lessons` 表（课时，含教学内容/词汇/语法 JSONB 字段）
- 为三张表创建完整索引
- 为三张表配置 RLS 策略（已登录用户可读）
- 创建 updated_at 自动更新触发器
- 生成 Migration 文件到 `supabase/migrations/`
- 后端 Zod Schema + TypeScript 类型定义
- 编写 12 级 Level 的种子数据 SQL（基于 `/course/` 定义文件）

## 边界（不做什么）

- 不创建学习进度相关表（T04-002）
- 不创建课程购买/权限表（T04-003）
- 不创建 SRS 复习队列表（T04-004）
- 不编写 API 端点（T04-005）
- 不填充 Unit / Lesson 教学内容数据（管理后台任务）
- 不实现前端页面

## 涉及文件

- 新建: `supabase/migrations/{timestamp}_create_course_structure_tables.sql`
- 新建: `backend/src/models/course.ts` — Zod Schema + TypeScript 类型
- 新建: `scripts/seed-course-levels.sql` — 12 级种子数据
- 修改: `backend/src/models/common.ts` — 添加通用分页/排序类型（如尚未定义）

## 依赖

- 前置: T02-014（全局框架数据库基础 — Supabase 初始化 + handle_updated_at 函数）
- 后续: T04-002（学习进度表）、T04-003（课程购买表）、T04-004（SRS 复习队列表）、T04-005（课程查询 API）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** Supabase 数据库已初始化 **WHEN** 执行 Migration SQL **THEN** `levels`、`units`、`lessons` 三张表创建成功，字段类型正确，外键约束生效
2. **GIVEN** 三张表已创建 **WHEN** 查询 `\d levels` **THEN** 所有列、索引、约束与设计一致
3. **GIVEN** RLS 已开启 **WHEN** 使用 anon key 查询 levels **THEN** 返回空（未认证无权限）
4. **GIVEN** RLS 已开启 **WHEN** 使用 authenticated 角色查询 levels **THEN** 返回 `is_active = true` 的记录
5. **GIVEN** 种子数据已执行 **WHEN** 查询 `SELECT * FROM levels ORDER BY level_number` **THEN** 返回 12 条记录，L1-L3 is_free=true，L4-L12 price_usd=6.00
6. **GIVEN** levels 表有数据 **WHEN** 更新某 level 记录 **THEN** `updated_at` 自动更新为当前时间
7. **GIVEN** 创建了 unit 记录 **WHEN** 尝试插入相同 `(level_id, unit_number)` **THEN** 唯一约束报错
8. **GIVEN** 创建了 lesson 记录 **WHEN** 删除其所属 unit **THEN** lesson 记录级联删除

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. 通过 MCP 或 `docker compose exec` 进入 Supabase 数据库执行 Migration SQL
4. 验证表结构：`\dt public.*` 确认三张表存在
5. 验证字段：`\d public.levels`、`\d public.units`、`\d public.lessons`
6. 执行种子数据 SQL
7. 验证种子数据：`SELECT level_number, name_zh, hsk_level, is_free, price_usd FROM levels ORDER BY level_number`
8. 验证 RLS：使用 anon/authenticated 角色分别查询
9. 验证外键级联：删除 level → 关联 units 和 lessons 级联删除
10. 验证 TypeScript 编译：`docker compose exec backend npm run build` 无错误

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] Migration SQL 执行无错误
- [ ] 三张表结构与设计一致
- [ ] RLS 策略正确（anon 无权，authenticated 可读）
- [ ] 种子数据 12 条 Level 正确
- [ ] 外键级联删除正常
- [ ] updated_at 触发器正常
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/04-course-learning/` 下创建同名结果文件

结果文件路径: `/tasks/result/04-course-learning/T04-001-db-course-structure.md`

## 自检重点

- [x] 安全: RLS 已开启，anon 无权访问
- [ ] 性能: 索引覆盖查询路径
- [ ] 类型同步: Zod Schema 与 DB 字段一一对应
- [ ] RLS: 三张表均已开启
- [ ] Migration: 文件已生成且可重复执行
