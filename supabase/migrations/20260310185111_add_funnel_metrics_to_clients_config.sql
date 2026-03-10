-- Add impressions and clicks columns to clients_config for manual funnel data entry
ALTER TABLE clients_config ADD COLUMN IF NOT EXISTS impressions BIGINT DEFAULT 0;
ALTER TABLE clients_config ADD COLUMN IF NOT EXISTS clicks BIGINT DEFAULT 0;
