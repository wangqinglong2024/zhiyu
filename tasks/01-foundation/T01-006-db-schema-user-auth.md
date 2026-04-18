# T01-006: 数据库基础 Schema — 用户与认证

> 分类: 01-基础架构搭建 (Foundation Infrastructure)
> 状态: 📋 待开发
> 复杂度: L(复杂)
> 预估文件数: 3

## 需求摘要

创建知语平台的用户基础数据表，包括 `profiles`（用户档案）表和相关的 RLS 策略。Supabase Auth 已提供 `auth.users` 表用于认证，本任务创建业务层用户扩展表，通过外键关联 `auth.users`。包含完整的建表 SQL、索引、RLS 策略、Trigger（自动创建 profile）和 Migration 文件。

## 相关上下文

- 产品需求: `product/00-product-overview.md` §三 — 用户角色与权限（访客/登录/付费三层）
- 产品需求: `product/00-product-overview.md` §四 — 多语言体系（学习语言模式、解释语言）
- 架构白皮书: `grules/01-rules.md` §二 — Supabase 架构哲学（RLS 零信任、Migration 留痕）
- 编码规范: `grules/05-coding-standards.md` §一.2 — 数据库表名 snake_case 复数、字段 snake_case
- 环境配置: `grules/env.md` §3 — Supabase 数据库凭证
- 关联任务: 前置 T01-005 → 后续 T02（全局框架认证模块）

## 技术方案

### 数据库设计

#### profiles 表（用户档案）

```sql
-- supabase/migrations/20260418000001_create_profiles.sql

-- =====================================================
-- 用户档案表：扩展 auth.users，存储业务层用户信息
-- =====================================================

-- 创建自定义枚举类型
CREATE TYPE user_role AS ENUM ('user', 'admin', 'content_ops', 'user_ops', 'game_ops');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'banned');
CREATE TYPE language_code AS ENUM ('zh', 'en', 'vi', 'id', 'th', 'ms');
CREATE TYPE learning_mode AS ENUM ('pinyin_chinese', 'chinese_only');

-- 用户档案表
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 基本信息
  username VARCHAR(50) UNIQUE,
  display_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,

  -- 角色与状态
  role user_role NOT NULL DEFAULT 'user',
  status user_status NOT NULL DEFAULT 'active',

  -- 语言偏好（多语言体系核心）
  ui_language language_code NOT NULL DEFAULT 'en',
  learning_mode learning_mode NOT NULL DEFAULT 'pinyin_chinese',
  explanation_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  explanation_language language_code NOT NULL DEFAULT 'vi',

  -- 学习进度
  current_level INTEGER NOT NULL DEFAULT 1 CHECK (current_level BETWEEN 1 AND 12),
  total_study_minutes INTEGER NOT NULL DEFAULT 0,

  -- 知语币（产品 §5.2）
  zhiyu_coins INTEGER NOT NULL DEFAULT 0 CHECK (zhiyu_coins >= -10000),

  -- 游戏段位（产品 §5.4）
  game_rank VARCHAR(20) NOT NULL DEFAULT 'bronze_3',
  game_stars INTEGER NOT NULL DEFAULT 1,

  -- 推荐系统
  referral_code VARCHAR(20) UNIQUE,
  referred_by UUID REFERENCES profiles(id),

  -- 付费状态
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,

  -- 时间戳
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 索引
-- =====================================================
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);

-- =====================================================
-- RLS 策略（零信任原则：建表后第一条语句开启 RLS）
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 策略 1：用户可读取自己的档案
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- 策略 2：用户可更新自己的档案（但不能修改 role、status、zhiyu_coins）
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 策略 3：允许读取其他用户的公开信息（用户名、头像、段位）
CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT
  USING (TRUE);

-- 策略 4：服务端可通过 service_role 操作所有记录（后端管理用）
-- （service_role 自动绕过 RLS，无需额外策略）

-- =====================================================
-- 触发器：注册时自动创建 profile
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, referral_code)
  VALUES (
    NEW.id,
    NULL,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    -- 生成唯一推荐码：取 UUID 前 8 位
    UPPER(SUBSTRING(NEW.id::TEXT FROM 1 FOR 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 触发器：自动更新 updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 注释（方便 Supabase Studio 和后续维护）
-- =====================================================
COMMENT ON TABLE profiles IS '用户档案表：扩展 auth.users 的业务层数据';
COMMENT ON COLUMN profiles.zhiyu_coins IS '知语币余额，可为负数（退款扣回场景）';
COMMENT ON COLUMN profiles.game_rank IS '游戏段位：bronze_3/silver_1/.../master';
COMMENT ON COLUMN profiles.referral_code IS '推荐码：UUID 前 8 位大写';
```

### 后端类型定义 — `backend/src/models/user.ts`

