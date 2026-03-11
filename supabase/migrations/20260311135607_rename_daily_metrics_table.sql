-- Rename the daily_metrics table to daily_data to sync with remote changes
ALTER TABLE IF EXISTS public.daily_metrics RENAME TO daily_data;

-- Recreate the view that depended on the old table
DROP VIEW IF EXISTS public.agency_metrics_view;

CREATE OR REPLACE VIEW public.agency_metrics_view AS
SELECT c.id AS client_id,
    c.client_name,
    c.status,
    c.project_id,
    c.is_agency,
    COALESCE(sum(m.spend), (0)::numeric) AS spend,
    COALESCE(sum(m.leads), (0)::bigint) AS leads,
    COALESCE(sum(m.sales), (0)::bigint) AS sales,
    COALESCE(sum(m.revenue), (0)::numeric) AS revenue,
    CASE
        WHEN (COALESCE(sum(m.spend), (0)::numeric) > (0)::numeric) THEN round(((COALESCE(sum(m.revenue), (0)::numeric) / COALESCE(sum(m.spend), (0)::numeric)) * (100)::numeric), 2)
        ELSE (0)::numeric
    END AS romi,
    CASE
        WHEN (COALESCE(sum(m.leads), (0)::bigint) > 0) THEN round((COALESCE(sum(m.spend), (0)::numeric) / (COALESCE(sum(m.leads), (0)::bigint))::numeric), 2)
        ELSE (0)::numeric
    END AS cac
FROM (public.clients_config c
LEFT JOIN public.daily_data m ON ((c.id = m.client_id)))
WHERE (c.is_active = true)
GROUP BY c.id, c.client_name, c.status, c.project_id, c.is_agency;
