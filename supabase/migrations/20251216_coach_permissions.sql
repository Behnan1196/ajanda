-- Update the UPDATE policy for tasks to allow coaches to update their students' tasks
-- This covers the case where a student created the task (created_by = student), 
-- but the coach needs to mark it as completed/uncompleted.

DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;

CREATE POLICY "Users can update their own tasks"
ON tasks FOR UPDATE
USING (
    user_id = auth.uid()
    OR
    created_by = auth.uid()
    OR 
    assigned_by = auth.uid()
    OR
    (
        -- Allow coach to update if they have an active relationship
        EXISTS (
            SELECT 1 FROM user_relationships ur
            WHERE ur.coach_id = auth.uid()
            AND ur.student_id = tasks.user_id
            AND ur.is_active = true
        )
        AND (is_private = false OR created_by = auth.uid()) -- Respect privacy
    )
)
WITH CHECK (
    user_id = auth.uid()
    OR
    created_by = auth.uid()
    OR
    assigned_by = auth.uid()
    OR
    (
        EXISTS (
            SELECT 1 FROM user_relationships ur
            WHERE ur.coach_id = auth.uid()
            AND ur.student_id = tasks.user_id
            AND ur.is_active = true
        )
        AND (is_private = false OR created_by = auth.uid())
    )
);
