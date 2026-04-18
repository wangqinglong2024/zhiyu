-- =====================================================
-- 推送订阅表 + 通知偏好表
-- =====================================================

-- 推送订阅表
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- 通知偏好表
CREATE TABLE public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  learning_reminder BOOLEAN DEFAULT TRUE,
  course_update BOOLEAN DEFAULT TRUE,
  activity_notice BOOLEAN DEFAULT TRUE,
  social_interaction BOOLEAN DEFAULT TRUE,
  system_announcement BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- RLS 策略
-- =====================================================
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_push_subs"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_notification_prefs"
  ON public.notification_preferences FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================
-- 索引
-- =====================================================
CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions(user_id);

-- =====================================================
-- 自动更新 updated_at
-- =====================================================
CREATE TRIGGER notification_prefs_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 注释
-- =====================================================
COMMENT ON TABLE public.push_subscriptions IS 'Web Push 推送订阅表';
COMMENT ON TABLE public.notification_preferences IS '用户通知偏好设置';
