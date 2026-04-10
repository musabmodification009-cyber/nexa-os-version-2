-- Migration: Create purchase_orders and purchase_order_items tables
-- PRD-15 / US-15-007

CREATE TABLE public.purchase_orders (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id            uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  status                 text NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft', 'submitted', 'partial', 'received', 'cancelled')),
  expected_delivery_date date,
  notes                  text,
  created_by             uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX idx_purchase_orders_created_by ON public.purchase_orders(created_by);

-- ─── RLS: purchase_orders ────────────────────────────────
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read purchase_orders"
  ON public.purchase_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and manager can insert purchase_orders"
  ON public.purchase_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Admin and manager can update purchase_orders"
  ON public.purchase_orders FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Admin and manager can delete purchase_orders"
  ON public.purchase_orders FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

-- ─── Line Items ──────────────────────────────────────────
CREATE TABLE public.purchase_order_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  item_id           uuid NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
  quantity_ordered  integer NOT NULL,
  quantity_received integer NOT NULL DEFAULT 0,
  unit_cost         numeric(10,2)
);

CREATE INDEX idx_po_items_purchase_order_id ON public.purchase_order_items(purchase_order_id);
CREATE INDEX idx_po_items_item_id ON public.purchase_order_items(item_id);

-- ─── RLS: purchase_order_items ───────────────────────────
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read purchase_order_items"
  ON public.purchase_order_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and manager can insert purchase_order_items"
  ON public.purchase_order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Admin and manager can update purchase_order_items"
  ON public.purchase_order_items FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Admin and manager can delete purchase_order_items"
  ON public.purchase_order_items FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );
