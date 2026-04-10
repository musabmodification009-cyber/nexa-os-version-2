-- Migration: Create items table
-- PRD-15 / US-15-005

CREATE TABLE public.items (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL,
  description           text,
  image_url             text,
  sku                   text UNIQUE NOT NULL,
  barcode               text,
  category_id           uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  tags                  text[] DEFAULT '{}',
  unit_of_measure       text DEFAULT 'each',
  quantity_on_hand      integer NOT NULL DEFAULT 0,
  reorder_threshold     integer NOT NULL DEFAULT 10,
  reorder_quantity      integer NOT NULL DEFAULT 20,
  preferred_supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  cost_per_unit         numeric(10,2),
  sale_price            numeric(10,2),
  location_id           uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  status                text NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'discontinued', 'archived')),
  custom_fields         jsonb NOT NULL DEFAULT '{}',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ─── Indexes ─────────────────────────────────────────────
CREATE INDEX idx_items_sku ON public.items(sku);
CREATE INDEX idx_items_barcode ON public.items(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_items_category_id ON public.items(category_id);
CREATE INDEX idx_items_preferred_supplier_id ON public.items(preferred_supplier_id);
CREATE INDEX idx_items_location_id ON public.items(location_id);
CREATE INDEX idx_items_status ON public.items(status);

-- ─── RLS ─────────────────────────────────────────────────
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read items"
  ON public.items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin and manager can insert items"
  ON public.items FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Admin and manager can update items"
  ON public.items FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );

CREATE POLICY "Admin and manager can delete items"
  ON public.items FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'manager')
  );
