-- Yapısal Görev Sistemi - Migration
-- Ana Konular, Alt Konular ve Kaynaklar

-- ============================================
-- TABLES
-- ============================================

-- 1. Subjects (Ana Konular / Dersler)
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#4F46E5',
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Topics (Alt Konular)
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Resources (Kaynaklar)
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('video', 'document', 'link', 'book', 'other')),
  url TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tasks tablosuna yeni kolonlar ekle
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES topics(id) ON DELETE SET NULL;

-- ============================================
-- INDEXES
-- ============================================

-- Subjects
CREATE INDEX IF NOT EXISTS idx_subjects_organization ON subjects(organization_id);
CREATE INDEX IF NOT EXISTS idx_subjects_active ON subjects(is_active);
CREATE INDEX IF NOT EXISTS idx_subjects_created_by ON subjects(created_by);

-- Topics
CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_active ON topics(is_active);
CREATE INDEX IF NOT EXISTS idx_topics_order ON topics(subject_id, order_index);

-- Resources
CREATE INDEX IF NOT EXISTS idx_resources_subject ON resources(subject_id);
CREATE INDEX IF NOT EXISTS idx_resources_topic ON resources(topic_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_active ON resources(is_active);

-- Tasks - new columns
CREATE INDEX IF NOT EXISTS idx_tasks_subject ON tasks(subject_id);
CREATE INDEX IF NOT EXISTS idx_tasks_topic ON tasks(topic_id);

-- ============================================
-- TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_subjects_updated_at ON subjects;
CREATE TRIGGER update_subjects_updated_at 
  BEFORE UPDATE ON subjects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_topics_updated_at ON topics;
CREATE TRIGGER update_topics_updated_at 
  BEFORE UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_resources_updated_at ON resources;
CREATE TRIGGER update_resources_updated_at 
  BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - Subjects
-- ============================================

-- Everyone can view active subjects
DROP POLICY IF EXISTS "Anyone can view active subjects" ON subjects;
CREATE POLICY "Anyone can view active subjects"
  ON subjects FOR SELECT
  USING (is_active = true);

-- Admins can manage subjects
DROP POLICY IF EXISTS "Admins can manage subjects" ON subjects;
CREATE POLICY "Admins can manage subjects"
  ON subjects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND 'admin' = ANY(users.roles)
    )
  );

-- ============================================
-- RLS POLICIES - Topics
-- ============================================

-- Everyone can view active topics
DROP POLICY IF EXISTS "Anyone can view active topics" ON topics;
CREATE POLICY "Anyone can view active topics"
  ON topics FOR SELECT
  USING (is_active = true);

-- Admins can manage topics
DROP POLICY IF EXISTS "Admins can manage topics" ON topics;
CREATE POLICY "Admins can manage topics"
  ON topics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND 'admin' = ANY(users.roles)
    )
  );

-- ============================================
-- RLS POLICIES - Resources
-- ============================================

-- Everyone can view active resources
DROP POLICY IF EXISTS "Anyone can view active resources" ON resources;
CREATE POLICY "Anyone can view active resources"
  ON resources FOR SELECT
  USING (is_active = true);

-- Admins can manage resources
DROP POLICY IF EXISTS "Admins can manage resources" ON resources;
CREATE POLICY "Admins can manage resources"
  ON resources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND 'admin' = ANY(users.roles)
    )
  );

-- ============================================
-- SEED DATA - Example Subjects and Topics
-- ============================================

-- Example 1: Matematik
INSERT INTO subjects (name, description, icon, color, created_by, is_active)
SELECT 
  'Matematik',
  'Matematik dersi konuları',
  '📐',
  '#3B82F6',
  id,
  true
FROM users
WHERE 'admin' = ANY(roles)
LIMIT 1
ON CONFLICT DO NOTHING;

-- Example 2: Tai Chi
INSERT INTO subjects (name, description, icon, color, created_by, is_active)
SELECT 
  'Tai Chi',
  'Tai Chi hareketleri ve formlar',
  '☯️',
  '#10B981',
  id,
  true
FROM users
WHERE 'admin' = ANY(roles)
LIMIT 1
ON CONFLICT DO NOTHING;

-- Topics for Matematik
INSERT INTO topics (subject_id, name, description, order_index, created_by)
SELECT 
  s.id,
  'Trigonometri',
  'Sin, Cos, Tan fonksiyonları',
  1,
  u.id
FROM subjects s, users u
WHERE s.name = 'Matematik'
AND 'admin' = ANY(u.roles)
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, created_by)
SELECT 
  s.id,
  'Geometri',
  'Şekiller ve hesaplamalar',
  2,
  u.id
FROM subjects s, users u
WHERE s.name = 'Matematik'
AND 'admin' = ANY(u.roles)
LIMIT 1
ON CONFLICT DO NOTHING;

-- Topics for Tai Chi
INSERT INTO topics (subject_id, name, description, order_index, created_by)
SELECT 
  s.id,
  'Yang Formu',
  '24 hareket Yang formu',
  1,
  u.id
FROM subjects s, users u
WHERE s.name = 'Tai Chi'
AND 'admin' = ANY(u.roles)
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO topics (subject_id, name, description, order_index, created_by)
SELECT 
  s.id,
  'Chen Formu',
  'Chen stili hareketleri',
  2,
  u.id
FROM subjects s, users u
WHERE s.name = 'Tai Chi'
AND 'admin' = ANY(u.roles)
LIMIT 1
ON CONFLICT DO NOTHING;
