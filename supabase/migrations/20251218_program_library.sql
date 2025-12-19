-- 1. Add category to subjects (Programs)
-- Holds high-level categories like "TYT", "AYT", "Diet", "Sports"
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS category TEXT;

-- 2. Create library_items table (Template Tasks)
-- Represents tasks inside a program/module schema (e.g. "Watch Intro Video" on Day 1)
CREATE TABLE IF NOT EXISTS library_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE, -- The Program
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,     -- The Module
  task_type_id UUID NOT NULL REFERENCES task_types(id),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  day_offset INTEGER DEFAULT 0, -- Day number relative to program start (0 = Day 1)
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for library_items

-- Coaches view their own items + system items (if we add system templates later)
CREATE POLICY "Users can view own library items"
  ON library_items FOR SELECT
  USING (created_by = auth.uid());

-- Coaches insert their own items
CREATE POLICY "Users can insert own library items"
  ON library_items FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Coaches update their own items
CREATE POLICY "Users can update own library items"
  ON library_items FOR UPDATE
  USING (created_by = auth.uid());

-- Coaches delete their own library items
CREATE POLICY "Users can delete own library items"
  ON library_items FOR DELETE
  USING (created_by = auth.uid());
