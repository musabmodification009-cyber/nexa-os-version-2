-- Migration: Create notifications table
-- PRD-15 / US-15-010

CREATE TABLE public.notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type            text NOT NULL,
  title           text NOT NULL,
  message         text,
  is_read         boolean NOT NULL DEFAULT false,
  reference_id    uuid,
  reference_type  text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, is_read);

-- ─── RLS ─────────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
