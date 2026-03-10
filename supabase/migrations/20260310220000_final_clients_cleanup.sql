
-- FINAL STRUCTURE FIX: Logically reorder columns and ensure RLS for clients_config
-- This ensures the DB looks clean and permissions are absolute.

BEGIN;

-- 1. Backup and Drop dependent views
DROP VIEW IF EXISTS public.agency_metrics_view;

-- 2. Temporary handle for foreign keys - we'll recreate them after
ALTER TABLE public.daily_metrics DROP CONSTRAINT IF EXISTS daily_metrics_client_config_id_fkey;
ALTER TABLE public.scoreboard_plans DROP CONSTRAINT IF EXISTS scoreboard_plans_client_config_id_fkey;
ALTER TABLE public.scoreboard_daily_facts DROP CONSTRAINT IF EXISTS scoreboard_daily_facts_client_config_id_fkey;
ALTER TABLE public.finance_client_services DROP CONSTRAINT IF EXISTS finance_client_services_client_config_id_fkey;
ALTER TABLE public.finance_client_billing DROP CONSTRAINT IF EXISTS finance_client_billing_client_config_id_fkey;

-- 3. Reorder clients_config via temporary table
ALTER TABLE public.clients_config RENAME TO clients_config_old;

CREATE TABLE public.clients_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES public.projects(id),
    client_name text NOT NULL,
    is_active boolean DEFAULT true,
    is_agency boolean DEFAULT false,
    daily_budget numeric DEFAULT 0,
    ad_account_id text,
    page_id text,
    page_name text,
    instagram_user_id text,
    fb_pixel_id text,
    pixel_event text,
    fb_token text,
    wa_instance_id text,
    wa_api_token text,
    telegram_group_id text,
    whatsapp_number text,
    website_url text,
    city text,
    region_key text,
    brief text,
    spend numeric DEFAULT 0,
    meta_leads integer DEFAULT 0,
    visits integer DEFAULT 0,
    sales integer DEFAULT 0,
    revenue numeric DEFAULT 0,
    romi numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- Copy data safely
INSERT INTO public.clients_config (
    id, project_id, client_name, is_active, is_agency, daily_budget, 
    ad_account_id, page_id, page_name, instagram_user_id, fb_pixel_id, 
    pixel_event, fb_token, wa_instance_id, wa_api_token, telegram_group_id, 
    whatsapp_number, website_url, city, region_key, brief, 
    spend, meta_leads, visits, sales, revenue, romi, created_at
)
SELECT 
    id, project_id, client_name, is_active, is_agency, daily_budget, 
    ad_account_id, page_id, page_name, instagram_user_id, fb_pixel_id, 
    pixel_event, fb_token, wa_instance_id, wa_api_token, telegram_group_id, 
    whatsapp_number, website_url, city, region_key, brief, 
    COALESCE(spend, 0), COALESCE(meta_leads, 0), COALESCE(visits, 0), 
    COALESCE(sales, 0), COALESCE(revenue, 0), COALESCE(romi, 0), created_at
FROM public.clients_config_old;

-- 4. Restore Foreign Keys
ALTER TABLE public.daily_metrics ADD CONSTRAINT daily_metrics_client_config_id_fkey 
    FOREIGN KEY (client_config_id) REFERENCES public.clients_config(id) ON DELETE CASCADE;

ALTER TABLE public.scoreboard_plans ADD CONSTRAINT scoreboard_plans_client_config_id_fkey 
    FOREIGN KEY (client_config_id) REFERENCES public.clients_config(id) ON DELETE CASCADE;

ALTER TABLE public.scoreboard_daily_facts ADD CONSTRAINT scoreboard_daily_facts_client_config_id_fkey 
    FOREIGN KEY (client_config_id) REFERENCES public.clients_config(id) ON DELETE CASCADE;

