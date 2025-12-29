-- migration 20251228_official_templates.sql

BEGIN;

-- 1. Create System User if not exists
INSERT INTO users (id, email, name, roles)
VALUES ('00000000-0000-0000-0000-000000000000', 'system@ajanda.com', 'System', '{"admin"}')
ON CONFLICT (id) DO NOTHING;

-- 2. Add is_official column to projects
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT false;

-- 3. Update RLS for projects
-- Allow all authenticated users to read official templates
DROP POLICY IF EXISTS "Anyone can view official templates" ON projects;
CREATE POLICY "Anyone can view official templates"
  ON projects FOR SELECT
  USING (is_official = true);

-- Allow all authenticated users to read tasks of official templates
DROP POLICY IF EXISTS "Anyone can view tasks of official templates" ON tasks;
CREATE POLICY "Anyone can view tasks of official templates"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tasks.project_id
      AND projects.is_official = true
    )
  );

-- 4. Seed Official Templates Data

-- TYT Matematik - 30 Gün Yoğun
INSERT INTO projects (id, user_id, name, description, is_template, is_official, module, settings, type)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'TYT Matematik - 30 Gün Yoğun',
  'Temel matematik konularını 30 günde tamamlayan yoğun program',
  true, true, 'exam',
  '{"duration_days": 30, "difficulty": "intermediate", "tags": ["TYT", "Matematik", "Yoğun"]}',
  'program'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  settings = EXCLUDED.settings;

-- TYT Matematik - 5 Gün Hızlı
INSERT INTO projects (id, user_id, name, description, is_template, is_official, module, settings, type)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'TYT Matematik - 5 Gün Hızlı',
  'Temel matematik konularını 5 günde gözden geçirme',
  true, true, 'exam',
  '{"duration_days": 5, "difficulty": "beginner", "tags": ["TYT", "Matematik", "Hızlı"]}',
  'program'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  settings = EXCLUDED.settings;

-- 7 Günlük Dengeli Beslenme
INSERT INTO projects (id, user_id, name, description, is_template, is_official, module, settings, type)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  '7 Günlük Dengeli Beslenme',
  'Günlük 1850 kalori hedefli dengeli beslenme programı',
  true, true, 'nutrition',
  '{"duration_days": 7, "difficulty": "beginner", "tags": ["Dengeli", "Kilo Koruma"]}',
  'program'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  settings = EXCLUDED.settings;

-- Gitar Başlangıç - 30 Gün
INSERT INTO projects (id, user_id, name, description, is_template, is_official, module, settings, type)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'Gitar Başlangıç - 30 Gün',
  'Temel gitar teknikleri ve ilk eserler',
  true, true, 'music',
  '{"duration_days": 30, "difficulty": "beginner", "tags": ["Gitar", "Başlangıç"]}',
  'program'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  settings = EXCLUDED.settings;

-- Frontend Temelleri - 14 Gün
INSERT INTO projects (id, user_id, name, description, is_template, is_official, module, settings, type)
VALUES (
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000000',
  'Frontend Temelleri - 14 Gün',
  'HTML, CSS, JavaScript temel eğitimi',
  true, true, 'coding',
  '{"duration_days": 14, "difficulty": "beginner", "tags": ["Frontend", "Web", "JavaScript"]}',
  'program'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  settings = EXCLUDED.settings;

COMMIT;
