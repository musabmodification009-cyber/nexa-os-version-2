-- Migration: Create custom_field_definitions table
-- PRD-15 / US-15-009

CREATE TABLE public.custom_field_definitions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  field_type  text NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'boolean', 'select')),
  options     jsonb,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  is_required boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── RLS ─────────────────────────────────────────────────
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read custom_field_definitions"
  ON public.custom_field_definitions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert custom_field_definitions"
  ON public.custom_field_definitions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update custom_field_definitions"
  ON public.custom_field_definitions FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete custom_field_definitions"
  ON public.custom_field_definitions FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
