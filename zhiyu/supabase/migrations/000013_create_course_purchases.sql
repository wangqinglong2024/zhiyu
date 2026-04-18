-- ============================================================
-- T04-003: 课程购买与权限表 — user_course_purchases + user_accessible_levels 视图
-- ============================================================

CREATE TABLE public.user_course_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,

  purchase_type VARCHAR(20) NOT NULL
    CHECK (purchase_type IN ('paddle', 'coin_exchange', 'bundle')),

  amount_usd DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  coin_amount INTEGER NOT NULL DEFAULT 0,

  paddle_transaction_id VARCHAR(100),
  paddle_checkout_id VARCHAR(100),
  paddle_subscription_id VARCHAR(100),

  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'expired')),

  idempotency_key VARCHAR(100) UNIQUE,

  purchased_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  reminder_30d_sent BOOLEAN NOT NULL DEFAULT false,
  reminder_7d_sent BOOLEAN NOT NULL DEFAULT false,
  reminder_1d_sent BOOLEAN NOT NULL DEFAULT false,

  bundle_order_id UUID REFERENCES public.user_course_purchases(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_expiry CHECK (
    (status = 'completed' AND expires_at IS NOT NULL AND purchased_at IS NOT NULL)
    OR status != 'completed'
  )
);

-- 条件唯一索引：同一用户同一 Level 只能有一个 completed 购买
CREATE UNIQUE INDEX idx_ucp_active_purchase
  ON public.user_course_purchases (user_id, level_id)
  WHERE status = 'completed';

CREATE INDEX idx_purchases_user ON public.user_course_purchases (user_id);
CREATE INDEX idx_purchases_user_status ON public.user_course_purchases (user_id, status);
CREATE INDEX idx_purchases_paddle_tx ON public.user_course_purchases (paddle_transaction_id) WHERE paddle_transaction_id IS NOT NULL;
CREATE INDEX idx_purchases_idempotency ON public.user_course_purchases (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_purchases_expiry ON public.user_course_purchases (expires_at) WHERE status = 'completed';
CREATE INDEX idx_purchases_reminders ON public.user_course_purchases (expires_at, reminder_30d_sent, reminder_7d_sent, reminder_1d_sent) WHERE status = 'completed';

-- === 辅助视图: 用户可访问的 Level 列表 ===
CREATE OR REPLACE VIEW public.user_accessible_levels AS
SELECT
  l.id AS level_id,
  l.level_number,
  l.is_free,
  p.user_id,
  p.expires_at,
  CASE
    WHEN l.is_free THEN true
    WHEN p.status = 'completed' AND p.expires_at > now() THEN true
    ELSE false
  END AS is_accessible
FROM public.levels l
LEFT JOIN public.user_course_purchases p
  ON l.id = p.level_id AND p.status = 'completed';

-- === RLS ===
ALTER TABLE public.user_course_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchases_select_own" ON public.user_course_purchases
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- === 触发器 ===
CREATE TRIGGER set_purchases_updated_at
  BEFORE UPDATE ON public.user_course_purchases
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
