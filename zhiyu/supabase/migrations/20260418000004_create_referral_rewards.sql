-- =====================================================
-- 推荐奖励记录表
-- =====================================================

CREATE TABLE public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 推荐人
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- 被推荐人
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- 奖励知语币数
  reward_coins INTEGER NOT NULL,

  -- 触发奖励的订单 ID（后续填充）
  source_order_id UUID,

  -- 状态
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'revoked')),

  -- 时间戳
  confirmed_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 索引
-- =====================================================
CREATE INDEX idx_referral_rewards_referrer ON public.referral_rewards(referrer_id);
CREATE INDEX idx_referral_rewards_referred ON public.referral_rewards(referred_id);
CREATE INDEX idx_referral_rewards_status ON public.referral_rewards(status);

-- =====================================================
-- RLS 策略
-- =====================================================
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- 用户可查看自己相关的推荐奖励
CREATE POLICY "referral_rewards_select_own"
  ON public.referral_rewards FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- 写操作仅 service_role 可执行

-- =====================================================
-- 注释
-- =====================================================
COMMENT ON TABLE public.referral_rewards IS '推荐奖励记录表：记录推荐人和被推荐人之间的奖励关系';
COMMENT ON COLUMN public.referral_rewards.status IS '奖励状态：pending 待确认 / confirmed 已确认 / revoked 已撤销';
