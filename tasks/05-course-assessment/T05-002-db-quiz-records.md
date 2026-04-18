# T05-002: 数据库 Schema — 考核记录

> 分类: 05-系统课程-考核 (Course Assessment)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 3

## 需求摘要

为三级考核体系创建考核记录相关的数据库 Schema。包含 `quiz_attempts`（考核尝试记录）、`quiz_answers`（逐题作答记录）、`quiz_progress`（答题进度保存）三张核心表，以及成绩统计相关的数据库函数。需支持课时小测验即时判分、单元测评统一批改、级别综合考核多模块评分等场景，并记录 24 小时重考间隔、防作弊可疑标记等业务字段。

## 相关上下文

- 产品需求: `product/apps/04-course-assessment/00-index.md` §三 — 三级考核规则
- 产品需求: `product/apps/04-course-assessment/02-lesson-quiz.md` — 课时小测验逻辑
- 产品需求: `product/apps/04-course-assessment/03-unit-test.md` — 单元测评逻辑
- 产品需求: `product/apps/04-course-assessment/04-level-exam.md` — 综合考核逻辑
- 产品需求: `product/apps/04-course-assessment/06-data-nonfunctional.md` §二.3 — 防作弊需求
- 编码规范: `grules/05-coding-standards.md` §四 — 数据库编码规范
- 关联任务: T05-001（题库 Schema，前置）→ T05-003（证书表）、T05-005/006/007（API 依赖）

## 技术方案

### 数据库设计

#### 考核状态枚举

```sql
-- 考核尝试状态
CREATE TYPE quiz_attempt_status AS ENUM (
  'in_progress',  -- 进行中（有保存进度）
  'submitted',    -- 已提交待判分
  'graded',       -- 已判分完成
  'expired'       -- 进度过期（超 24 小时未提交）
);
```

#### quiz_attempts 表（考核尝试记录）

```sql
CREATE TABLE quiz_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id),

  -- 考核类型与归属
  assessment_type assessment_level NOT NULL,                  -- lesson_quiz / unit_test / level_exam
  level_id        UUID NOT NULL REFERENCES levels(id),
  unit_id         UUID REFERENCES units(id),                  -- unit_test 时必填
  lesson_id       UUID REFERENCES lessons(id),                -- lesson_quiz 时必填

  -- 考核状态与进度
  status          quiz_attempt_status NOT NULL DEFAULT 'in_progress',
  total_questions INTEGER NOT NULL DEFAULT 0,                 -- 总题目数
  answered_count  INTEGER NOT NULL DEFAULT 0,                 -- 已作答题数
  current_index   INTEGER NOT NULL DEFAULT 0,                 -- 当前题目索引（恢复进度用）

  -- 题目快照（出题时冻结题目 ID 列表，防止答题过程中题库变更）
  question_ids    UUID[] NOT NULL DEFAULT '{}',               -- 本次考核的题目 ID 有序列表

  -- 级别综合考核专用：各模块题目分组
  module_groups   JSONB,                                      -- {"listening": ["q1","q2"], "reading": [...], ...}

  -- 成绩
  total_score     DECIMAL(5,2),                               -- 总分
  pass_score      DECIMAL(5,2),                               -- 通过线（70 或 85）
  is_passed       BOOLEAN,                                    -- 是否通过
  module_scores   JSONB,                                      -- 各模块分数 {"listening": 85, "reading": 90, ...}

  -- 时间
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),         -- 开始时间
  submitted_at    TIMESTAMPTZ,                                -- 提交时间
  graded_at       TIMESTAMPTZ,                                -- 判分完成时间
  elapsed_seconds INTEGER DEFAULT 0,                          -- 累计用时（秒）
  expires_at      TIMESTAMPTZ,                                -- 进度过期时间（started_at + 24h）

  -- 防作弊
  is_suspicious   BOOLEAN NOT NULL DEFAULT false,             -- 是否标记为可疑
  suspicious_reason TEXT,                                     -- 可疑原因

  -- 元数据
  is_retake       BOOLEAN NOT NULL DEFAULT false,             -- 是否为重考
  attempt_number  INTEGER NOT NULL DEFAULT 1,                 -- 第几次尝试

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_type ON quiz_attempts(assessment_type);
CREATE INDEX idx_quiz_attempts_level ON quiz_attempts(level_id);
CREATE INDEX idx_quiz_attempts_unit ON quiz_attempts(unit_id);
CREATE INDEX idx_quiz_attempts_lesson ON quiz_attempts(lesson_id);
CREATE INDEX idx_quiz_attempts_status ON quiz_attempts(status);
CREATE INDEX idx_quiz_attempts_user_level_type ON quiz_attempts(user_id, level_id, assessment_type);
-- 查询最近一次考核尝试（用于 24h 重考间隔检查）
CREATE INDEX idx_quiz_attempts_retake_check ON quiz_attempts(user_id, level_id, assessment_type, submitted_at DESC);
```

