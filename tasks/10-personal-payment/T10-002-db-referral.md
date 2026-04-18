# T10-002: 数据库 Schema — 推荐系统

> 分类: 10-个人中心与支付 (Personal Center & Payment)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 4

## 需求摘要

为知语 Zhiyu 推荐返利系统设计并创建数据库 Schema。包含 `referral_codes`（推荐码表）和 `referral_records`（推荐记录表），支持推荐码生成/验证、返利冷却期（30 天无退款后到账）、退款扣回、里程碑奖励。关联 `user_coins` 变动逻辑，设置 RLS 策略并编写 Migration 文件。

## 相关上下文

- 产品需求: `product/apps/09-personal-payment/06-referral.md` — 推荐返利系统完整 PRD
- 产品总纲: `product/00-product-overview.md` §五.2 — 推荐付费 20% 返利规则
- 数据流向: `product/apps/09-personal-payment/08-data-nonfunctional.md` §一.5 — 推荐返利数据流
- 编码规范: `grules/05-coding-standards.md` §四 — Supabase 交互规范
- 架构白皮书: `grules/01-rules.md` §二 — Supabase 架构哲学（RLS 零信任）
- 关联任务: T10-001（知语币 Schema）→ 本任务 → T10-007（推荐 API）

## 技术方案

### 数据库设计

#### `public.referral_codes` 推荐码表

```sql
CREATE TABLE public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(8) NOT NULL UNIQUE,               -- 格式：ZY-{6位字母数字大写}
  total_referrals INTEGER NOT NULL DEFAULT 0,     -- 成功推荐总数
  total_rewards INTEGER NOT NULL DEFAULT 0,       -- 累计返利（已到账）
  is_active BOOLEAN NOT NULL DEFAULT true,        -- 是否有效
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.referral_codes IS '用户推荐码表 — 每个用户一个唯一推荐码，格式 ZY-XXXXXX';
COMMENT ON COLUMN public.referral_codes.code IS '推荐码，格式 ZY-{6位大写字母数字}，如 ZY-A8K3M7';

CREATE TRIGGER set_referral_codes_updated_at
  BEFORE UPDATE ON public.referral_codes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

#### `public.referral_records` 推荐记录表

```sql
CREATE TABLE public.referral_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id),    -- 推荐人
  referred_id UUID NOT NULL REFERENCES auth.users(id),    -- 被推荐人
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id),
  order_id UUID,                                           -- 触发返利的订单 ID
  order_amount_cents INTEGER,                              -- 订单金额（美分）
  referrer_reward INTEGER NOT NULL DEFAULT 0,              -- 推荐人应得知语币
  referred_reward INTEGER NOT NULL DEFAULT 0,              -- 被推荐人应得知语币
  status VARCHAR(20) NOT NULL DEFAULT 'registered',        -- 状态：registered / cooling / confirmed / cancelled / clawed_back
  cooling_until TIMESTAMPTZ,                               -- 冷却期截止时间（购买后 30 天）
  confirmed_at TIMESTAMPTZ,                                -- 到账时间
  cancelled_at TIMESTAMPTZ,                                -- 取消时间
  clawed_back_at TIMESTAMPTZ,                              -- 扣回时间
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.referral_records IS '推荐记录表 — 记录推荐关系和返利状态，返利需 30 天冷却期无退款后到账';
COMMENT ON COLUMN public.referral_records.status IS '状态流转：registered(注册绑定) → cooling(购买后冷却中) → confirmed(30天后到账) / cancelled(冷却期内退款) / clawed_back(到账后退款扣回)';
COMMENT ON COLUMN public.referral_records.cooling_until IS '冷却期截止时间 = 订单支付时间 + 30 天';

CREATE TRIGGER set_referral_records_updated_at
  BEFORE UPDATE ON public.referral_records
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

#### `public.referral_milestones` 推荐里程碑配置表（P1）

```sql
CREATE TABLE public.referral_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_count INTEGER NOT NULL UNIQUE,         -- 推荐人数门槛（3/10/30/100）
  reward_coins INTEGER NOT NULL,                  -- 奖励知语币数
  description TEXT NOT NULL,                      -- 描述
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.referral_milestones IS '推荐里程碑配置表 — P1 功能';

-- 初始数据
INSERT INTO public.referral_milestones (referral_count, reward_coins, description) VALUES
  (3, 100, '累计推荐 3 人奖励 100 知语币'),
  (10, 500, '累计推荐 10 人奖励 500 知语币'),
  (30, 2000, '累计推荐 30 人奖励 2000 知语币'),
  (100, 10000, '累计推荐 100 人奖励 10000 知语币');
```

#### RLS 策略

