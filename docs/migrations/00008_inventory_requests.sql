-- Migration: Create inventory_requests and request_items tables
-- PRD-15 / US-15-008

CREATE TABLE public.inventory_requests (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'fulfilled', 'declined')),
  reason            text,
  project_reference text,
  reviewed_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER inventory_requests_updated_at
  BEFORE UPDATE ON public.inventory_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_inventory_requests_requested_by ON public.inventory_requests(requested_by);
CREATE INDEX idx_inventory_requests_status ON public.inventory_requests(status);

-- ─── RLS: inventory_requests ─────────────────────────────
ALTER TABLE public.inventory_requests ENABLE ROW LEVEL SECURITY;

-- Requestors can read their own requests
CREATE POLICY "Users can read own requests"
  ON public.inventory_requests FOR SELECT
  TO authenticated
  USING (
    requested_by = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

-- Any authenticated user can create a request
CREATE POLICY "Authenticated can insert requests"
  ON public.inventory_requests FOR INSERT
  TO authenticated
  WITH CHECK (requested_by = auth.uid());

-- Only admin/manager can update (approve/decline)
CREATE POLICY "Admin and manager can update requests"
  ON public.inventory_requests FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

-- ─── Request Items ───────────────────────────────────────
CREATE TABLE public.request_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.inventory_requests(id) ON DELETE CASCADE,
  item_id    uuid NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
  quantity   integer NOT NULL
);

CREATE INDEX idx_request_items_request_id ON public.request_items(request_id);
CREATE INDEX idx_request_items_item_id ON public.request_items(item_id);

-- ─── RLS: request_items ──────────────────────────────────
ALTER TABLE public.request_items ENABLE ROW LEVEL SECURITY;

-- Readable if user can see the parent request
CREATE POLICY "Users can read own request items"
  ON public.request_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.inventory_requests r
      WHERE r.id = request_id
        AND (r.requested_by = auth.uid()
             OR public.has_role(auth.uid(), 'admin')
             OR public.has_role(auth.uid(), 'manager'))
    )
  );

-- Insert only for own requests
CREATE POLICY "Users can insert own request items"
  ON public.request_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.inventory_requests r
      WHERE r.id = request_id
        AND r.requested_by = auth.uid()
    )
  );
