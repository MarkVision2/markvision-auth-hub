-- Add pipeline and refusal_reason to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS pipeline TEXT DEFAULT 'main',
ADD COLUMN IF NOT EXISTS refusal_reason TEXT;

-- Update existing leads to 'main' pipeline if they don't have one
UPDATE leads SET pipeline = 'main' WHERE pipeline IS NULL;

-- Add comment for clarity
COMMENT ON COLUMN leads.pipeline IS 'CRM pipeline identifier (main or doctor)';
COMMENT ON COLUMN leads.refusal_reason IS 'Reason for treatment refusal provided by doctor';