#### quiz_answers 表（逐题作答记录）

```sql
CREATE TABLE quiz_answers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id      UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id     UUID NOT NULL REFERENCES questions(id),

  -- 作答内容
  user_answer     JSONB NOT NULL,                             -- 用户答案（结构因题型而异）
  -- 单选: {"option_id": "uuid"}
  -- 多选: {"option_ids": ["uuid1", "uuid2"]}
  -- 拼音标注: {"pinyins": ["tú", "shū", "guǎn"]}
  -- 排序组句: {"order": [2, 0, 3, 1]}
  -- 填空: {"answers": ["在", "玩"]}
  -- 阅读理解: 同单选

  -- 判分结果
  is_correct      BOOLEAN,                                    -- 是否正确
  score_earned    DECIMAL(5,2) DEFAULT 0,                     -- 得分
  score_max       DECIMAL(5,2) NOT NULL,                      -- 满分

  -- 时间
  answered_at     TIMESTAMPTZ NOT NULL DEFAULT now(),         -- 作答时间
  time_spent_ms   INTEGER DEFAULT 0,                          -- 单题用时（毫秒，防作弊检测用）

  -- 知识点（冗余存储，便于薄弱知识点分析）
  knowledge_tags  TEXT[] DEFAULT '{}',

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_quiz_answers_attempt ON quiz_answers(attempt_id);
CREATE INDEX idx_quiz_answers_question ON quiz_answers(question_id);
CREATE INDEX idx_quiz_answers_incorrect ON quiz_answers(attempt_id) WHERE is_correct = false;
```

#### quiz_progress 表（答题进度保存 — 本地+服务端双写）

```sql
CREATE TABLE quiz_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  attempt_id      UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,

  -- 进度数据
  current_index   INTEGER NOT NULL DEFAULT 0,                 -- 当前题目位置
  answers_snapshot JSONB NOT NULL DEFAULT '{}',               -- 已答题目快照 {"question_id": user_answer}
  elapsed_seconds INTEGER NOT NULL DEFAULT 0,                 -- 已用时秒数
  active_module   TEXT,                                       -- 当前活跃模块（综合考核用）

  -- 签名校验（防篡改）
  data_signature  TEXT NOT NULL,                              -- 进度数据 HMAC 签名

  -- 过期管理
  expires_at      TIMESTAMPTZ NOT NULL,                       -- 过期时间（创建时间 + 24h）
  is_expired      BOOLEAN NOT NULL DEFAULT false,

  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 一个用户一个考核尝试只有一条进度记录
CREATE UNIQUE INDEX idx_quiz_progress_user_attempt ON quiz_progress(user_id, attempt_id);
```

#### 数据库函数

