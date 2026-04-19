# T04-002: 数据库 Schema — 学习进度

> 分类: 04-系统课程-学习 (Course Learning)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 3

## 需求摘要

创建学习进度跟踪表 `user_course_progress`（Level 级进度）和 `user_lesson_progress`（课时级进度），支持断点续学、学习状态机流转、自动保存滚动位置/已查看词汇等细粒度进度信息。进度精确到每个 Lesson，是课程学习页面、Level 地图、单元列表展示进度的数据基础。

## 相关上下文

- 产品需求: `product/apps/03-course-learning/01-course-homepage.md` §三（Level 地图 5 种状态）
- 产品需求: `product/apps/03-course-learning/04-level-detail.md` §三（单元 4 种状态 + 课时状态）
- 产品需求: `product/apps/03-course-learning/05-lesson-page.md` §七（学习进度自动保存）
- 产品需求: `product/apps/03-course-learning/07-data-nonfunctional.md` §一.2（学习进度数据流）
- 设计规范: `grules/05-coding-standards.md` §四（Supabase 交互规范）
- 关联任务: T04-001（课程结构表）→ 本任务 → T04-004（SRS 表）、T04-006（进度 API）

## 技术方案

### 数据库设计

#### 表 1: `user_course_progress` — 用户课程进度（Level 级）

```sql
CREATE TABLE public.user_course_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  
  -- 状态机（5 种状态对应 Level 地图）
  status VARCHAR(20) NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed')),
  -- not_started: 已解锁但未开始（地图状态 ⚪ 或 🔵）
  -- in_progress: 进行中（地图状态 🟢）
  -- completed:   已完成综合考核（地图状态 ✅）
  
  -- 进度统计
  completed_lessons INTEGER NOT NULL DEFAULT 0,
  total_lessons INTEGER NOT NULL DEFAULT 0,
  progress_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  
  -- 入学测试相关
  placement_recommended BOOLEAN NOT NULL DEFAULT false, -- 入学测试推荐的起始 Level
  
  -- 时间戳
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_studied_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE (user_id, level_id)
);

-- 索引
CREATE INDEX idx_ucp_user ON public.user_course_progress (user_id);
CREATE INDEX idx_ucp_user_status ON public.user_course_progress (user_id, status);
CREATE INDEX idx_ucp_user_level ON public.user_course_progress (user_id, level_id);
```

#### 表 2: `user_lesson_progress` — 用户课时进度

```sql
CREATE TABLE public.user_lesson_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  
  -- 课时学习状态
  status VARCHAR(20) NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'content_done', 'completed')),
  -- not_started:  未开始
  -- in_progress:  学习中（有自动保存的进度）
  -- content_done: 内容已学完（可以开始测验）
  -- completed:    课时小测验已做（无门槛，做了即算完成）
  
  -- 断点续学数据（JSONB）
  resume_data JSONB DEFAULT '{}',
  -- 结构:
  -- {
  --   "scroll_position": 0.65,           -- 滚动百分比
  --   "viewed_vocab_ids": ["v1", "v2"],  -- 已查看的词汇卡片索引
  --   "played_audio_ids": ["a1", "a3"],  -- 已播放的音频段索引
  --   "last_section_index": 3            -- 最后查看的段落索引
  -- }
  
  -- 时间记录
  started_at TIMESTAMPTZ,
  content_done_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_studied_at TIMESTAMPTZ,
  total_study_seconds INTEGER NOT NULL DEFAULT 0, -- 累计学习时长（秒）
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE (user_id, lesson_id)
);

-- 索引
CREATE INDEX idx_ulp_user ON public.user_lesson_progress (user_id);
CREATE INDEX idx_ulp_user_unit ON public.user_lesson_progress (user_id, unit_id);
CREATE INDEX idx_ulp_user_level ON public.user_lesson_progress (user_id, level_id);
CREATE INDEX idx_ulp_user_status ON public.user_lesson_progress (user_id, status);
CREATE INDEX idx_ulp_last_studied ON public.user_lesson_progress (user_id, last_studied_at DESC);
```

#### 表 3: `user_unit_progress` — 用户单元进度（衍生视图/辅助表）

```sql
-- 单元进度作为物化视图或辅助表，方便查询
CREATE TABLE public.user_unit_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  
  -- 状态（4 种状态对应单元卡片）
  status VARCHAR(20) NOT NULL DEFAULT 'locked'
    CHECK (status IN ('locked', 'unlocked', 'in_progress', 'completed')),
  -- locked:      前一单元未通过测评
  -- unlocked:    已解锁未开始
  -- in_progress: 进行中
  -- completed:   全部课时完成 + 单元测评通过
  
  completed_lessons INTEGER NOT NULL DEFAULT 0,
  total_lessons INTEGER NOT NULL DEFAULT 0,
  
  -- 单元测评
  assessment_score SMALLINT,           -- 单元测评分数（NULL = 未测评）
  assessment_passed BOOLEAN NOT NULL DEFAULT false,
  
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE (user_id, unit_id)
);

-- 索引
CREATE INDEX idx_uup_user ON public.user_unit_progress (user_id);
CREATE INDEX idx_uup_user_level ON public.user_unit_progress (user_id, level_id);
CREATE INDEX idx_uup_user_status ON public.user_unit_progress (user_id, status);
```

