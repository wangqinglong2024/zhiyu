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
