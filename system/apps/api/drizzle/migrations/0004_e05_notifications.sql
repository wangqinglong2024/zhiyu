-- E05 ZY-05-06 notifications table for in-app notification center.
-- Realtime: Supabase realtime broadcast on channel `notif:user:<uuid>`.

CREATE SCHEMA IF NOT EXISTS zhiyu;

CREATE TABLE IF NOT EXISTS zhiyu.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  type        text NOT NULL,
  title_key   text NOT NULL,
  body_key    text,
  data        jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notifications_type_chk CHECK (type IN ('system','learning','order','cs','referral'))
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname='auth') THEN
    BEGIN
      ALTER TABLE zhiyu.notifications
        ADD CONSTRAINT notifications_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON zhiyu.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON zhiyu.notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

ALTER TABLE zhiyu.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_select_own ON zhiyu.notifications;
CREATE POLICY notifications_select_own ON zhiyu.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS notifications_update_own ON zhiyu.notifications;
CREATE POLICY notifications_update_own ON zhiyu.notifications
  FOR UPDATE USING (auth.uid() = user_id);

GRANT USAGE ON SCHEMA zhiyu TO authenticated, service_role;
GRANT SELECT, UPDATE ON zhiyu.notifications TO authenticated;
GRANT ALL ON zhiyu.notifications TO service_role;
