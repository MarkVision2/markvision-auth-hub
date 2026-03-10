ALTER TABLE clients_config ADD COLUMN IF NOT EXISTS is_agency BOOLEAN DEFAULT false;
UPDATE clients_config SET is_agency = true WHERE project_id = 'hq';
