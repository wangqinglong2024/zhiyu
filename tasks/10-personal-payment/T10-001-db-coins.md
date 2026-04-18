# T10-001: 数据库 Schema — 知语币

> 分类: 10-个人中心与支付 (Personal Center & Payment)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 4

## 需求摘要

为知语 Zhiyu 知语币经济体系设计并创建数据库 Schema。包含 `user_coins`（用户余额表）和 `coin_transactions`（知语币流水表），引入余额快照机制，使用行锁（`SELECT ... FOR UPDATE`）保证并发安全，所有变动操作必须幂等（idempotency_key），支持负数余额。设置 RLS 策略并编写 Migration 文件。

## 相关上下文

- 产品需求: `product/apps/09-personal-payment/04-zhiyu-coins.md` — 知语币页面完整 PRD
- 产品总纲: `product/00-product-overview.md` §五.2 — 知语币体系完整规则
- 数据流向: `product/apps/09-personal-payment/08-data-nonfunctional.md` §一.3 — 知语币数据流
- 编码规范: `grules/05-coding-standards.md` §四 — Supabase 交互规范（Migration 规范）
- 架构白皮书: `grules/01-rules.md` §二 — Supabase 架构哲学（RLS 零信任）
- 架构白皮书: `grules/01-rules.md` §三 — 并发安全（行锁、幂等处理）
- 环境配置: `grules/env.md` — Supabase 连接信息
- 关联任务: T02-014（全局框架集成验证）→ 本任务 → T10-004（后端 API 依赖此 Schema）

## 技术方案

### 数据库设计

#### `public.user_coins` 用户知语币余额表

```sql
CREATE TABLE public.user_coins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,             -- 当前余额（可为负数）
  total_earned INTEGER NOT NULL DEFAULT 0,        -- 累计获得
  total_spent INTEGER NOT NULL DEFAULT 0,         -- 累计消费
  version INTEGER NOT NULL DEFAULT 0,             -- 乐观锁版本号
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_coins IS '用户知语币余额表 — 1 币 = $0.01，上限 100,000（获取时检查），可为负数（退款扣回场景）';
COMMENT ON COLUMN public.user_coins.balance IS '当前余额，可为负数。退款扣回推荐奖励时允许余额为负';
COMMENT ON COLUMN public.user_coins.version IS '乐观锁版本号，每次余额变动 +1，用于防止并发覆盖';

-- 更新时间自动触发
CREATE TRIGGER set_user_coins_updated_at
  BEFORE UPDATE ON public.user_coins
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

#### `public.coin_transactions` 知语币流水表

```sql
CREATE TABLE public.coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idempotency_key VARCHAR(128) NOT NULL,          -- 幂等键：防止重复操作
  type VARCHAR(30) NOT NULL,                      -- 交易类型枚举
  amount INTEGER NOT NULL,                        -- 变动金额（正=收入，负=支出）
  balance_after INTEGER NOT NULL,                 -- 变动后余额快照
  source_type VARCHAR(30),                        -- 来源实体类型（order / checkin / game / referral / activity）
  source_id UUID,                                 -- 来源实体 ID
  description TEXT NOT NULL,                      -- 中文描述
  description_key VARCHAR(100),                   -- i18n 描述 key
  metadata JSONB DEFAULT '{}',                    -- 扩展字段（如课程名、游戏名、推荐人昵称等）
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.coin_transactions IS '知语币收支流水表 — 每笔变动必须有对应的幂等键';
COMMENT ON COLUMN public.coin_transactions.idempotency_key IS '幂等键，格式：{source_type}:{source_id}:{action}，如 checkin:2026-04-18:reward';
COMMENT ON COLUMN public.coin_transactions.type IS '交易类型：referral_reward / referral_received / daily_checkin / game_streak / newbie_bonus / season_reward / milestone_reward / activity_bonus / skin_purchase / course_redeem / course_deduct / refund_clawback';
COMMENT ON COLUMN public.coin_transactions.balance_after IS '余额快照 — 用于快速展示流水中的余额变化，不替代 user_coins.balance';

