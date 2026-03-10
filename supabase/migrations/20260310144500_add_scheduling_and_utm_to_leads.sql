-- Migration to add scheduling and UTM fields to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_content TEXT,
ADD COLUMN IF NOT EXISTS utm_term TEXT,
ADD COLUMN IF NOT EXISTS doctor_name TEXT,
ADD COLUMN IF NOT EXISTS office_name TEXT;

-- Update existing comments or add new ones if needed
COMMENT ON COLUMN leads.scheduled_at IS 'Appointment date and time for the lead';
COMMENT ON COLUMN leads.utm_source IS 'UTM source attribute';
COMMENT ON COLUMN leads.utm_medium IS 'UTM medium attribute';
COMMENT ON COLUMN leads.utm_content IS 'UTM content attribute';
COMMENT ON COLUMN leads.utm_term IS 'UTM term attribute';
