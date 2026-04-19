# T04-004: 数据库 Schema — SRS 复习队列

> 分类: 04-系统课程-学习 (Course Learning)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 2

## 需求摘要

创建 SRS（间隔重复）复习队列表 `srs_review_items`，存储用户的待复习内容（答错题目、重点词汇、语法点），支持艾宾浩斯遗忘曲线间隔算法（1→2→4→7→15→30→毕业），间隔参数可配置。记录每次复习结果和间隔阶段，支持逾期回退、当日队列排序、每日复习量控制等业务规则。

## 相关上下文

- 产品需求: `product/apps/03-course-learning/06-srs-review.md`（SRS 复习系统完整 PRD）
- 产品需求: `product/apps/03-course-learning/06-srs-review.md` §二（复习队列逻辑 — 进入/不进入条件）
- 产品需求: `product/apps/03-course-learning/06-srs-review.md` §三（复习间隔规则）
- 产品需求: `product/apps/03-course-learning/06-srs-review.md` §五（每日复习量控制）
- 内容参考: `course/00-index.md` §四（间隔复习算法说明）
- 设计规范: `grules/05-coding-standards.md` §四（Supabase 规范）
- 关联任务: T04-002（学习进度表）→ 本任务 → T04-009（SRS API）

## 技术方案

### 数据库设计

#### 表 1: `srs_review_items` — 复习项

```sql
CREATE TABLE public.srs_review_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 复习项来源
  source_type VARCHAR(20) NOT NULL
    CHECK (source_type IN ('wrong_answer', 'vocabulary', 'grammar')),
  -- wrong_answer: 课时小测验/单元测评答错的题
  -- vocabulary:   课时重点词汇
  -- grammar:      课时语法点
  
  -- 来源关联
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  source_id VARCHAR(100),              -- 题目 ID / 词汇索引 / 语法点索引
  
  -- 复习内容（JSONB，存储卡片正反面内容）
  card_front JSONB NOT NULL,           -- 卡片正面（问题）
  card_back JSONB NOT NULL,            -- 卡片背面（答案）
  -- 词汇示例:
  -- card_front: { "type": "vocabulary", "word": "阳台", "pinyin": "yángtái" }
  -- card_back:  { "en": "balcony", "vi": "ban công", "example": "我家的阳台能看到大海。", "audio_url": "..." }
  -- 错题示例:
  -- card_front: { "type": "wrong_answer", "question": "...", "options": [...] }
  -- card_back:  { "correct_answer": "B", "explanation": "..." }
  
  -- SRS 间隔算法状态
  interval_stage SMALLINT NOT NULL DEFAULT 0,
  -- 间隔阶段对应天数: [1, 2, 4, 7, 15, 30]
  -- stage 0 = 首次待复习（间隔 1 天）
  -- stage 1 = 间隔 2 天
  -- stage 2 = 间隔 4 天
  -- stage 3 = 间隔 7 天
  -- stage 4 = 间隔 15 天
  -- stage 5 = 间隔 30 天
  -- stage 6 = 毕业（graduated）
  
  -- 复习调度
  next_review_at TIMESTAMPTZ NOT NULL,  -- 下次复习时间
  last_reviewed_at TIMESTAMPTZ,         -- 上次复习时间
  
  -- 统计
  total_reviews INTEGER NOT NULL DEFAULT 0,
  correct_streak INTEGER NOT NULL DEFAULT 0,  -- 连续"记住了"次数
  wrong_streak INTEGER NOT NULL DEFAULT 0,    -- 连续"还没记住"次数
  total_correct INTEGER NOT NULL DEFAULT 0,
  total_wrong INTEGER NOT NULL DEFAULT 0,
  
  -- 状态
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'graduated', 'suspended')),
  -- active:     正常复习中
  -- graduated:  连续 6 次"记住了"，已毕业，不再出现
  -- suspended:  用户手动暂停（预留）
  
  graduated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
-- 查询当日待复习项（核心查询路径）
CREATE INDEX idx_sri_user_next_review 
  ON public.srs_review_items (user_id, next_review_at) 
  WHERE status = 'active';

-- 按来源查询
CREATE INDEX idx_sri_user_source 
  ON public.srs_review_items (user_id, source_type);

-- 按课时查询
CREATE INDEX idx_sri_lesson 
  ON public.srs_review_items (lesson_id) 
  WHERE lesson_id IS NOT NULL;

-- 毕业项查询
CREATE INDEX idx_sri_graduated 
  ON public.srs_review_items (user_id, graduated_at) 
  WHERE status = 'graduated';

-- 防重复添加（同一用户同一来源项不重复）
CREATE UNIQUE INDEX idx_sri_unique_source 
  ON public.srs_review_items (user_id, source_type, source_id) 
  WHERE status = 'active';
```

#### 表 2: `srs_review_logs` — 复习历史记录

