-- Add sort_order columns to habits and tasks tables
-- This enables custom user-defined ordering with drag & drop

-- Add sort_order to habits table
ALTER TABLE habits ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Update existing habits with incremental order (oldest first, so newest will be at bottom)
UPDATE habits 
SET sort_order = subquery.row_num
FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) as row_num
    FROM habits
    WHERE sort_order = 0 OR sort_order IS NULL
) AS subquery
WHERE habits.id = subquery.id;

-- Add sort_order to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Update existing tasks with incremental order (oldest first, grouped by user and date)
UPDATE tasks 
SET sort_order = subquery.row_num
FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, due_date ORDER BY created_at ASC) as row_num
    FROM tasks
    WHERE (sort_order = 0 OR sort_order IS NULL) AND project_id IS NULL
) AS subquery
WHERE tasks.id = subquery.id;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_habits_sort_order ON habits(user_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON tasks(user_id, due_date, sort_order);

-- Verify the changes
SELECT 'Habits updated' as status, COUNT(*) as count FROM habits WHERE sort_order > 0;
SELECT 'Tasks updated' as status, COUNT(*) as count FROM tasks WHERE sort_order > 0;