```sql
-- referral_codes 表 RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可读取自己的推荐码"
  ON public.referral_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "所有已登录用户可通过 code 查询推荐码（验证用）"
  ON public.referral_codes FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- referral_records 表 RLS
ALTER TABLE public.referral_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可查看自己作为推荐人的记录"
  ON public.referral_records FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "用户可查看自己作为被推荐人的记录"
  ON public.referral_records FOR SELECT
  USING (auth.uid() = referred_id);

-- referral_milestones 表 RLS
ALTER TABLE public.referral_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "所有已登录用户可读取里程碑配置"
  ON public.referral_milestones FOR SELECT
  USING (auth.uid() IS NOT NULL);
```

#### 索引

```sql
CREATE INDEX idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX idx_referral_codes_user_id ON public.referral_codes(user_id);
CREATE INDEX idx_referral_records_referrer ON public.referral_records(referrer_id);
CREATE INDEX idx_referral_records_referred ON public.referral_records(referred_id);
CREATE INDEX idx_referral_records_status ON public.referral_records(status);
CREATE INDEX idx_referral_records_cooling ON public.referral_records(cooling_until) WHERE status = 'cooling';
CREATE INDEX idx_referral_records_order ON public.referral_records(order_id);
```

#### 推荐码生成函数

```sql
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS VARCHAR(8) AS $$
DECLARE
  v_code VARCHAR(8);
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- 生成 6 位大写字母数字随机码
    v_code := 'ZY-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    -- 确保唯一
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;
```

### API 设计

本任务不涉及 API，仅数据库层。API 在 T10-007 中实现。

### 前端架构

本任务不涉及前端。

## 范围（做什么）

- 创建 `referral_codes` 推荐码表
- 创建 `referral_records` 推荐记录表
- 创建 `referral_milestones` 里程碑配置表（含初始数据）
- 编写推荐码生成函数 `generate_referral_code()`
- 配置 RLS 策略
- 创建必要索引
- 编写 Migration 文件
- 编写后端 TypeScript 类型定义

## 边界（不做什么）

- 不实现推荐码验证/返利发放 API（T10-007）
- 不实现冷却期定时任务逻辑（T10-007）
- 不实现前端推荐页面（T10-011 / T10-009）
- 不实现退款相关逻辑（T10-006）

## 涉及文件

- 新建: `supabase/migrations/{timestamp}_create_referral_tables.sql`
- 新建: `src/types/referral.ts` — 推荐系统 TypeScript 类型
- 新建: `src/repositories/referral-repository.ts` — 数据库访问层
- 修改: `src/types/index.ts` — 导出新类型

## 依赖

- 前置: T10-001（知语币 Schema — `user_coins` 表和 `change_user_coins` 存储过程已就绪）
- 后续: T10-007（推荐与签到 API）

## 验收标准（GIVEN-WHEN-THEN）

1. GIVEN 数据库已迁移 WHEN 查看 `referral_codes` 表结构 THEN 包含 `code`（唯一）、`user_id`（唯一）、`total_referrals` 字段，RLS 已开启
2. GIVEN 数据库已迁移 WHEN 查看 `referral_records` 表结构 THEN 包含完整状态字段（status、cooling_until、confirmed_at 等），RLS 已开启
3. GIVEN 数据库已迁移 WHEN 查询 `referral_milestones` THEN 返回 4 条初始里程碑配置（3/10/30/100 人）
4. GIVEN 已登录用户 WHEN 调用 `generate_referral_code()` 多次 THEN 每次生成格式为 `ZY-XXXXXX` 的唯一码
5. GIVEN 用户 A 有推荐记录 WHEN 用户 B 查询 `referral_records` THEN 用户 B 只能看到自己作为推荐人或被推荐人的记录
6. GIVEN `referral_records` 中有 `status='cooling'` 且 `cooling_until` 已过期的记录 WHEN 查询 THEN 通过索引 `idx_referral_records_cooling` 高效筛选

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. `docker compose logs --tail=30 backend` — 后端无报错
4. 执行 Migration SQL
5. 验证表结构：`\d public.referral_codes` 和 `\d public.referral_records`
6. 验证推荐码生成函数唯一性
7. 验证 RLS 策略：不同用户只能看到自己相关的记录
8. 验证里程碑初始数据完整性

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] Migration 执行无错误
- [ ] 表结构和索引符合设计
- [ ] 推荐码生成函数正常工作
- [ ] RLS 策略正确
- [ ] 里程碑初始数据正确
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/10-personal-payment/` 下创建同名结果文件

结果文件路径: `/tasks/result/10-personal-payment/T10-002-db-referral.md`

## 自检重点

- [ ] 安全：RLS 策略覆盖所有表
- [ ] 性能：冷却期查询有部分索引
- [ ] 类型同步：DB Schema → TypeScript 类型一致
- [ ] 数据完整性：推荐码唯一、里程碑数据正确
- [ ] 状态机：referral_records.status 流转路径清晰
