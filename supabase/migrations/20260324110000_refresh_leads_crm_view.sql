-- Refresh leads_crm view to include all new columns added after initial view creation
-- New columns: pipeline, is_diagnostic, prescribed_packages, serviced_by, refusal_reason

DROP VIEW IF EXISTS public.leads_crm;

CREATE OR REPLACE VIEW public.leads_crm AS
SELECT
    id,
    name,
    phone,
    status,
    amount,
    source,
    utm_campaign,
    utm_source,
    utm_medium,
    utm_content,
    utm_term,
    ai_score,
    ai_summary,
    created_at,
    updated_at,
    scheduled_at,
    doctor_name,
    office_name,
    project_id,
    pipeline,
    is_diagnostic,
    prescribed_packages,
    serviced_by,
    refusal_reason
FROM public.leads;

-- Ensure RLS policies work through the view
-- The view inherits the RLS from the underlying leads table
COMMENT ON VIEW public.leads_crm IS 'CRM view of the leads table with all columns including pipeline and diagnostics';
