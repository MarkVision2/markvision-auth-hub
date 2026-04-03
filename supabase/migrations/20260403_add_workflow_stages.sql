-- Add new diagnostic columns to the leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS diagnostic_therapist_answers jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS diagnostic_rehab_answers jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS diagnostic_plan_answers jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS diagnostic_plan_comment text;

-- Refresh the leads_crm view to include these new columns
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
    refusal_reason,
    diagnostic_admin_answers,
    diagnostic_admin_comment,
    diagnostic_therapist_answers,
    diagnostic_rehab_answers,
    diagnostic_plan_answers,
    diagnostic_plan_comment
FROM public.leads;

COMMENT ON VIEW public.leads_crm IS 'Updated CRM view with full 4-stage diagnostic workflow support';
