# T10-003: 数据库 Schema — 每日签到

> 分类: 10-个人中心与支付 (Personal Center & Payment)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 3

## 需求摘要

为知语 Zhiyu 每日签到系统设计并创建数据库 Schema。包含 `daily_checkins`（签到记录表）和 `checkin_config`（签到概率配置表），支持签到日历展示、概率分布奖励（1 币=40%、2 币=20% …）、付费用户双倍、连续签到追踪。设置 RLS 策略并编写 Migration 文件。

## 相关上下文

- 产品需求: `product/apps/09-personal-payment/04-zhiyu-coins.md` §三 — 签到作为知语币获取途径
- 产品总纲: `product/00-product-overview.md` §五.2 — 每日签到概率分布
- 编码规范: `grules/05-coding-standards.md` §四 — Supabase 交互规范
- 架构白皮书: `grules/01-rules.md` §二 — Supabase 架构哲学（RLS 零信任）
- 关联任务: T10-001（知语币 Schema）→ 本任务 → T10-007（签到 API）

## 技术方案

### 数据库设计

#### `public.daily_checkins` 每日签到记录表

```sql
CREATE TABLE public.daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,                      -- 签到日期（UTC）
  base_reward INTEGER NOT NULL,                    -- 基础奖励（概率抽取值）
  multiplier INTEGER NOT NULL DEFAULT 1,           -- 倍率（付费用户=2，免费=1）
  final_reward INTEGER NOT NULL,                   -- 最终奖励 = base_reward × multiplier
  streak_days INTEGER NOT NULL DEFAULT 1,          -- 当前连续签到天数
  coin_transaction_id UUID REFERENCES public.coin_transactions(id), -- 关联的知语币流水
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_daily_checkin_user_date UNIQUE (user_id, checkin_date)
);

COMMENT ON TABLE public.daily_checkins IS '每日签到记录表 — 每个用户每天最多签到一次';
COMMENT ON COLUMN public.daily_checkins.base_reward IS '基础奖励，由概率分布抽取：1币=40%, 2币=20%, 3-4币各8%, 5-6币各6%, 7-8币各4%, 9-10币各2%';
COMMENT ON COLUMN public.daily_checkins.multiplier IS '倍率：免费用户=1，付费用户=2（双倍签到奖励）';
COMMENT ON COLUMN public.daily_checkins.streak_days IS '连续签到天数，中断时重置为 1';
```

#### `public.checkin_reward_config` 签到奖励概率配置表

```sql
CREATE TABLE public.checkin_reward_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coins INTEGER NOT NULL,                          -- 奖励知语币数
  probability DECIMAL(5,4) NOT NULL,               -- 概率（0.0000 ~ 1.0000）
  sort_order INTEGER NOT NULL,                     -- 排序
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.checkin_reward_config IS '签到奖励概率配置表 — 概率之和必须等于 1.0';

-- 初始概率配置（与 PRD 完全一致）
INSERT INTO public.checkin_reward_config (coins, probability, sort_order) VALUES
  (1,  0.4000, 1),   -- 40%
  (2,  0.2000, 2),   -- 20%
  (3,  0.0800, 3),   -- 8%
  (4,  0.0800, 4),   -- 8%
  (5,  0.0600, 5),   -- 6%
  (6,  0.0600, 6),   -- 6%
  (7,  0.0400, 7),   -- 4%
  (8,  0.0400, 8),   -- 4%
  (9,  0.0200, 9),   -- 2%
  (10, 0.0200, 10);  -- 2%

-- 验证概率之和 = 1.0
DO $$
BEGIN
  IF (SELECT SUM(probability) FROM public.checkin_reward_config WHERE is_active = true) != 1.0 THEN
    RAISE EXCEPTION '签到奖励概率配置之和不等于 1.0';
  END IF;
END $$;
```

#### RLS 策略

```sql
-- daily_checkins 表 RLS
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可查看自己的签到记录"
  ON public.daily_checkins FOR SELECT
  USING (auth.uid() = user_id);

-- 签到操作仅通过 Service Role（后端 API）执行

-- checkin_reward_config 表 RLS
ALTER TABLE public.checkin_reward_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "所有已登录用户可读取签到奖励配置"
  ON public.checkin_reward_config FOR SELECT
  USING (auth.uid() IS NOT NULL);
```

#### 索引

