-- migration 20251228_visibility_fix.sql

BEGIN;

-- 1. Add is_coach_project column to projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS is_coach_project BOOLEAN DEFAULT false;

-- 2. Update existing data if necessary (optional but good practice)
-- If we had projects with settings->is_coach_project = true, we could sync them:
-- UPDATE projects SET is_coach_project = true WHERE (settings->>'is_coach_project')::boolean = true;

-- 3. Comment
COMMENT ON COLUMN projects.is_coach_project IS 'True if the project was assigned by a coach to a student';

COMMIT;
