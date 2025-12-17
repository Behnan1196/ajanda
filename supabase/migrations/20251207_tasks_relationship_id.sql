-- Add relationship_id to tasks to track which coach role assigned it
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS relationship_id UUID REFERENCES public.user_relationships(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_relationship_id ON public.tasks(relationship_id);
