-- Create project_resources table for storing links, documents, and notes
CREATE TABLE IF NOT EXISTS project_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE, -- Optional: link to specific task/milestone
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('link', 'document', 'note')),
    url TEXT,
    content TEXT,
    icon TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_project_resources_project ON project_resources(project_id);
CREATE INDEX IF NOT EXISTS idx_project_resources_type ON project_resources(type);

-- Add RLS policies
ALTER TABLE project_resources ENABLE ROW LEVEL SECURITY;

-- Users can view resources for their projects
CREATE POLICY "Users can view project resources"
    ON project_resources FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Users can create resources for their projects
CREATE POLICY "Users can create project resources"
    ON project_resources FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
        AND created_by = auth.uid()
    );

-- Users can update their own resources
CREATE POLICY "Users can update own resources"
    ON project_resources FOR UPDATE
    USING (created_by = auth.uid());

-- Users can delete their own resources
CREATE POLICY "Users can delete own resources"
    ON project_resources FOR DELETE
    USING (created_by = auth.uid());
