-- Update agency_metrics_view to include project_id and is_agency for dashboard filtering
DROP VIEW IF EXISTS agency_metrics_view;

CREATE OR REPLACE VIEW agency_metrics_view AS
WITH period_metrics AS (
  SELECT 
    client_config_id,
    SUM(spend) as total_spend,
    SUM(leads) as total_leads,
    SUM(clicks) as total_clicks,
    SUM(impressions) as total_impressions,
    SUM(visits) as total_visits,
    SUM(sales) as total_sales,
    SUM(revenue) as total_revenue
  FROM daily_metrics
  GROUP BY client_config_id
)
SELECT 
  cc.id as client_id,
  cc.client_name,
  cc.project_id,
  cc.is_agency,
  cc.is_active,
  COALESCE(pm.total_spend, 0) + COALESCE(cc.spend, 0) as spend,
  COALESCE(pm.total_leads, 0) + COALESCE(cc.meta_leads, 0) as meta_leads,
  COALESCE(pm.total_revenue, 0) + COALESCE(cc.revenue, 0) as revenue,
  COALESCE(pm.total_visits, 0) + COALESCE(cc.visits, 0) as visits,
  COALESCE(pm.total_sales, 0) + COALESCE(cc.sales, 0) as sales,
  CASE 
    WHEN (COALESCE(pm.total_spend, 0) + COALESCE(cc.spend, 0)) > 0 
    THEN ((COALESCE(pm.total_revenue, 0) + COALESCE(cc.revenue, 0)) - (COALESCE(pm.total_spend, 0) + COALESCE(cc.spend, 0))) / (COALESCE(pm.total_spend, 0) + COALESCE(cc.spend, 0)) * 100 
    ELSE 0 
  END as romi,
  CASE 
    WHEN (COALESCE(pm.total_leads, 0) + COALESCE(cc.meta_leads, 0)) > 0 
    THEN (COALESCE(pm.total_spend, 0) + COALESCE(cc.spend, 0)) / (COALESCE(pm.total_leads, 0) + COALESCE(cc.meta_leads, 0))
    ELSE 0 
  END as cpl,
  CASE 
    WHEN (COALESCE(pm.total_visits, 0) + COALESCE(cc.visits, 0)) > 0 
    THEN (COALESCE(pm.total_spend, 0) + COALESCE(cc.spend, 0)) / (COALESCE(pm.total_visits, 0) + COALESCE(cc.visits, 0))
    ELSE 0 
  END as cpv,
  CASE 
    WHEN (COALESCE(pm.total_sales, 0) + COALESCE(cc.sales, 0)) > 0 
    THEN (COALESCE(pm.total_spend, 0) + COALESCE(cc.spend, 0)) / (COALESCE(pm.total_sales, 0) + COALESCE(cc.sales, 0))
    ELSE 0 
  END as cac
FROM clients_config cc
LEFT JOIN period_metrics pm ON cc.id = pm.client_config_id;
