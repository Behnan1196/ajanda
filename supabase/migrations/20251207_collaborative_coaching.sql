-- Remove unique constraint to allow multiple coaches per student
ALTER TABLE public.user_relationships 
DROP CONSTRAINT IF EXISTS user_relationships_coach_id_student_id_key;

-- Add role_label to distinguish roles (e.g. 'Matematik Koçu', 'Diyetisyen')
ALTER TABLE public.user_relationships 
ADD COLUMN IF NOT EXISTS role_label TEXT DEFAULT 'Genel Koç';

-- Re-create unique constraint including role_label to prevent duplicate exact assignments
-- But functionally we allow multiple rows with same student_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_relationships_unique_assignment 
ON public.user_relationships(coach_id, student_id, role_label);
