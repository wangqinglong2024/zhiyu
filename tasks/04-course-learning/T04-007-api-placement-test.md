# T04-007: 后端 API — 入学测试

> 分类: 04-系统课程-学习 (Course Learning)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 6

## 需求摘要

实现入学水平测试 API，包括：开始测试（初始化测试会话）、获取下一题（自适应出题算法）、提交答案（记录作答并动态调整难度）、完成测试（计算推荐 Level + 发放 100 知语币奖励）。测试采用自适应算法，起始难度 L3，根据答题正确率动态调整，支持零基础快速检测和高水平快速检测的提前终止机制。

## 相关上下文

- 产品需求: `product/apps/03-course-learning/02-placement-test.md`（入学测试完整 PRD）
- 产品需求: `product/apps/03-course-learning/02-placement-test.md` §三.2（自适应出题逻辑）
- 产品需求: `product/apps/03-course-learning/02-placement-test.md` §四.3（推荐 Level 逻辑 — 正确率映射表）
- 产品需求: `product/apps/03-course-learning/02-placement-test.md` §四.4（知语币奖励发放规则）
- 产品需求: `product/apps/03-course-learning/01-course-homepage.md` §二（引导卡片 — 测试状态字段）
- 设计规范: `grules/04-api-design.md`（统一响应格式）
- 设计规范: `grules/05-coding-standards.md` §三（三层分离）
- 关联任务: T04-001（levels 表 — 题库按 Level 难度出题）→ 本任务

## 技术方案

### 数据库补充（入学测试结果表）

```sql
CREATE TABLE public.placement_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 测试状态
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  
  -- 答题数据
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  answers JSONB NOT NULL DEFAULT '[]',
  -- 结构: [{ "question_id": "...", "level_difficulty": 3, "is_correct": true, "answer": "B", "time_ms": 5000 }]
  
  -- 各模块得分（P1 能力雷达图用）
  vocab_score DECIMAL(5,2) DEFAULT 0,
  reading_score DECIMAL(5,2) DEFAULT 0,
  grammar_score DECIMAL(5,2) DEFAULT 0,
  listening_score DECIMAL(5,2) DEFAULT 0,
  
  -- 结果
  overall_accuracy DECIMAL(5,2),        -- 综合正确率
  recommended_level SMALLINT,           -- 推荐 Level（1-12）
  
  -- 奖励
  coin_reward_claimed BOOLEAN NOT NULL DEFAULT false, -- 是否已领取知语币奖励
  
  -- 时间
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_pt_user ON public.placement_tests (user_id);
CREATE INDEX idx_pt_user_status ON public.placement_tests (user_id, status);

-- RLS
ALTER TABLE public.placement_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pt_user_all" ON public.placement_tests
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### API 设计

#### 1. 开始入学测试

```
POST /api/v1/placement-tests/start
鉴权级别: 1（需登录）
```

响应：返回测试会话 ID + 第一道题。

#### 2. 获取下一题

```
POST /api/v1/placement-tests/:testId/next-question
鉴权级别: 1（需登录）
```

请求体:
```json
{
  "previous_answer": "B",
  "previous_question_id": "q-001"
}
```

业务规则（自适应算法）:
```
起始难度 = L3

每答一题:
  答对 → 难度 +1
  答错 → 难度 -1
  连续答对 3 题 → 难度 +2（跳级加速）
  连续答错 3 题 → 难度 -2（快速降级）

终止条件（满足任一）:
  ① 已答 ≥ 30 题且置信度 ≥ 80%
  ② 已答 ≥ 60 题
  ③ 前 10 题正确率 < 30%（零基础快速检测）
  ④ 前 15 题正确率 > 90% 且已达 L9+ 难度
```

响应：下一道题或测试结束信号。

#### 3. 完成测试 / 获取结果

```
POST /api/v1/placement-tests/:testId/complete
鉴权级别: 1（需登录）
```

业务规则:
- 计算综合正确率，映射到推荐 Level
- 首次完成发放 100 知语币（调用知语币 Service）
- 更新用户状态 `placement_test_completed = true`

正确率 → Level 映射表:
```
< 30% (前10题) → L1
30-45%  → L1    73-78%  → L5    93-96% → L9
46-55%  → L2    79-84%  → L6    97-98% → L10
56-65%  → L3    85-88%  → L7    99-100% → L11
66-72%  → L4    89-92%  → L8
```

#### 4. 获取测试历史

```
GET /api/v1/placement-tests/history
鉴权级别: 1（需登录）
```

返回用户最近一次测试结果（推荐 Level + 各模块得分 + 是否已领奖励）。

### 题库设计

- 测试题目按 Level 难度分级存储
- 4 个模块：识字（选义）、词汇（释义匹配）、阅读理解、HSK 模拟
- 每个 Level 每个模块至少 20 道题，确保随机不重复
- 题目存储在 `placement_test_questions` 表或 JSONB 配置中

```sql
CREATE TABLE public.placement_test_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module VARCHAR(20) NOT NULL CHECK (module IN ('character', 'vocabulary', 'reading', 'hsk')),
  difficulty_level SMALLINT NOT NULL CHECK (difficulty_level BETWEEN 1 AND 12),
  question JSONB NOT NULL,
  correct_answer VARCHAR(10) NOT NULL,
  explanation JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ptq_module_level ON public.placement_test_questions (module, difficulty_level) WHERE is_active = true;

