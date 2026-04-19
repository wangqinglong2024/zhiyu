# T04-003: 数据库 Schema — 课程购买与权限

> 分类: 04-系统课程-学习 (Course Learning)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 3

## 需求摘要

创建课程购买与权限管理表 `user_course_purchases`，记录用户对付费 Level（L4-L12）的购买信息，包括支付方式（Paddle / 知语币兑换）、有效期（3 年）、到期提醒状态等。同时创建购买订单的幂等处理机制（`idempotency_key`），以及针对"全部购买"场景的已购扣减逻辑基础。

## 相关上下文

- 产品需求: `product/apps/03-course-learning/03-paywall.md`（付费墙弹窗完整 PRD）
- 产品需求: `product/apps/03-course-learning/03-paywall.md` §五（全部购买入口 + 已购扣减逻辑）
- 产品总纲: `product/00-product-overview.md` §五.1（L1-L3 免费，L4-L12 $6/级，全部 $54，3 年有效）
- 设计规范: `grules/05-coding-standards.md` §三.5（异步 HTTP + 后台任务）、§六（安全 — 签名验证 + 幂等）
- 设计规范: `grules/04-api-design.md` §六（鉴权粒度）
- 关联任务: T04-001（levels 表）→ 本任务 → T04-008（购买 API）

## 技术方案

### 数据库设计

#### 表: `user_course_purchases` — 用户课程购买记录

```sql
CREATE TABLE public.user_course_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  
  -- 购买方式
  purchase_type VARCHAR(20) NOT NULL
    CHECK (purchase_type IN ('paddle', 'coin_exchange', 'bundle')),
  -- paddle:        Paddle 支付
  -- coin_exchange:  知语币兑换
  -- bundle:         全部购买（一次购 9 级）
  
  -- 支付信息
  amount_usd DECIMAL(6,2) NOT NULL DEFAULT 0.00,   -- 实付金额（美元）
  coin_amount INTEGER NOT NULL DEFAULT 0,            -- 消耗知语币数量
  
  -- Paddle 支付信息
  paddle_transaction_id VARCHAR(100),                -- Paddle 交易 ID
  paddle_checkout_id VARCHAR(100),                   -- Paddle Checkout Session ID
  paddle_subscription_id VARCHAR(100),               -- 预留订阅模式
  
  -- 订单状态
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'expired')),
  -- pending:   支付处理中
  -- completed: 支付成功，已解锁
  -- failed:    支付失败
  -- refunded:  已退款
  -- expired:   已过期
  
  -- 幂等键（防重复购买）
  idempotency_key VARCHAR(100) UNIQUE,
  
  -- 有效期（3 年）
  purchased_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,             -- purchased_at + 3 years
  
  -- 到期提醒状态
  reminder_30d_sent BOOLEAN NOT NULL DEFAULT false,
  reminder_7d_sent BOOLEAN NOT NULL DEFAULT false,
  reminder_1d_sent BOOLEAN NOT NULL DEFAULT false,
  
  -- Bundle 订单关联（全部购买时，子订单关联主订单）
  bundle_order_id UUID REFERENCES public.user_course_purchases(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- 唯一约束：同一用户对同一 Level 只能有一个有效购买
  -- 注意：退款/过期后可以重新购买，所以不能简单 UNIQUE(user_id, level_id)
  -- 改用条件唯一索引
  CONSTRAINT valid_expiry CHECK (
    (status = 'completed' AND expires_at IS NOT NULL AND purchased_at IS NOT NULL)
    OR status != 'completed'
  )
);

-- 条件唯一索引：同一用户同一 Level 只能有一个 completed 状态的购买
CREATE UNIQUE INDEX idx_ucpur_active_purchase 
  ON public.user_course_purchases (user_id, level_id) 
  WHERE status = 'completed';

-- 常规索引（前缀 idx_ucpur_ 避免与 user_course_progress 的 idx_ucp_ 冲突）
CREATE INDEX idx_ucpur_user ON public.user_course_purchases (user_id);
CREATE INDEX idx_ucpur_user_status ON public.user_course_purchases (user_id, status);
CREATE INDEX idx_ucpur_paddle_tx ON public.user_course_purchases (paddle_transaction_id) WHERE paddle_transaction_id IS NOT NULL;
CREATE INDEX idx_ucpur_idempotency ON public.user_course_purchases (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_ucpur_expiry ON public.user_course_purchases (expires_at) WHERE status = 'completed';
CREATE INDEX idx_ucpur_reminders ON public.user_course_purchases (expires_at, reminder_30d_sent, reminder_7d_sent, reminder_1d_sent) WHERE status = 'completed';
```

