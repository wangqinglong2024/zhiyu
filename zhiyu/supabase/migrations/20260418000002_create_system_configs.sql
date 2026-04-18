-- =====================================================
-- 系统配置表：全局动态参数，管理后台可编辑
-- =====================================================

CREATE TABLE system_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 配置键（唯一标识）
  config_key VARCHAR(100) NOT NULL UNIQUE,

  -- 配置值（JSON 格式，支持复杂结构）
  config_value JSONB NOT NULL DEFAULT '{}',

  -- 配置分类（便于管理后台分组展示）
  category VARCHAR(50) NOT NULL DEFAULT 'general',

  -- 描述（中文，方便运营理解）
  description TEXT,

  -- 是否公开（前端可直接读取，无需登录）
  is_public BOOLEAN NOT NULL DEFAULT FALSE,

  -- 时间戳
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 索引
-- =====================================================
CREATE INDEX idx_system_configs_key ON system_configs(config_key);
CREATE INDEX idx_system_configs_category ON system_configs(category);
CREATE INDEX idx_system_configs_public ON system_configs(is_public) WHERE is_public = TRUE;

-- =====================================================
-- RLS 策略
-- =====================================================
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;

-- 策略 1：公开配置项允许匿名读取
CREATE POLICY "system_configs_select_public"
  ON system_configs FOR SELECT
  USING (is_public = TRUE);

-- 策略 2：登录用户可读取所有配置
CREATE POLICY "system_configs_select_authenticated"
  ON system_configs FOR SELECT
  TO authenticated
  USING (TRUE);

-- 注意：写操作仅 service_role 可执行（管理后台通过后端 API）

-- =====================================================
-- 自动更新 updated_at
-- =====================================================
CREATE TRIGGER system_configs_updated_at
  BEFORE UPDATE ON system_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 初始种子数据
-- =====================================================
INSERT INTO system_configs (config_key, config_value, category, description, is_public) VALUES

-- 知语币配置
('coin_daily_checkin_rules', '{
  "distribution": [
    {"coins": 1, "probability": 0.40},
    {"coins": 2, "probability": 0.20},
    {"coins": 3, "probability": 0.08},
    {"coins": 4, "probability": 0.08},
    {"coins": 5, "probability": 0.06},
    {"coins": 6, "probability": 0.06},
    {"coins": 7, "probability": 0.04},
    {"coins": 8, "probability": 0.04},
    {"coins": 9, "probability": 0.02},
    {"coins": 10, "probability": 0.02}
  ],
  "paid_user_multiplier": 2
}', 'coins', '每日签到知语币发放规则', FALSE),

('coin_max_balance', '{"max": 100000}', 'coins', '单用户知语币余额上限', FALSE),

('coin_referral_reward_rate', '{"rate": 0.20, "lock_days": 30}', 'coins', '推荐奖励比例和锁定期', FALSE),

-- 课程配置
('course_pricing', '{
  "free_levels": [1, 2, 3],
  "paid_price_usd": 6,
  "validity_years": 3,
  "bundle_price_usd": 54,
  "apple_iap_price_usd": 7.99,
  "renewal_discount": 0.20
}', 'course', '课程定价配置', TRUE),

('course_assessment', '{
  "unit_pass_score": 70,
  "level_pass_score": 85,
  "level_min_section_score": 60,
  "retry_cooldown_hours": 24
}', 'course', '考核通过标准', FALSE),

-- 游戏配置
('game_rank_config', '{
  "ranks": ["bronze_3","bronze_2","bronze_1","silver_3","silver_2","silver_1","gold_3","gold_2","gold_1","platinum_3","platinum_2","platinum_1","diamond_3","diamond_2","diamond_1","star_3","star_2","star_1","master"],
  "stars_per_rank": 3,
  "win_stars": 1,
  "lose_stars": -1,
  "min_rank": "bronze_3",
  "min_stars": 1,
  "season_months": 3
}', 'game', '游戏段位配置', TRUE),

-- 应用通用
('app_supported_languages', '{"ui": ["zh","en","vi"], "future": ["id","th","ms"]}', 'general', '支持的 UI 语言列表', TRUE),

('app_version', '{"current": "0.1.0", "min_supported": "0.1.0"}', 'general', '应用版本信息', TRUE);

-- =====================================================
-- 注释
-- =====================================================
COMMENT ON TABLE system_configs IS '系统配置键值表：动态参数，管理后台可编辑';
COMMENT ON COLUMN system_configs.config_value IS 'JSONB 格式配置值，支持复杂嵌套结构';
COMMENT ON COLUMN system_configs.is_public IS '是否允许未登录用户读取';
