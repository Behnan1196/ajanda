-- Add is_private column to tasks table (if not already added)
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false; 
-- Commented out the column add in case it partially ran, but usually 'IF NOT EXISTS' handles it.
-- Let's assume user might created it or failed before. Safest is IF NOT EXISTS.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Update RLS Policies for Tasks

-- Drop existing policies to redefine them
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Coaches can view their students' tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

-- 1. SELECT: Users can view their own tasks
CREATE POLICY "Users can view their own tasks"
ON tasks FOR SELECT
USING (
    user_id = auth.uid() -- Student viewing their own
    OR
    assigned_by = auth.uid() -- Coach viewing tasks they assigned
    OR
    (
        -- Coach viewing student tasks (Public only)
        EXISTS (
            SELECT 1 FROM user_relationships ur
            WHERE ur.coach_id = auth.uid()
            AND ur.student_id = tasks.user_id
            AND ur.is_active = true
        )
        AND
        (is_private = false OR created_by = auth.uid()) -- Only show public tasks or tasks created by the coach themselves
    )
);

-- 2. INSERT: Users can create tasks
CREATE POLICY "Users can create tasks"
ON tasks FOR INSERT
WITH CHECK (
    user_id = auth.uid() -- Student creating for themselves
    OR
    assigned_by = auth.uid() -- Coach assigning to others
    OR
    EXISTS (
        SELECT 1 FROM user_relationships ur
        WHERE ur.coach_id = auth.uid()
        AND ur.student_id = tasks.user_id
        AND ur.is_active = true
    )
);

-- 3. UPDATE: Users can update their own tasks or tasks they assigned
CREATE POLICY "Users can update their own tasks"
ON tasks FOR UPDATE
USING (
    user_id = auth.uid()
    OR
    created_by = auth.uid()
    OR 
    assigned_by = auth.uid() -- Coach can update tasks they assigned
)
WITH CHECK (
    user_id = auth.uid()
    OR
    created_by = auth.uid()
    OR
    assigned_by = auth.uid()
);

-- 4. DELETE: Users can delete their own tasks or tasks they assigned
CREATE POLICY "Users can delete their own tasks"
ON tasks FOR DELETE
USING (
    user_id = auth.uid()
    OR
    created_by = auth.uid() -- Coach can delete tasks they created
    OR
    assigned_by = auth.uid() -- Coach can delete tasks they assigned
);