```sql
CREATE TABLE public.srs_review_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_item_id UUID NOT NULL REFERENCES public.srs_review_items(id) ON DELETE CASCADE,
  
  -- 复习结果
  result VARCHAR(20) NOT NULL CHECK (result IN ('remembered', 'forgotten')),
  -- remembered: 用户点击"😊 记住了"
  -- forgotten:  用户点击"😅 还没记住"
  
  -- 复习时的状态快照
  interval_stage_before SMALLINT NOT NULL,
  interval_stage_after SMALLINT NOT NULL,
  
  -- 时间
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  response_time_ms INTEGER,            -- 用户思考时长（毫秒），可用于分析
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_srl_user ON public.srs_review_logs (user_id);
CREATE INDEX idx_srl_item ON public.srs_review_logs (review_item_id);
CREATE INDEX idx_srl_user_date ON public.srs_review_logs (user_id, reviewed_at DESC);
```

#### 配置表: `srs_config` — 间隔算法参数（可配置）

```sql
CREATE TABLE public.srs_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key VARCHAR(50) NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  description TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 插入默认配置
INSERT INTO public.srs_config (config_key, config_value, description) VALUES
('interval_days', '[1, 2, 4, 7, 15, 30]', '各阶段间隔天数序列'),
('graduation_streak', '6', '连续"记住了"多少次后毕业'),
('daily_max_reviews', '50', '每日最大复习卡片数'),
('overdue_reset_days', '7', '逾期超过多少天自动回退到第 1 阶段'),
('wrong_streak_repeat', '2', '连续"还没记住"多少次后当日队列末尾再出现');
```

#### RLS 策略

```sql
ALTER TABLE public.srs_review_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.srs_review_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.srs_config ENABLE ROW LEVEL SECURITY;

-- 用户只能操作自己的复习项
CREATE POLICY "sri_user_all" ON public.srs_review_items
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "srl_user_all" ON public.srs_review_logs
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SRS 配置：所有已登录用户可读（管理员通过 service_role 写入）
CREATE POLICY "config_select_authenticated" ON public.srs_config
  FOR SELECT TO authenticated USING (true);
```

#### 触发器

```sql
CREATE TRIGGER set_sri_updated_at BEFORE UPDATE ON public.srs_review_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_srs_config_updated_at BEFORE UPDATE ON public.srs_config
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

## 范围（做什么）

- 创建 `srs_review_items` 表（复习项，含间隔阶段/调度时间/统计）
- 创建 `srs_review_logs` 表（复习历史记录）
- 创建 `srs_config` 表（可配置间隔算法参数）
- 插入默认 SRS 配置数据
- 配置 RLS 策略
- 创建索引（重点：当日待复习项查询 + 防重复唯一索引）
- 生成 Migration 文件
- 后端 Zod Schema + TypeScript 类型

## 边界（不做什么）

- 不实现 SRS 间隔算法业务逻辑（T04-009）
- 不实现复习卡片前端界面（T04-014）
- 不实现每日复习推送通知（横切关注点）

## 涉及文件

- 新建: `supabase/migrations/{timestamp}_create_srs_review_tables.sql`
- 新建: `backend/src/models/srs-review.ts` — Zod Schema + TypeScript 类型

## 依赖

- 前置: T04-002（学习进度表 — lesson_id 关联）
- 后续: T04-009（SRS 复习 API）、T04-014（SRS 复习前端）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 学习进度表已存在 **WHEN** 执行 Migration **THEN** 三张 SRS 表创建成功
2. **GIVEN** SRS 配置表 **WHEN** 查询默认配置 **THEN** 返回 5 条配置记录，interval_days 为 `[1,2,4,7,15,30]`
3. **GIVEN** 用户添加词汇复习项 **WHEN** `next_review_at = now() + 1 day`、`interval_stage = 0` **THEN** 插入成功
4. **GIVEN** 同一用户同一 `(source_type, source_id)` 已有 active 复习项 **WHEN** 尝试重复添加 **THEN** 唯一索引阻止
5. **GIVEN** 该复习项已毕业（status=graduated） **WHEN** 重新添加同一来源的 active 复习项 **THEN** 成功（条件唯一索引只约束 active 状态）
6. **GIVEN** RLS 已开启 **WHEN** 用户 A 查询复习项 **THEN** 只返回自己的数据
7. **GIVEN** 复习记录写入 `srs_review_logs` **WHEN** 查询某复习项的历史 **THEN** 正确返回所有复习记录
8. **GIVEN** 删除复习项 **WHEN** 检查 `srs_review_logs` **THEN** 关联日志级联删除

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build`
2. 执行 Migration SQL
3. 验证三张表结构
4. 验证默认配置数据
5. 验证唯一索引（防重复添加）
6. 验证 RLS 用户隔离
7. 验证级联删除
8. TypeScript 编译检查

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功
- [ ] 三张 SRS 表结构正确
- [ ] 默认配置数据正确
- [ ] 唯一索引防重复正常
- [ ] RLS 用户隔离正确
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞

## 执行结果报告

结果文件路径: `/tasks/result/04-course-learning/T04-004-db-srs-review.md`

## 自检重点

- [ ] 安全: RLS 用户隔离
- [ ] 性能: next_review_at 索引支撑每日查询
- [ ] 性能: 防重复唯一索引
- [ ] 类型同步: Zod Schema 与 DB 一致
- [ ] 可配置: SRS 参数通过 srs_config 表管理
