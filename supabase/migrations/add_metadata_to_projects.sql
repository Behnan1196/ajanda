-- Add metadata column to projects table for status, priority, color, and progress tracking
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for faster metadata queries
CREATE INDEX IF NOT EXISTS idx_projects_metadata ON projects USING gin(metadata);

-- Add comment for documentation
COMMENT ON COLUMN projects.metadata IS 'Stores project metadata including status (planning/active/on-hold/completed), priority (low/medium/high/critical), color, and progress_percentage';
