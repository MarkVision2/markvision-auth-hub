ALTER TABLE public.competitor_ads 
  ADD COLUMN IF NOT EXISTS ad_archive_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS ad_text text,
  ADD COLUMN IF NOT EXISTS ad_status text DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS start_date text,
  ADD COLUMN IF NOT EXISTS page_name text;