ALTER TABLE public.placement_test_questions ENABLE ROW LEVEL SECURITY;
-- ⚠️ 安全：题库含 correct_answer 字段，禁止前端直接查表
-- 仅允许 service_role（后端）读取题目，防止用户作弊
-- authenticated 用户通过后端 API 获取题目（API 层过滤答案字段后返回）
CREATE POLICY "ptq_select_service_only" ON public.placement_test_questions
  FOR SELECT TO service_role USING (is_active = true);
```

## 范围（做什么）

- 创建 `placement_tests` 表和 `placement_test_questions` 表
- 实现 4 个 API 端点（开始/下一题/完成/历史）
- 实现自适应出题算法（难度调整 + 终止条件）
- 实现推荐 Level 计算逻辑
- 实现知语币奖励发放（首次 100 币，调用知语币 Service）
- 三层分离（Router → Service → Repository）

## 边界（不做什么）

- 不填充大量题库数据（用少量种子数据验证逻辑，完整题库由内容团队通过管理后台填充）
- 不实现能力雷达图计算（P1 迭代）
- 不实现前端测试页面（由前端任务完成，本任务需确保 API 可通过 curl 调用）

## 涉及文件

- 新建: `supabase/migrations/{timestamp}_create_placement_test_tables.sql`
- 新建: `backend/src/routers/v1/placement-tests.ts`
- 新建: `backend/src/services/placement-test-service.ts`
- 新建: `backend/src/repositories/placement-test-repository.ts`
- 新建: `backend/src/models/placement-test.ts` — Zod Schema + 类型
- 修改: `backend/src/routers/v1/index.ts` — 注册路由

## 依赖

- 前置: T04-001（levels 表 — 题目按 Level 难度关联）
- 后续: T04-010（课程首页 — 入学测试引导卡片状态）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** 已登录用户 **WHEN** `POST /start` **THEN** 创建测试会话并返回第一道题（难度 L3）
2. **GIVEN** 用户答对 **WHEN** `POST /next-question` **THEN** 下一题难度 +1
3. **GIVEN** 用户连续答错 3 题 **WHEN** `POST /next-question` **THEN** 下一题难度 -2
4. **GIVEN** 前 10 题正确率 < 30% **WHEN** 提交第 10 题 **THEN** 测试自动结束，推荐 L1
5. **GIVEN** 已答 30 题且置信度 ≥ 80% **WHEN** 提交答案 **THEN** 测试结束，返回推荐 Level
6. **GIVEN** 综合正确率 60% **WHEN** 完成测试 **THEN** 推荐 Level = L3
7. **GIVEN** 首次完成测试 **WHEN** `POST /complete` **THEN** 发放 100 知语币，`coin_reward_claimed = true`
8. **GIVEN** 重复完成测试 **WHEN** `POST /complete` **THEN** 不重复发放知语币
9. **GIVEN** 用户已完成测试 **WHEN** `GET /history` **THEN** 返回最近结果（推荐 Level + 正确率）
10. **GIVEN** 测试进行中 **WHEN** 超过 60 题 **THEN** 强制结束测试

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build`
2. 执行 Migration SQL（包括测试题目种子数据）
3. 通过 curl 走完一轮完整测试流程
4. 验证自适应难度调整
5. 验证终止条件
6. 验证推荐 Level 计算
7. 验证知语币奖励发放

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功
- [ ] 完整测试流程可走通
- [ ] 自适应算法正确
- [ ] 推荐 Level 映射正确
- [ ] 知语币奖励发放正确（首次领取/不重复）
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞

## 执行结果报告

结果文件路径: `/tasks/result/04-course-learning/T04-007-api-placement-test.md`

## 自检重点

- [ ] 安全: authMiddleware 守卫
- [ ] 安全: 用户只能操作自己的测试会话
- [ ] 安全: 知语币奖励防重复领取
- [ ] 性能: 题库查询有索引
- [ ] 三层分离: 算法逻辑在 Service 层
