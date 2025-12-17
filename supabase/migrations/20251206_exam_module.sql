
-- Exam Templates Table
CREATE TABLE IF NOT EXISTS public.exam_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    sections JSONB NOT NULL DEFAULT '[]', -- e.g., [{"key": "math", "name": "Matematik", "question_count": 40}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Exams Table
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES public.exam_templates(id),
    name TEXT NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Exam Results Table
CREATE TABLE IF NOT EXISTS public.exam_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    exam_id UUID REFERENCES public.exams(id) NOT NULL,
    details JSONB NOT NULL DEFAULT '{}', -- e.g., {"math": {"correct": 30, "incorrect": 5, "empty": 5}}
    total_net NUMERIC(5, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, exam_id)
);

-- RLS Policies
ALTER TABLE public.exam_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- Exam Templates
DROP POLICY IF EXISTS "Templates are viewable by everyone" ON public.exam_templates;
CREATE POLICY "Templates are viewable by everyone" ON public.exam_templates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage templates" ON public.exam_templates;
CREATE POLICY "Admins can manage templates" ON public.exam_templates FOR ALL USING (
  exists (select 1 from public.users where id = auth.uid() and 'admin' = ANY(roles))
);

-- Exams
DROP POLICY IF EXISTS "Exams are viewable by everyone" ON public.exams;
CREATE POLICY "Exams are viewable by everyone" ON public.exams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage exams" ON public.exams;
CREATE POLICY "Admins can manage exams" ON public.exams FOR ALL USING (
  exists (select 1 from public.users where id = auth.uid() and 'admin' = ANY(roles))
);

-- Exam Results
DROP POLICY IF EXISTS "Users can manage own results" ON public.exam_results;
CREATE POLICY "Users can manage own results" ON public.exam_results FOR ALL USING (
  auth.uid() = user_id
);

-- Drop old name if exists from previous run attempt
DROP POLICY IF EXISTS "Coaches can view assigned student results" ON public.exam_results;
DROP POLICY IF EXISTS "Coaches can manage assigned student results" ON public.exam_results;

CREATE POLICY "Coaches can manage assigned student results" ON public.exam_results FOR ALL USING (
  exists (
    select 1 from public.user_relationships
    where coach_id = auth.uid() and student_id = exam_results.user_id and is_active = true
  )
);
