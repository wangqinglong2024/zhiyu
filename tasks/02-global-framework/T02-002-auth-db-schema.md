# T02-002: 认证系统 — 数据库 Schema

> 分类: 02-全局框架 (Global Framework)
> 状态: 📋 待开发
> 复杂度: M(中等)
> 预估文件数: 5

## 需求摘要

为知语 Zhiyu 的认证系统设计并创建数据库 Schema。基于 Supabase Auth 原生能力，在 `public` schema 下创建 `profiles` 用户扩展表（关联 `auth.users`），配置 OAuth Provider（Google/Apple）信息、创建 `referral_codes` 推荐码表。设置 RLS 策略，编写 Migration 文件。

## 相关上下文

- 产品需求: `product/apps/01-global-framework/02-auth-system.md` — 登录注册完整 PRD
- 产品总纲: `product/00-product-overview.md` §三.1 — 用户分层（未登录/登录/付费）
- 产品总纲: `product/00-product-overview.md` §五.2 — 知语币体系（推荐码来源）
- 编码规范: `grules/05-coding-standards.md` §四 — Supabase 交互规范（auth.users 禁区、Migration 规范）
- 架构白皮书: `grules/01-rules.md` §二 — Supabase 架构哲学（RLS 零信任）
- 环境配置: `grules/env.md` — Supabase 连接信息
- 关联任务: T01-006（Supabase 连接验证）→ 本任务 → T02-003（后端 API 依赖此 Schema）

## 技术方案

### 数据库设计

#### `public.profiles` 用户扩展表

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname VARCHAR(50) NOT NULL,
  avatar_url TEXT,
  ui_language VARCHAR(5) NOT NULL DEFAULT 'en',        -- zh / en / vi
  learning_mode VARCHAR(20) NOT NULL DEFAULT 'pinyin',  -- pinyin / chinese_only
  explanation_lang_enabled BOOLEAN NOT NULL DEFAULT true,
  theme_mode VARCHAR(10) NOT NULL DEFAULT 'system',     -- light / dark / system
  push_enabled BOOLEAN NOT NULL DEFAULT false,
  push_reminder_time TIME DEFAULT '20:00:00',
  referral_code VARCHAR(8) UNIQUE NOT NULL,             -- 用户自己的推荐码
  referred_by UUID REFERENCES public.profiles(id),      -- 推荐人
  zhiyu_coins INTEGER NOT NULL DEFAULT 0,               -- 知语币余额
  user_role VARCHAR(20) NOT NULL DEFAULT 'free',        -- free / paid / banned
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 更新时间自动触发
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

#### `public.referral_rewards` 推荐奖励记录表

```sql
CREATE TABLE public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id),
  referred_id UUID NOT NULL REFERENCES public.profiles(id),
  reward_coins INTEGER NOT NULL,
  source_order_id UUID,           -- 触发奖励的订单 ID（后续填充）
  status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending / confirmed / revoked
  confirmed_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### RLS 策略

```sql
-- profiles 表 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 用户只能读写自己的 profile
CREATE POLICY "用户可读取自己的 profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "用户可更新自己的 profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service Role 可以插入（注册时由后端创建）
CREATE POLICY "Service Role 可以插入 profile"
  ON public.profiles FOR INSERT
  WITH CHECK (true);  -- 通过 Service Role Key 调用

-- referral_rewards 表 RLS
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可查看自己相关的推荐奖励"
  ON public.referral_rewards FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
```

#### 索引

```sql
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX idx_profiles_referred_by ON public.profiles(referred_by);
CREATE INDEX idx_profiles_user_role ON public.profiles(user_role);
CREATE INDEX idx_referral_rewards_referrer ON public.referral_rewards(referrer_id);
CREATE INDEX idx_referral_rewards_referred ON public.referral_rewards(referred_id);
```

#### 辅助函数

```sql
-- 自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 生成 8 位唯一推荐码
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS VARCHAR(8) AS $$
DECLARE
  code VARCHAR(8);
  exists_count INTEGER;
BEGIN
  LOOP
    code := upper(substr(md5(random()::text), 1, 8));
    SELECT COUNT(*) INTO exists_count FROM public.profiles WHERE referral_code = code;
    EXIT WHEN exists_count = 0;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 注册时自动创建 profile 的触发器
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nickname', 'User_' || substr(NEW.id::text, 1, 8)),
    public.generate_referral_code()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 范围（做什么）

