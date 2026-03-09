
-- Add/Ensure fields in clients_config
ALTER TABLE public.clients_config
  ADD COLUMN IF NOT EXISTS visits integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sales integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenue numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS romi numeric DEFAULT 0;

-- Restore RLS for clients_config
ALTER TABLE public.clients_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Project members manage clients_config" ON public.clients_config;
CREATE POLICY "Project members manage clients_config"
ON public.clients_config
FOR ALL
TO authenticated
USING (public.is_project_member(project_id))
WITH CHECK (public.is_project_member(project_id));

-- Restore RLS for leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Project members manage leads" ON public.leads;
CREATE POLICY "Project members manage leads"
ON public.leads
FOR ALL
TO authenticated
USING (public.is_project_member(project_id))
WITH CHECK (public.is_project_member(project_id));

-- Restore RLS for daily_metrics
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Project members manage daily_metrics" ON public.daily_metrics;
CREATE POLICY "Project members manage daily_metrics"
ON public.daily_metrics
FOR ALL
TO authenticated
USING (public.is_project_member(project_id))
WITH CHECK (public.is_project_member(project_id));

-- Redefine agency_metrics_view to be additive (Manual + Tracked)
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
    -- If revenue is 0, ROMI is 0 as requested
    WHEN (COALESCE(m.total_revenue, 0) + COALESCE(c.revenue, 0)) = 0 THEN 0
    -- If spend is > 0, calculate ROMI
    WHEN (COALESCE(m.total_spend, 0) + COALESCE(c.spend, 0)) > 0 
    THEN (( (COALESCE(m.total_revenue, 0) + COALESCE(c.revenue, 0))::numeric - (COALESCE(m.total_spend, 0) + COALESCE(c.spend, 0))::numeric) / (COALESCE(m.total_spend, 0) + COALESCE(c.spend, 0))::numeric * 100)
    -- Fallback to manual ROMI if spend is 0 but revenue is non-zero (or just fallback)
    ELSE COALESCE(c.romi, 0)
  END as romi
FROM public.clients_config c
LEFT JOIN aggregated_metrics m ON c.id = m.client_config_id;

-- Grant access to the view
GRANT SELECT ON public.agency_metrics_view TO authenticated;
GRANT SELECT ON public.agency_metrics_view TO service_role;
