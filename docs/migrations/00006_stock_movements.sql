-- Migration: Create stock_movements table
-- PRD-15 / US-15-006

CREATE TABLE public.stock_movements (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id            uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  quantity           integer NOT NULL,
  direction          text NOT NULL CHECK (direction IN ('in', 'out')),
  movement_type      text NOT NULL CHECK (movement_type IN ('received', 'shipped', 'adjusted', 'transferred')),
  reference_note     text,
  performed_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  from_location_id   uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  to_location_id     uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  resulting_quantity  integer NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────
CREATE INDEX idx_stock_movements_item_id ON public.stock_movements(item_id);
CREATE INDEX idx_stock_movements_created_at ON public.stock_movements(created_at);
CREATE INDEX idx_stock_movements_type ON public.stock_movements(movement_type);
CREATE INDEX idx_stock_movements_performed_by ON public.stock_movements(performed_by);

-- ─── RLS (immutable audit trail: SELECT + INSERT only) ───
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read movements"
  ON public.stock_movements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and manager can insert movements"
  ON public.stock_movements FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

-- No UPDATE or DELETE policies — audit trail is immutable
