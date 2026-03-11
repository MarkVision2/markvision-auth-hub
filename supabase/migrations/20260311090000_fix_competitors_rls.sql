-- Enable RLS on competitors table if not already enabled
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "competitors_select" ON public.competitors;
DROP POLICY IF EXISTS "competitors_insert" ON public.competitors;
DROP POLICY IF EXISTS "competitors_update" ON public.competitors;
DROP POLICY IF EXISTS "competitors_delete" ON public.competitors;
DROP POLICY IF EXISTS "Allow all operations on competitors" ON public.competitors;

-- Allow authenticated users full access to competitors table
CREATE POLICY "competitors_select"
  ON public.competitors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "competitors_insert"
  ON public.competitors FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "competitors_update"
  ON public.competitors FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "competitors_delete"
  ON public.competitors FOR DELETE
  TO authenticated
  USING (true);
