-- Add missing indexes on project_id columns to fix full table scans
-- These tables had project_id columns added but no indexes, causing performance issues

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_bridge_tasks_project_id
  ON ai_bridge_tasks(project_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_nps_feedback_project_id
  ON nps_feedback(project_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_retention_tasks_project_id
  ON retention_tasks(project_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_retention_templates_project_id
  ON retention_templates(project_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_rop_audits_project_id
  ON ai_rop_audits(project_id);

-- Also add composite index on ai_bridge_tasks for the hot polling query:
-- SELECT * FROM ai_bridge_tasks WHERE status = 'pending' ORDER BY created_at ASC LIMIT 1
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_bridge_tasks_status_created
  ON ai_bridge_tasks(status, created_at ASC)
  WHERE status IN ('pending', 'running');
