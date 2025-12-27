-- Add is_template column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;

-- Create index for template queries
CREATE INDEX IF NOT EXISTS idx_projects_is_template 
ON projects(is_template) WHERE is_template = true;

-- Comment
COMMENT ON COLUMN projects.is_template IS 'Indicates if this project is a reusable template';