- 创建 `public.profiles` 用户扩展表 Migration
- 创建 `public.referral_rewards` 推荐奖励表 Migration
- 配置 RLS 策略（用户只能访问自己的数据）
- 创建必要索引
- 创建辅助函数（`handle_updated_at`、`generate_referral_code`、`handle_new_user`）
- 创建自动触发器（注册时自动创建 profile、更新时自动刷新 updated_at）
- 编写后端 Zod Schema 对应 profiles 表
- 编写前端 TypeScript 类型定义

## 边界（不做什么）

- 不配置 Supabase Auth Provider（Google/Apple 在 Supabase Dashboard 配置，T02-003 集成）
- 不实现后端 API 逻辑（T02-003）
- 不实现前端登录 UI（T02-004）
- 不实现知语币事务逻辑（T10 个人中心模块）
- 不实现订单相关字段和表（T10 支付模块）

## 涉及文件

- 新建: `supabase/migrations/20260418000001_create_profiles_table.sql`
- 新建: `supabase/migrations/20260418000002_create_referral_rewards_table.sql`
- 新建: `backend/src/models/user.ts`（UserProfile Zod Schema + Types）
- 修改: `frontend/src/types/api.ts`（用户类型定义）
- 修改: `frontend/src/types/index.ts`（统一导出）

## 依赖

- 前置: T01-006（Supabase 连接验证完成）
- 后续: T02-003（认证后端 API）、T02-010（全局状态需要 Profile 类型）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** Migration 文件已创建  
   **WHEN** 在 Supabase 中执行 Migration SQL  
   **THEN** `public.profiles` 和 `public.referral_rewards` 表创建成功，字段、类型、约束与设计一致

2. **GIVEN** `profiles` 表已创建  
   **WHEN** 检查 RLS 策略  
   **THEN** RLS 已启用，用户只能 SELECT/UPDATE 自己的行，INSERT 需要 Service Role

3. **GIVEN** 一条新记录插入 `auth.users`  
   **WHEN** 检查 `profiles` 表  
   **THEN** 自动创建对应的 profile 记录，包含随机 8 位推荐码

4. **GIVEN** `profiles` 中某行被 UPDATE  
   **WHEN** 检查 `updated_at` 字段  
   **THEN** `updated_at` 自动更新为当前时间

5. **GIVEN** 后端 Zod Schema 已创建  
   **WHEN** 检查 `backend/src/models/user.ts`  
   **THEN** 包含 `ProfileCreateSchema`、`ProfileUpdateSchema`、`ProfileResponse` 类型，字段与数据库一致

6. **GIVEN** 前端类型已同步  
   **WHEN** 检查 `frontend/src/types/api.ts`  
   **THEN** 包含 `UserProfile` 接口，字段与后端响应一致

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. `docker compose ps` — 确认所有容器 Running
3. 通过 Supabase MCP 或 `psql` 执行 Migration SQL
4. 验证表结构：`\d public.profiles`、`\d public.referral_rewards`
5. 验证 RLS：`SELECT * FROM pg_policies WHERE tablename = 'profiles'`
6. 验证触发器：插入 auth.users 后检查 profiles 自动创建
7. 验证 TypeScript 编译：`docker compose exec backend npx tsc --noEmit`

### 测试通过标准

- [ ] TypeScript 零编译错误（前后端）
- [ ] Docker 构建成功，所有容器 Running
- [ ] 数据库表创建成功，字段/约束/索引正确
- [ ] RLS 策略正确启用和配置
- [ ] 触发器工作正常（自动创建 profile、自动更新 updated_at）
- [ ] Zod Schema 与数据库字段一致
- [ ] 前端类型与后端响应类型一致

### 测试不通过处理

- 发现问题 → 立即修复 → 重新 Docker 构建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/02-global-framework/T02-002-auth-db-schema.md`

## 自检重点

- [ ] 安全：RLS 已启用且策略正确，无公开读取漏洞
- [ ] 安全：`auth.users` 表绝未被修改（仅在 `public` schema 扩展）
- [ ] 安全：推荐码生成函数防碰撞
- [ ] 性能：关键查询字段已建索引
- [ ] 类型同步：DB → Zod Schema → 前端 TypeScript 三端一致
- [ ] Migration 留痕：SQL 文件头部有中文注释说明
