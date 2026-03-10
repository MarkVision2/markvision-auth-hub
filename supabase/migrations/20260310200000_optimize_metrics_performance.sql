
-- Migration to optimize performance of metrics and tracking tables
-- This ensures that as the 'daily_metrics' and 'leads' tables grow, 
-- queries remain nearly instantaneous.

-- 1. Optimize daily_metrics for period-based lookups per client/project
CREATE INDEX IF NOT EXISTS idx_daily_metrics_client_date 
ON public.daily_metrics (client_config_id, date);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_project_date 
ON public.daily_metrics (project_id, date);

-- 2. Optimize leads for project-based views and date sorting
CREATE INDEX IF NOT EXISTS idx_leads_project_created 
ON public.leads (project_id, created_at DESC);

-- 3. Optimize monthly_plans for project lookups
CREATE INDEX IF NOT EXISTS idx_monthly_plans_project_month 
ON public.monthly_plans (project_id, month_year);

-- 4. Analyze tables to refresh statistics for the planner
ANALYZE public.daily_metrics;
ANALYZE public.leads;
ANALYZE public.monthly_plans;