ALTER TABLE public.finance_client_services ADD CONSTRAINT finance_client_services_client_config_id_fkey 
    FOREIGN KEY (client_config_id) REFERENCES public.clients_config(id) ON DELETE CASCADE;

ALTER TABLE public.finance_client_billing ADD CONSTRAINT finance_client_billing_client_config_id_fkey 
    FOREIGN KEY (client_config_id) REFERENCES public.clients_config(id) ON DELETE CASCADE;

-- 5. Restore Views
CREATE OR REPLACE VIEW public.agency_metrics_view AS
WITH aggregated_metrics AS (
  SELECT 
    client_config_id,
    SUM(COALESCE(spend, 0)) as total_spend,
    SUM(COALESCE(leads, 0)) as total_leads,
    SUM(COALESCE(visits, 0)) as total_visits,
    SUM(COALESCE(sales, 0)) as total_sales,
    SUM(COALESCE(revenue, 0)) as total_revenue
  FROM public.daily_metrics
  GROUP BY client_config_id
)
SELECT 
  c.id as client_id,
  c.client_name,
  c.is_active,
  c.project_id,
  c.is_agency,
  (COALESCE(m.total_spend, 0) + COALESCE(c.spend, 0)) as spend,
  (COALESCE(m.total_leads, 0) + COALESCE(c.meta_leads, 0)) as meta_leads,
  (COALESCE(m.total_visits, 0) + COALESCE(c.visits, 0)) as visits,
  (COALESCE(m.total_sales, 0) + COALESCE(c.sales, 0)) as sales,
  (COALESCE(m.total_revenue, 0) + COALESCE(c.revenue, 0)) as revenue,
  CASE 
    WHEN (COALESCE(m.total_leads, 0) + COALESCE(c.meta_leads, 0)) > 0 
    THEN ((COALESCE(m.total_spend, 0) + COALESCE(c.spend, 0))::numeric / (COALESCE(m.total_leads, 0) + COALESCE(c.meta_leads, 0))::numeric)
    ELSE 0 
  END as cpl,
  CASE 
    WHEN (COALESCE(m.total_visits, 0) + COALESCE(c.visits, 0)) > 0 
    THEN ((COALESCE(m.total_spend, 0) + COALESCE(c.spend, 0))::numeric / (COALESCE(m.total_visits, 0) + COALESCE(c.visits, 0))::numeric)
    ELSE 0 
  END as cpv,
  CASE 
    WHEN (COALESCE(m.total_sales, 0) + COALESCE(c.sales, 0)) > 0 
    THEN ((COALESCE(m.total_spend, 0) + COALESCE(c.spend, 0))::numeric / (COALESCE(m.total_sales, 0) + COALESCE(c.sales, 0))::numeric)
    ELSE 0 
  END as cac,
  CASE 
    WHEN (COALESCE(m.total_revenue, 0) + COALESCE(c.revenue, 0)) = 0 THEN 0
    WHEN (COALESCE(m.total_spend, 0) + COALESCE(c.spend, 0)) > 0 
    THEN (( (COALESCE(m.total_revenue, 0) + COALESCE(c.revenue, 0))::numeric - (COALESCE(m.total_spend, 0) + COALESCE(c.spend, 0))::numeric) / (COALESCE(m.total_spend, 0) + COALESCE(c.spend, 0))::numeric * 100)
    ELSE 0
  END as romi
FROM public.clients_config c
LEFT JOIN aggregated_metrics m ON c.id = m.client_config_id;

GRANT SELECT ON public.agency_metrics_view TO authenticated;
GRANT SELECT ON public.agency_metrics_view TO service_role;

-- 6. Absolute RLS Fix
ALTER TABLE public.clients_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_authenticated_manage_clients" ON public.clients_config;
CREATE POLICY "allow_all_authenticated_manage_clients"
  ON public.clients_config FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT ALL ON public.clients_config TO authenticated;

-- 7. Cleanup
DROP TABLE public.clients_config_old;
ANALYZE public.clients_config;

COMMIT;