#### 辅助视图: `user_accessible_levels` — 用户可访问的 Level 列表

```sql
-- 方便查询用户可访问哪些 Level（免费 + 已购未过期）
CREATE OR REPLACE VIEW public.user_accessible_levels AS
SELECT 
  l.id AS level_id,
  l.level_number,
  l.is_free,
  p.user_id,
  p.expires_at,
  CASE 
    WHEN l.is_free THEN true
    WHEN p.status = 'completed' AND p.expires_at > now() THEN true
    ELSE false
  END AS is_accessible
FROM public.levels l
LEFT JOIN public.user_course_purchases p 
  ON l.id = p.level_id AND p.status = 'completed';
```

#### RLS 策略

```sql
ALTER TABLE public.user_course_purchases ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的购买记录
CREATE POLICY "purchases_select_own" ON public.user_course_purchases
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- INSERT/UPDATE 通过 service_role 在后端执行（涉及金额，不允许前端直接操作）
```

#### 触发器

```sql
CREATE TRIGGER set_purchases_updated_at
  BEFORE UPDATE ON public.user_course_purchases
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

## 范围（做什么）

- 创建 `user_course_purchases` 表（含幂等键、Paddle 信息、有效期、到期提醒）
- 创建条件唯一索引（同一用户同一 Level 只能有一个 completed 购买）
- 创建 `user_accessible_levels` 辅助视图
- 配置 RLS（用户只能查看自己的购买记录，写入通过 service_role）
- 生成 Migration 文件
- 后端 Zod Schema + TypeScript 类型

## 边界（不做什么）

- 不实现 Paddle 支付集成逻辑（T04-008）
- 不实现知语币扣减逻辑（T04-008 调用知语币 Service）
- 不实现到期提醒定时任务（横切关注点）
- 不实现退款流程

## 涉及文件

- 新建: `supabase/migrations/{timestamp}_create_course_purchases_table.sql`
- 新建: `backend/src/models/course-purchase.ts` — Zod Schema + TypeScript 类型
- 修改: `backend/src/models/course.ts` — 添加购买状态枚举引用

## 依赖

- 前置: T04-001（levels 表）
- 后续: T04-008（购买 API）、T04-011（付费墙前端）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** levels 表已存在 **WHEN** 执行 Migration **THEN** `user_course_purchases` 表创建成功
2. **GIVEN** 用户 A 购买了 L5（status=completed） **WHEN** 尝试再次插入同一用户 L5 的 completed 购买 **THEN** 条件唯一索引阻止
3. **GIVEN** 用户 A 的 L5 购买已退款（status=refunded） **WHEN** 插入新的 L5 completed 购买 **THEN** 成功（退款后可重新购买）
4. **GIVEN** completed 状态的购买 **WHEN** `purchased_at` 或 `expires_at` 为空 **THEN** CHECK 约束报错
5. **GIVEN** RLS 已开启 **WHEN** 用户 A 查询购买记录 **THEN** 只返回 user_id 等于自己的记录
6. **GIVEN** 幂等键 `abc123` 的订单已存在 **WHEN** 插入相同幂等键 **THEN** UNIQUE 约束报错
7. **GIVEN** `user_accessible_levels` 视图 **WHEN** 查询用户可访问 Level **THEN** 返回免费 Level（L1-L3）+ 已购未过期 Level
8. **GIVEN** 已购 Level 的 `expires_at` 已过期 **WHEN** 查询视图 **THEN** `is_accessible = false`

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build`
2. `docker compose ps` — 确认容器 Running
3. 执行 Migration SQL
4. 验证表结构和约束
5. 插入测试数据，验证条件唯一索引
6. 验证 RLS 用户隔离
7. 验证辅助视图查询结果
8. TypeScript 编译检查

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功
- [ ] 表结构和约束正确
- [ ] 条件唯一索引工作正常
- [ ] RLS 用户隔离正确
- [ ] 辅助视图返回正确结果
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞

## 执行结果报告

结果文件路径: `/tasks/result/04-course-learning/T04-003-db-course-purchase.md`

## 自检重点

- [ ] 安全: RLS 开启，金额写入限 service_role
- [ ] 安全: 幂等键防重复购买
- [ ] 性能: 索引覆盖常用查询路径
- [ ] 类型同步: Zod Schema 与 DB 一一对应
- [ ] RLS: 已开启