-- 幂等键唯一约束
ALTER TABLE public.coin_transactions ADD CONSTRAINT uq_coin_transactions_idempotency UNIQUE (idempotency_key);
```

#### RLS 策略

```sql
-- user_coins 表 RLS
ALTER TABLE public.user_coins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可读取自己的知语币余额"
  ON public.user_coins FOR SELECT
  USING (auth.uid() = user_id);

-- 余额变动仅通过 Service Role（后端）操作，用户不可直接修改
-- 不创建 INSERT/UPDATE/DELETE 的用户策略

-- coin_transactions 表 RLS
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可查看自己的知语币流水"
  ON public.coin_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- 流水记录仅通过 Service Role（后端）插入
```

#### 索引

```sql
CREATE INDEX idx_user_coins_user_id ON public.user_coins(user_id);
CREATE INDEX idx_coin_tx_user_id ON public.coin_transactions(user_id);
CREATE INDEX idx_coin_tx_user_created ON public.coin_transactions(user_id, created_at DESC);
CREATE INDEX idx_coin_tx_type ON public.coin_transactions(type);
CREATE INDEX idx_coin_tx_source ON public.coin_transactions(source_type, source_id);
CREATE INDEX idx_coin_tx_idempotency ON public.coin_transactions(idempotency_key);
```

#### 核心存储过程 — 知语币变动（行锁 + 幂等）

```sql
CREATE OR REPLACE FUNCTION public.change_user_coins(
  p_user_id UUID,
  p_idempotency_key VARCHAR(128),
  p_type VARCHAR(30),
  p_amount INTEGER,
  p_source_type VARCHAR(30) DEFAULT NULL,
  p_source_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT '',
  p_description_key VARCHAR(100) DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE(new_balance INTEGER, transaction_id UUID) AS $$
DECLARE
  v_balance INTEGER;
  v_tx_id UUID;
  v_existing UUID;
BEGIN
  -- 1. 幂等检查：如果 idempotency_key 已存在，直接返回已有记录
  SELECT ct.id INTO v_existing
  FROM public.coin_transactions ct
  WHERE ct.idempotency_key = p_idempotency_key;

  IF v_existing IS NOT NULL THEN
    SELECT uc.balance INTO v_balance
    FROM public.user_coins uc
    WHERE uc.user_id = p_user_id;
    RETURN QUERY SELECT v_balance, v_existing;
    RETURN;
  END IF;

  -- 2. 行锁：锁定用户余额行
  SELECT uc.balance INTO v_balance
  FROM public.user_coins uc
  WHERE uc.user_id = p_user_id
  FOR UPDATE;

  -- 若用户无余额行，先创建
  IF NOT FOUND THEN
    INSERT INTO public.user_coins (user_id, balance)
    VALUES (p_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;
    v_balance := 0;
    -- 再次行锁
    SELECT uc.balance INTO v_balance
    FROM public.user_coins uc
    WHERE uc.user_id = p_user_id
    FOR UPDATE;
  END IF;

  -- 3. 获取时检查上限（100,000），支出/扣回不检查
  IF p_amount > 0 AND (v_balance + p_amount) > 100000 THEN
    RAISE EXCEPTION '知语币余额超过上限 100,000'
      USING ERRCODE = 'P0001';
  END IF;

  -- 4. 更新余额
  UPDATE public.user_coins
  SET balance = balance + p_amount,
      total_earned = CASE WHEN p_amount > 0 THEN total_earned + p_amount ELSE total_earned END,
      total_spent = CASE WHEN p_amount < 0 THEN total_spent + ABS(p_amount) ELSE total_spent END,
      version = version + 1
  WHERE user_id = p_user_id;

  v_balance := v_balance + p_amount;

  -- 5. 插入流水记录
  INSERT INTO public.coin_transactions (
    user_id, idempotency_key, type, amount, balance_after,
    source_type, source_id, description, description_key, metadata
  ) VALUES (
    p_user_id, p_idempotency_key, p_type, p_amount, v_balance,
    p_source_type, p_source_id, p_description, p_description_key, p_metadata
  )
  RETURNING id INTO v_tx_id;

  RETURN QUERY SELECT v_balance, v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### API 设计

本任务不涉及 API，仅数据库层。API 在 T10-004 中实现。

### 前端架构

本任务不涉及前端。

## 范围（做什么）

- 创建 `user_coins` 余额表和 `coin_transactions` 流水表
- 编写 `change_user_coins` 存储过程（行锁 + 幂等 + 上限检查）
- 配置 RLS 策略（用户只读，写操作仅 Service Role）
- 创建必要索引
- 编写 Migration 文件（`supabase/migrations/`）
- 编写后端 TypeScript 类型定义（对应数据库 Schema）

## 边界（不做什么）

- 不实现知语币相关 API 端点（T10-004）
- 不实现前端展示（T10-011）
- 不实现签到逻辑（T10-003 / T10-007）
- 不实现推荐码表（T10-002）

## 涉及文件

- 新建: `supabase/migrations/{timestamp}_create_coins_tables.sql`
- 新建: `src/types/coins.ts` — 知语币相关 TypeScript 类型
- 新建: `src/repositories/coin-repository.ts` — 数据库访问层（调用 rpc）
- 修改: `src/types/index.ts` — 导出新类型

## 依赖

- 前置: T02-014（全局框架集成验证 — 确保 Supabase 连接正常、`handle_updated_at` 函数已存在）
- 后续: T10-002（推荐系统 Schema）、T10-003（签到 Schema）、T10-004（知语币 API）

## 验收标准（GIVEN-WHEN-THEN）

1. GIVEN 数据库已迁移 WHEN 查看 `user_coins` 表结构 THEN 包含 `user_id`（唯一）、`balance`（可负）、`total_earned`、`total_spent`、`version` 字段，RLS 已开启
2. GIVEN 数据库已迁移 WHEN 查看 `coin_transactions` 表结构 THEN 包含 `idempotency_key`（唯一约束）、`type`、`amount`、`balance_after` 字段，RLS 已开启
3. GIVEN 用户余额为 320 WHEN 调用 `change_user_coins` 增加 100 币 THEN 返回 `new_balance=420`，`coin_transactions` 新增一条记录 `balance_after=420`
4. GIVEN 用户余额为 320 WHEN 以相同 `idempotency_key` 重复调用 `change_user_coins` THEN 不产生新流水，返回现有余额（幂等保护）
5. GIVEN 用户余额为 320 WHEN 调用 `change_user_coins` 扣除 500 币（退款扣回场景）THEN 余额变为 -180，流水记录 `balance_after=-180`
6. GIVEN 用户余额为 99900 WHEN 调用 `change_user_coins` 增加 200 币 THEN 抛出异常"余额超过上限 100,000"
7. GIVEN 普通用户身份（非 Service Role）WHEN 尝试直接 INSERT `user_coins` 或 `coin_transactions` THEN 被 RLS 拒绝
8. GIVEN 用户 A 的身份 WHEN 查询 `coin_transactions` THEN 只能看到用户 A 自己的流水记录

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 backend` — 后端无报错
4. 进入 Supabase 容器或通过 MCP 执行 Migration SQL
5. 验证表结构：`\d public.user_coins` 和 `\d public.coin_transactions`
6. 验证存储过程：执行 `SELECT * FROM change_user_coins(...)` 测试各场景
7. 验证 RLS：以普通用户身份尝试写入操作
8. 验证幂等：以相同 idempotency_key 调用两次

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] Migration 执行无错误
- [ ] 表结构和索引符合设计
- [ ] `change_user_coins` 存储过程正常工作（增/减/幂等/上限/负数）
- [ ] RLS 策略正确（用户只读自己数据，不可写入）
- [ ] 控制台无 Error 级别日志
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/10-personal-payment/` 下创建同名结果文件

结果文件路径: `/tasks/result/10-personal-payment/T10-001-db-coins.md`

## 自检重点

- [ ] 安全：RLS 策略覆盖所有表，用户不可绕过
- [ ] 性能：关键查询字段有索引
- [ ] 类型同步：DB Schema → TypeScript 类型一致
- [ ] 并发安全：`SELECT ... FOR UPDATE` 行锁 + `idempotency_key` 幂等
- [ ] 负数余额：退款扣回场景允许负数，获取场景检查上限
