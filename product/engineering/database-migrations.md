# 工程文档：数据库迁移（Supabase / PostgreSQL）

> 操作方式：通过 MCP 工具直接执行 SQL，同时在 `supabase/migrations/` 目录留存迁移文件作为 Git 历史
> 严禁修改 `auth.users` 等 Supabase 系统表

---

## 一、migrations 目录结构

```
supabase/
└── migrations/
    ├── 20240101000000_create_users.sql
    ├── 20240101000001_create_wallets.sql
    ├── 20240101000002_create_orders.sql
    ├── 20240101000003_create_commissions.sql
    ├── 20240101000004_create_withdrawals.sql
    ├── 20240101000005_create_settings.sql
    └── 20240101000006_enable_rls_all_tables.sql
```

---

## 二、完整建表 SQL

### users 表

```sql
-- 20240101000000_create_users.sql
-- 用户主表，扩展 Supabase auth.users，不修改系统表

CREATE TABLE public.users (
    id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone       varchar(20) UNIQUE NOT NULL,              -- 手机号（唯一）
    wechat_openid varchar(64),                            -- 微信 openid（可空）
    invite_code varchar(6) UNIQUE NOT NULL,               -- 用户邀请码（注册时生成）
    invited_by  uuid REFERENCES public.users(id),         -- 邀请人 user_id（可空）
    is_frozen   boolean NOT NULL DEFAULT false,           -- 账号冻结标志
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_users_phone ON public.users(phone);
CREATE INDEX idx_users_invite_code ON public.users(invite_code);
CREATE INDEX idx_users_invited_by ON public.users(invited_by);
```

### wallets 表

```sql
-- 20240101000001_create_wallets.sql
-- 用户钱包，每个用户注册时自动创建一条记录

CREATE TABLE public.wallets (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          uuid UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    balance          decimal(10,2) NOT NULL DEFAULT 0.00,  -- 当前可提现余额
    total_earned     decimal(10,2) NOT NULL DEFAULT 0.00,  -- 历史累计佣金
    total_withdrawn  decimal(10,2) NOT NULL DEFAULT 0.00,  -- 历史累计已提现
    updated_at       timestamptz NOT NULL DEFAULT now()
);

-- 约束：余额不能为负
ALTER TABLE public.wallets ADD CONSTRAINT wallets_balance_non_negative CHECK (balance >= 0);

CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);
```

### orders 表

```sql
-- 20240101000002_create_orders.sql

CREATE TABLE public.orders (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        uuid NOT NULL REFERENCES public.users(id),
    category       varchar(20) NOT NULL CHECK (category IN ('career', 'emotion')),
    input_content  text NOT NULL,                          -- 用户输入的困境
    report         jsonb,                                  -- AI 生成的报告（JSON）
    status         varchar(20) NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','paid','generating','completed','failed','expired','refunded')),
    amount         decimal(10,2) NOT NULL DEFAULT 28.80,
    payment_no     varchar(64),                            -- 微信/支付宝流水号
    paid_at        timestamptz,
    created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_paid_at ON public.orders(paid_at);
```

### commissions 表

```sql
-- 20240101000003_create_commissions.sql

CREATE TABLE public.commissions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_id  uuid NOT NULL REFERENCES public.users(id),  -- 佣金受益人
    order_id        uuid NOT NULL REFERENCES public.orders(id),
    type            varchar(20) NOT NULL CHECK (type IN ('self_cashback', 'referral')),
    amount          decimal(10,2) NOT NULL,                     -- 佣金金额
    ratio           decimal(4,2) NOT NULL DEFAULT 0.30,         -- 佣金比例
    status          varchar(20) NOT NULL DEFAULT 'settled'
                    CHECK (status IN ('pending', 'settled', 'withdrawn')),
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- 唯一约束：同一订单同一类型只能有一条佣金记录（幂等保证）
CREATE UNIQUE INDEX idx_commissions_order_type
    ON public.commissions(order_id, type);

CREATE INDEX idx_commissions_beneficiary_id ON public.commissions(beneficiary_id);
```

### withdrawals 表

```sql
-- 20240101000004_create_withdrawals.sql

CREATE TABLE public.withdrawals (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES public.users(id),
    amount          decimal(10,2) NOT NULL,
    payee_name      varchar(50) NOT NULL,                       -- 收款人真实姓名
    payee_account   varchar(100) NOT NULL,                      -- 收款账号
    payee_method    varchar(20) NOT NULL CHECK (payee_method IN ('wechat', 'alipay')),
    status          varchar(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
    admin_note      text,                                       -- 管理员备注/拒绝原因
    created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON public.withdrawals(status);
```

### settings 表

```sql
-- 20240101000005_create_settings.sql
-- 系统配置单行表（只有一条记录）

CREATE TABLE public.settings (
    id                   int PRIMARY KEY DEFAULT 1,
    order_price          decimal(10,2) NOT NULL DEFAULT 28.80,
    commission_ratio     decimal(4,2) NOT NULL DEFAULT 0.30,
    min_withdraw_amount  decimal(10,2) NOT NULL DEFAULT 50.00,
    ai_cost_per_call     decimal(10,2) NOT NULL DEFAULT 0.80,  -- Dashboard 估算系数
    announcement         text,                                  -- 首页公告（空则不显示）
    updated_at           timestamptz NOT NULL DEFAULT now(),

    -- 确保只有一行
    CONSTRAINT settings_single_row CHECK (id = 1)
);

-- 插入默认配置
INSERT INTO public.settings (id) VALUES (1) ON CONFLICT DO NOTHING;
```

---

## 三、RLS 策略（所有表必须启用）

```sql
-- 20240101000006_enable_rls_all_tables.sql

-- ===== users =====
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_self_only" ON public.users
    FOR ALL USING (auth.uid() = id);

-- ===== wallets =====
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallets_self_only" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);

-- ===== orders =====
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_self_only" ON public.orders
    FOR ALL USING (auth.uid() = user_id);

-- ===== commissions =====
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "commissions_self_only" ON public.commissions
    FOR SELECT USING (auth.uid() = beneficiary_id);

-- ===== withdrawals =====
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "withdrawals_self_only" ON public.withdrawals
    FOR ALL USING (auth.uid() = user_id);

-- ===== settings =====
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
-- 所有人可读（用于前端展示价格/公告），只有 service_role 可写
CREATE POLICY "settings_read_public" ON public.settings
    FOR SELECT USING (true);
-- 写操作通过 service_role key（绕过 RLS），不需要额外 policy
```

---

## 四、注意事项

1. **管理端操作**通过 `SUPABASE_SERVICE_ROLE_KEY` 绕过 RLS，直接访问所有数据
2. **佣金结算原子事务**通过 Supabase RPC（`supabase.rpc('settle_commission', {...})`）或 psycopg3 显式事务实现
3. **wallets 触发器（可选）**：可以给 `users` 表加 INSERT 触发器，自动创建对应 `wallets` 记录，省去 FastAPI 手动 INSERT
4. **users.is_frozen** 字段需要在 FastAPI JWT 验证成功后额外查询判断，冻结用户返回 403