```typescript
import { z } from 'zod'

// ===== Zod Schema =====
export const ProfileUpdateSchema = z.object({
  username: z.string().min(2).max(50).optional(),
  display_name: z.string().max(100).optional(),
  avatar_url: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  ui_language: z.enum(['zh', 'en', 'vi', 'id', 'th', 'ms']).optional(),
  learning_mode: z.enum(['pinyin_chinese', 'chinese_only']).optional(),
  explanation_enabled: z.boolean().optional(),
  explanation_language: z.enum(['zh', 'en', 'vi', 'id', 'th', 'ms']).optional(),
})

// ===== TypeScript 类型 =====
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>

export interface ProfileResponse {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  role: 'user' | 'admin' | 'content_ops' | 'user_ops' | 'game_ops'
  status: 'active' | 'suspended' | 'banned'
  ui_language: string
  learning_mode: string
  current_level: number
  zhiyu_coins: number
  game_rank: string
  game_stars: number
  referral_code: string
  is_paid: boolean
  created_at: string
  updated_at: string
}
```

### 关键设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| Profile 主键 | UUID = auth.users.id | 一对一关系，直接复用 auth.users 的 UUID |
| 自动创建 | Trigger on auth.users INSERT | 注册后自动创建 profile，无需应用层代码 |
| 知语币允许负数 | CHECK >= -10000 | 产品需求：退款扣回可至负数 |
| 推荐码 | UUID 前 8 位大写 | 简短易分享，冲突概率极低 |
| RLS 公开读 | SELECT USING (TRUE) | 排行榜/段位需要读取其他用户公开信息 |
| 枚举类型 | PostgreSQL ENUM | 数据库层面强约束，比字符串更安全 |

## 范围（做什么）

- 创建 `supabase/migrations/20260418000001_create_profiles.sql` Migration 文件
- 创建 `backend/src/models/user.ts` Zod Schema 和 TypeScript 类型
- 创建完整的 RLS 策略
- 创建自动创建 profile 的 Trigger
- 创建 updated_at 自动更新 Trigger

## 边界（不做什么）

- 不实现 API 路由（T02 全局框架）
- 不实现认证流程（T02 全局框架）
- 不创建前端类型（T02 全局框架用 supabase gen types）
- 不创建 Repository 层（后续业务任务）
- 不创建管理后台的用户管理功能（T13）

## 涉及文件

- 新建: `zhiyu/supabase/migrations/20260418000001_create_profiles.sql`
- 新建: `zhiyu/backend/src/models/user.ts`
- 修改: `zhiyu/frontend/src/types/supabase.ts`（类型占位，后续 gen types 覆盖）

## 依赖

- 前置: T01-005（Supabase 连接可用）
- 后续: T01-007（系统配置表）、T02（全局框架-认证模块）

## 验收标准（GIVEN-WHEN-THEN）

1. **GIVEN** Migration SQL 已执行  
   **WHEN** 查询 `\d profiles`  
   **THEN** 表存在，包含 id、username、role、status、zhiyu_coins 等全部字段

2. **GIVEN** profiles 表 RLS 已开启  
   **WHEN** 使用 ANON_KEY 查询 profiles  
   **THEN** 只能看到公开信息（RLS 策略生效）

3. **GIVEN** 新用户通过 auth.users 注册  
   **WHEN** 检查 profiles 表  
   **THEN** 自动创建对应 profile 记录（Trigger 生效），含 referral_code

4. **GIVEN** 更新 profile 任意字段  
   **WHEN** 检查 updated_at  
   **THEN** 自动更新为当前时间

5. **GIVEN** backend/src/models/user.ts 存在  
   **WHEN** 使用 ProfileUpdateSchema 校验包含非法 role 值的数据  
   **THEN** Zod 校验失败并返回错误信息

6. **GIVEN** profiles 表索引已创建  
   **WHEN** 执行 `\di` 查看索引  
   **THEN** idx_profiles_username、idx_profiles_role 等索引存在

## Docker 自动化测试（强制）

> ⚠️ 绝对禁止在宿主机环境测试，必须通过 Docker 容器验证 ⚠️

### 测试步骤

1. `docker compose up -d --build` — 构建并启动所有服务
2. 通过 Supabase MCP 或 psql 执行 Migration SQL
3. 验证表结构：`\d profiles`
4. 验证索引：`\di profiles*`
5. 验证 RLS：`SELECT * FROM pg_policies WHERE tablename = 'profiles'`
6. 验证 Trigger：通过 Supabase Auth API 创建测试用户，检查 profiles 表自动插入

### 测试通过标准

- [ ] Migration SQL 执行无错误
- [ ] 表结构完整（所有字段、类型、约束正确）
- [ ] RLS 已开启且策略正确
- [ ] Trigger 正常触发（注册自动创建 profile）
- [ ] 索引已创建
- [ ] Zod Schema 类型正确

### 测试不通过处理

- 发现问题 → 立即修复 SQL → 删表重建 → 重新验证
- 同一问题 3 次修复失败 → 标记阻塞，停止任务

## 执行结果报告

结果文件路径: `/tasks/result/01-foundation/T01-006-db-schema-user-auth.md`

## 自检重点

- [ ] 安全：RLS 已开启（建表后第一条语句）
- [ ] 安全：Trigger 使用 SECURITY DEFINER
- [ ] 性能：查询字段有索引
- [ ] 类型同步：Zod Schema 与 SQL 字段类型一致
- [ ] 数据完整性：外键约束、CHECK 约束正确