#### RLS 策略

```sql
-- 启用 RLS
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_unit_progress ENABLE ROW LEVEL SECURITY;

-- 用户只能读写自己的进度
CREATE POLICY "ucp_user_all" ON public.user_course_progress
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ulp_user_all" ON public.user_lesson_progress
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "uup_user_all" ON public.user_unit_progress
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

#### 触发器

```sql
-- updated_at 自动更新
CREATE TRIGGER set_ucp_updated_at BEFORE UPDATE ON public.user_course_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_ulp_updated_at BEFORE UPDATE ON public.user_lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_uup_updated_at BEFORE UPDATE ON public.user_unit_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

### 状态机流转规则

#### Level 状态流转
```
not_started → in_progress  （用户开始学习第一个课时）
in_progress → completed    （用户通过综合考核）
```

#### Unit 状态流转
```
locked     → unlocked     （前一单元测评通过；或为 Level 第一个单元）
unlocked   → in_progress  （用户开始学习第一个课时）
in_progress → completed   （全部课时完成 + 单元测评 ≥70 分）
```

#### Lesson 状态流转
```
not_started  → in_progress  （用户首次打开课时页面）
in_progress  → content_done （用户滚动到底部/标记学完）
content_done → completed    （课时小测验已做）
```

## 范围（做什么）

- 创建 `user_course_progress` 表（Level 级进度）
- 创建 `user_lesson_progress` 表（课时级进度，含断点续学 JSONB）
- 创建 `user_unit_progress` 表（单元级进度，含测评分数）
- 为三张表配置 RLS（用户只能读写自己的数据）
- 创建索引和触发器
- 生成 Migration 文件
- 后端 Zod Schema + TypeScript 类型（含状态枚举）

## 边界（不做什么）

- 不创建 SRS 复习队列表（T04-004）
- 不创建入学测试结果表（T04-007）
- 不编写进度更新 API（T04-006）
- 不实现自动保存前端逻辑

## 涉及文件

- 新建: `supabase/migrations/{timestamp}_create_learning_progress_tables.sql`
- 新建: `backend/src/models/learning-progress.ts` — Zod Schema + TypeScript 类型
- 修改: `backend/src/models/course.ts` — 添加关联类型引用

## 依赖

- 前置: T04-001（levels/units/lessons 表）
- 后续: T04-004（SRS 复习队列表依赖课时进度）、T04-006（进度 API）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 课程结构表已存在 **WHEN** 执行 Migration SQL **THEN** 三张进度表创建成功，外键正确关联
2. **GIVEN** 进度表已创建 **WHEN** 使用 authenticated 用户插入自己的进度 **THEN** 插入成功
3. **GIVEN** 进度表已创建 **WHEN** 使用 authenticated 用户查询他人进度 **THEN** 返回空集（RLS 隔离）
4. **GIVEN** 用户有课时进度 **WHEN** 更新 `resume_data` JSONB 字段 **THEN** 断点续学数据正确保存和读取
5. **GIVEN** 用户课时状态为 `not_started` **WHEN** 尝试直接设为 `completed` **THEN** 虽然 DB 层不阻止，但 API 层（T04-006）会校验状态流转合法性
6. **GIVEN** `user_course_progress` 中用户+Level 唯一约束 **WHEN** 尝试插入重复 `(user_id, level_id)` **THEN** 唯一约束报错
7. **GIVEN** 删除用户（auth.users） **WHEN** 检查进度表 **THEN** 关联记录级联删除
8. **GIVEN** 更新进度记录 **WHEN** 查询 `updated_at` **THEN** 时间戳已自动更新

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. 执行 Migration SQL
4. 验证表结构：`\d public.user_course_progress`、`\d public.user_lesson_progress`、`\d public.user_unit_progress`
5. 验证 RLS：不同用户间数据隔离
6. 验证 JSONB：写入和读取 `resume_data`
7. 验证外键级联
8. TypeScript 编译检查

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] 三张进度表结构正确
- [ ] RLS 用户隔离正确
- [ ] JSONB 字段读写正常
- [ ] 外键级联删除正常
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/04-course-learning/T04-002-db-learning-progress.md`

## 自检重点

- [ ] 安全: RLS 确保用户数据隔离
- [ ] 性能: 索引覆盖 user_id 查询路径
- [ ] 类型同步: Zod Schema 状态枚举与 DB CHECK 约束一致
- [ ] RLS: 三张表均已开启，策略正确
- [ ] Migration: 文件已生成
