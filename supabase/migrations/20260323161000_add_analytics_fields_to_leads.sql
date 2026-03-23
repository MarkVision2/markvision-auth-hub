
-- Add analytics fields to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_diagnostic BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS prescribed_packages JSONB DEFAULT '[]';

-- Update existing leads (optional, based on status)
UPDATE leads SET is_diagnostic = true WHERE status IN ('Записан', 'Визит совершен');
