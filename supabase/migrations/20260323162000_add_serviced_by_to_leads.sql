
-- Add serviced_by field to track admins
ALTER TABLE leads ADD COLUMN IF NOT EXISTS serviced_by TEXT;