```sql
CREATE INDEX idx_checkins_user_date ON public.daily_checkins(user_id, checkin_date DESC);
CREATE INDEX idx_checkins_user_streak ON public.daily_checkins(user_id, streak_days DESC);
CREATE INDEX idx_checkin_config_active ON public.checkin_reward_config(is_active) WHERE is_active = true;
```

#### 概率抽取函数

```sql
CREATE OR REPLACE FUNCTION public.draw_checkin_reward()
RETURNS INTEGER AS $$
DECLARE
  v_rand DECIMAL;
  v_cumulative DECIMAL := 0;
  v_record RECORD;
BEGIN
  v_rand := random();  -- 0.0 ~ 1.0
  
  FOR v_record IN
    SELECT coins, probability
    FROM public.checkin_reward_config
    WHERE is_active = true
    ORDER BY sort_order ASC
  LOOP
    v_cumulative := v_cumulative + v_record.probability;
    IF v_rand <= v_cumulative THEN
      RETURN v_record.coins;
    END IF;
  END LOOP;
  
  -- 兜底：返回最小值
  RETURN 1;
END;
$$ LANGUAGE plpgsql;
```

### API 设计

本任务不涉及 API，仅数据库层。API 在 T10-007 中实现。

### 前端架构

本任务不涉及前端。

## 范围（做什么）

- 创建 `daily_checkins` 签到记录表
- 创建 `checkin_reward_config` 签到概率配置表（含初始数据）
- 编写概率抽取函数 `draw_checkin_reward()`
- 配置 RLS 策略
- 创建必要索引
- 编写 Migration 文件
- 编写后端 TypeScript 类型定义

## 边界（不做什么）

- 不实现签到 API 端点（T10-007）
- 不实现签到日历前端展示（T10-011）
- 不实现连续签到断签逻辑处理（T10-007 中实现）

## 涉及文件

- 新建: `supabase/migrations/{timestamp}_create_checkin_tables.sql`
- 新建: `src/types/checkin.ts` — 签到相关 TypeScript 类型
- 新建: `src/repositories/checkin-repository.ts` — 数据库访问层
- 修改: `src/types/index.ts` — 导出新类型

## 依赖

- 前置: T10-001（知语币 Schema — `coin_transactions` 表供外键关联）
- 后续: T10-007（推荐与签到 API）

## 验收标准（GIVEN-WHEN-THEN）

1. GIVEN 数据库已迁移 WHEN 查看 `daily_checkins` 表结构 THEN 包含 `user_id + checkin_date` 唯一约束、`base_reward`、`multiplier`、`final_reward`、`streak_days` 字段
2. GIVEN 数据库已迁移 WHEN 查询 `checkin_reward_config` THEN 返回 10 条概率配置，概率之和 = 1.0
3. GIVEN 概率配置已就位 WHEN 调用 `draw_checkin_reward()` 1000 次并统计分布 THEN 1 币出现频率约 40%（误差 ±5%），2 币约 20%（误差 ±5%）
4. GIVEN 用户 A 已签到 2026-04-18 WHEN 尝试再次插入 2026-04-18 签到记录 THEN 触发唯一约束报错
5. GIVEN 用户 A 的签到记录 WHEN 用户 B 查询 `daily_checkins` THEN 用户 B 看不到用户 A 的记录
6. GIVEN RLS 已开启 WHEN 普通用户尝试 INSERT `daily_checkins` THEN 被 RLS 拒绝（仅 Service Role 可写）

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. 执行 Migration SQL
4. 验证表结构和初始数据
5. 验证概率抽取函数（多次调用统计分布）
6. 验证唯一约束（同一用户同日重复签到）
7. 验证 RLS 策略

### 测试通过标准

- [ ] TypeScript 零编译错误
- [ ] Docker 构建成功，所有容器 Running
- [ ] Migration 执行无错误
- [ ] 概率配置数据完整，总和 = 1.0
- [ ] 概率抽取函数分布合理
- [ ] 唯一约束有效
- [ ] RLS 策略正确
- [ ] 所有 GIVEN-WHEN-THEN 验收标准通过

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

> 任务完成后，必须在 `/tasks/result/10-personal-payment/` 下创建同名结果文件

结果文件路径: `/tasks/result/10-personal-payment/T10-003-db-daily-checkin.md`

## 自检重点

- [ ] 安全：RLS 策略覆盖所有表
- [ ] 性能：签到查询有复合索引
- [ ] 类型同步：DB Schema → TypeScript 类型一致
- [ ] 数据完整性：概率总和校验
- [ ] 唯一约束：防止同日重复签到