```sql
-- 计算单次考核的总分
CREATE OR REPLACE FUNCTION calculate_attempt_score(p_attempt_id UUID)
RETURNS TABLE(total_score DECIMAL, module_scores JSONB, is_passed BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_attempt quiz_attempts%ROWTYPE;
  v_total DECIMAL(5,2) := 0;
  v_modules JSONB := '{}';
  v_pass_score DECIMAL(5,2);
  v_module_min DECIMAL(5,2);
  v_all_modules_pass BOOLEAN := true;
BEGIN
  SELECT * INTO v_attempt FROM quiz_attempts WHERE id = p_attempt_id;

  -- 计算总分
  SELECT COALESCE(SUM(score_earned), 0) INTO v_total
  FROM quiz_answers WHERE attempt_id = p_attempt_id;

  -- 根据考核类型确定通过标准
  IF v_attempt.assessment_type = 'lesson_quiz' THEN
    -- 课时小测验无通过门槛
    RETURN QUERY SELECT v_total, NULL::JSONB, true;
    RETURN;
  ELSIF v_attempt.assessment_type = 'unit_test' THEN
    v_pass_score := 70;
    RETURN QUERY SELECT v_total, NULL::JSONB, (v_total >= v_pass_score);
    RETURN;
  ELSIF v_attempt.assessment_type = 'level_exam' THEN
    v_pass_score := 85;
    v_module_min := 60;

    -- 计算各模块分数（需按模块分组汇总）
    -- 具体实现依赖 module_groups 中的分组信息
    -- 此处返回各模块分数 JSON 和是否通过
    -- ... （详细实现在 T05-007 中完善）
    RETURN QUERY SELECT v_total, v_modules, (v_total >= v_pass_score AND v_all_modules_pass);
    RETURN;
  END IF;
END;
$$;

-- 检查是否可以重考（24 小时间隔）
CREATE OR REPLACE FUNCTION can_retake_exam(
  p_user_id UUID,
  p_level_id UUID
)
RETURNS TABLE(can_retake BOOLEAN, next_available_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_last_attempt quiz_attempts%ROWTYPE;
BEGIN
  -- 查询最近一次级别综合考核尝试
  SELECT * INTO v_last_attempt
  FROM quiz_attempts
  WHERE user_id = p_user_id
    AND level_id = p_level_id
    AND assessment_type = 'level_exam'
    AND status = 'graded'
    AND is_passed = false
  ORDER BY submitted_at DESC
  LIMIT 1;

  IF v_last_attempt.id IS NULL THEN
    -- 没有失败记录，可以考核
    RETURN QUERY SELECT true, NULL::TIMESTAMPTZ;
  ELSE
    -- 检查距上次失败是否超过 24 小时
    IF now() >= v_last_attempt.submitted_at + INTERVAL '24 hours' THEN
      RETURN QUERY SELECT true, NULL::TIMESTAMPTZ;
    ELSE
      RETURN QUERY SELECT false, v_last_attempt.submitted_at + INTERVAL '24 hours';
    END IF;
  END IF;
END;
$$;
```

#### RLS 策略

```sql
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_progress ENABLE ROW LEVEL SECURITY;

-- 用户只能查看/操作自己的考核记录
CREATE POLICY "quiz_attempts_user_own" ON quiz_attempts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "quiz_answers_user_own" ON quiz_answers
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM quiz_attempts WHERE quiz_attempts.id = quiz_answers.attempt_id AND quiz_attempts.user_id = auth.uid())
  );

CREATE POLICY "quiz_progress_user_own" ON quiz_progress
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## 范围（做什么）

- 创建 `quiz_attempt_status` 枚举类型
- 创建 `quiz_attempts` 表（考核尝试主记录）
- 创建 `quiz_answers` 表（逐题作答记录）
- 创建 `quiz_progress` 表（进度保存）
- 创建 `calculate_attempt_score` 数据库函数（计分骨架）
- 创建 `can_retake_exam` 数据库函数（24h 重考检查）
- 创建所有必要索引
- 启用 RLS 并创建用户隔离策略
- 创建 `updated_at` 自动更新触发器
- 生成 Migration SQL 文件
- 创建后端 TypeScript 类型和 Zod Schema

## 边界（不做什么）

- 不写后端 API（T05-005/006/007）
- 不写评分逻辑的完整实现（T05-004/007 中完善）
- 不创建证书表（T05-003）
- 不写前端页面（T05-009/010）

## 涉及文件

- 新建: `supabase/migrations/{timestamp}_create_quiz_records.sql`
- 新建: `backend/src/models/quiz-attempt.ts` — 考核尝试类型和 Zod Schema
- 新建: `backend/src/models/quiz-answer.ts` — 作答记录类型

## 依赖

- 前置: T05-001（题库表 questions/question_options）
- 后续: T05-003（证书表）、T05-005/006/007（后端 API）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** Migration 已执行  
   **WHEN** 查询 `\dt`  
   **THEN** `quiz_attempts`、`quiz_answers`、`quiz_progress` 三表存在

2. **GIVEN** quiz_attempts 表已创建  
   **WHEN** 插入一条课时小测验记录（assessment_type='lesson_quiz', user_id, level_id, lesson_id）  
   **THEN** 插入成功，状态默认为 'in_progress'，expires_at 为空

3. **GIVEN** quiz_answers 表已创建  
   **WHEN** 为上述 attempt 插入作答记录（user_answer, is_correct, score_earned）  
   **THEN** 插入成功，外键约束正确

4. **GIVEN** 删除一条 quiz_attempt 记录  
   **WHEN** 查询该 attempt 的 quiz_answers 和 quiz_progress  
   **THEN** 均已被级联删除

5. **GIVEN** RLS 已启用  
   **WHEN** 用户 A 查询 quiz_attempts  
   **THEN** 仅返回 user_id = A 的记录，看不到用户 B 的记录

6. **GIVEN** quiz_progress 表唯一索引  
   **WHEN** 同一 user_id + attempt_id 插入两条记录  
   **THEN** 第二次插入失败（唯一约束冲突）

7. **GIVEN** can_retake_exam 函数已创建  
   **WHEN** 用户最近一次综合考核未通过且距提交不足 24 小时  
   **THEN** 返回 can_retake=false 和 next_available_at 时间

8. **GIVEN** can_retake_exam 函数  
   **WHEN** 用户无考核记录或最近考核距今超过 24 小时  
   **THEN** 返回 can_retake=true

9. **GIVEN** TypeScript 类型文件已创建  
   **WHEN** 编译 `backend/src/models/quiz-attempt.ts`  
   **THEN** 零类型错误

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. 执行 Migration SQL
4. 验证表结构：`\d quiz_attempts`、`\d quiz_answers`、`\d quiz_progress`
5. 插入测试数据验证 CRUD 和级联删除
6. 验证 RLS（用不同用户测试数据隔离）
7. 验证 `can_retake_exam` 函数（模拟 24h 前后场景）
8. 编译检查：`docker compose exec backend npx tsc --noEmit`

### 测试通过标准

- [ ] Migration SQL 执行零错误
- [ ] 3 张表结构正确
- [ ] 枚举类型 `quiz_attempt_status` 创建成功
- [ ] 外键约束和级联删除生效
- [ ] RLS 用户隔离正确
- [ ] 唯一索引约束生效
- [ ] 数据库函数可调用且逻辑正确
- [ ] TypeScript 类型编译零错误

### 测试不通过处理

- 发现问题 → 立即修复 → 重新执行 Migration → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/05-course-assessment/T05-002-db-quiz-records.md`

## 自检重点

- [ ] 所有表名 snake_case 复数
- [ ] RLS 启用且策略正确（用户只能访问自己的记录）
- [ ] 外键约束完整（级联删除）
- [ ] 索引覆盖常用查询路径（特别是 24h 重考检查）
- [ ] quiz_progress 唯一约束防重复
- [ ] data_signature 字段用于防篡改校验
- [ ] expires_at 用于进度过期管理
