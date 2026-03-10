
-- Add project_id to ai_bridge_tasks if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ai_bridge_tasks' AND COLUMN_NAME = 'project_id') THEN
        ALTER TABLE ai_bridge_tasks ADD COLUMN project_id UUID REFERENCES projects(id);
    END IF;
END $$;

-- Enable RLS on AI and Retention tables
ALTER TABLE ai_bridge_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE nps_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_rop_audits ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for project isolation
DROP POLICY IF EXISTS "Users can view their project's ai_bridge_tasks" ON ai_bridge_tasks;
CREATE POLICY "Users can view their project's ai_bridge_tasks" ON ai_bridge_tasks
    FOR SELECT USING (project_id IS NOT NULL);

DROP POLICY IF EXISTS "Users can insert their project's ai_bridge_tasks" ON ai_bridge_tasks;
CREATE POLICY "Users can insert their project's ai_bridge_tasks" ON ai_bridge_tasks
    FOR INSERT WITH CHECK (project_id IS NOT NULL);

DROP POLICY IF EXISTS "Users can view their project's nps_feedback" ON nps_feedback;
CREATE POLICY "Users can view their project's nps_feedback" ON nps_feedback
    FOR SELECT USING (project_id IS NOT NULL);

DROP POLICY IF EXISTS "Users can view their project's retention_tasks" ON retention_tasks;
CREATE POLICY "Users can view their project's retention_tasks" ON retention_tasks
    FOR SELECT USING (project_id IS NOT NULL);

DROP POLICY IF EXISTS "Users can insert their project's retention_tasks" ON retention_tasks;
CREATE POLICY "Users can insert their project's retention_tasks" ON retention_tasks
    FOR INSERT WITH CHECK (project_id IS NOT NULL);

DROP POLICY IF EXISTS "Users can view their project's retention_templates" ON retention_templates;
CREATE POLICY "Users can view their project's retention_templates" ON retention_templates
    FOR SELECT USING (project_id IS NOT NULL);

DROP POLICY IF EXISTS "Users can view their project's ai_rop_audits" ON ai_rop_audits;
CREATE POLICY "Users can view their project's ai_rop_audits" ON ai_rop_audits
    FOR SELECT USING (project_id IS NOT NULL);
