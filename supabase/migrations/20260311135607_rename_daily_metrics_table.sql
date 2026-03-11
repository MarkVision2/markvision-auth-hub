-- Rename the daily_metrics table to daily_data to sync with remote changes
ALTER TABLE IF EXISTS public.daily_metrics RENAME TO daily_data;

-- Recreate the view that depended on the old table
DROP VIEW IF EXISTS public.agency_metrics_view;

CREATE OR REPLACE VIEW public.agency_metrics_view AS
WITH aggregated_metrics AS (
  SELECT 
    client_config_id,
    SUM(COALESCE(spend, 0)) as total_spend,
    SUM(COALESCE(leads, 0)) as total_leads,
    SUM(COALESCE(visits, 0)) as total_visits,
    SUM(COALESCE(sales, 0)) as total_sales,
    SUM(COALESCE(revenue, 0)) as total_revenue
  FROM public.daily_data
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

