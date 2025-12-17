-- Add is_system column to identify standard vs custom subjects
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to ensure clean state
DROP POLICY IF EXISTS "Users can view own or system subjects" ON subjects;
DROP POLICY IF EXISTS "Users can manage own subjects" ON subjects;
DROP POLICY IF EXISTS "Users can view own or system topics" ON topics;
DROP POLICY IF EXISTS "Users can manage own topics" ON topics;

-- SUBJECTS POLICIES
-- 1. Select: Users can view their own subjects OR system subjects
CREATE POLICY "Users can view own or system subjects"
ON subjects FOR SELECT
USING (created_by = auth.uid() OR is_system = true);

-- 2. Insert/Update/Delete: Users can manage ONLY their own subjects
-- Note: Admin/System management is separate or implied if created_by matches
CREATE POLICY "Users can manage own subjects"
ON subjects FOR ALL
USING (created_by = auth.uid());


-- TOPICS POLICIES
-- 1. Select: Users can view topics of visible subjects
CREATE POLICY "Users can view own or system topics"
ON topics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM subjects 
    WHERE subjects.id = topics.subject_id 
    AND (subjects.created_by = auth.uid() OR subjects.is_system = true)
  )
);

-- 2. Insert/Update/Delete: Users can manage topics for their own subjects
CREATE POLICY "Users can manage own topics"
ON topics FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM subjects 
    WHERE subjects.id = topics.subject_id 
    AND subjects.created_by = auth.uid()
  )
);
