-- ============================================
-- TABLES
-- ============================================

-- 1. Organizations (multi-tenant support)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Users (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  roles TEXT[] NOT NULL DEFAULT '{"student"}',
  organization_id UUID REFERENCES organizations(id),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User Relationships (Coach-Student)
CREATE TABLE IF NOT EXISTS user_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(coach_id, student_id)
);

-- 4. Task Types
CREATE TABLE IF NOT EXISTS task_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  description TEXT,
  schema JSONB NOT NULL,
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_type_id UUID NOT NULL REFERENCES task_types(id),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  due_date DATE,
  due_time TIME,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES users(id),
  assigned_by UUID REFERENCES users(id),
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  tags TEXT[],
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Reminders
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  remind_at TIMESTAMP WITH TIME ZONE NOT NULL,
  notification_type TEXT DEFAULT 'push',
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_roles ON users USING GIN(roles);

-- Organizations
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active);

-- User Relationships
CREATE INDEX IF NOT EXISTS idx_relationships_coach ON user_relationships(coach_id);
CREATE INDEX IF NOT EXISTS idx_relationships_student ON user_relationships(student_id);
CREATE INDEX IF NOT EXISTS idx_relationships_active ON user_relationships(is_active);

-- Task Types
CREATE INDEX IF NOT EXISTS idx_task_types_slug ON task_types(slug);
CREATE INDEX IF NOT EXISTS idx_task_types_active ON task_types(is_active);

-- Tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(task_type_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(is_completed);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_tasks_tags ON tasks USING GIN(tags);

-- Reminders
CREATE INDEX IF NOT EXISTS idx_reminders_task ON reminders(task_id);
CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON reminders(remind_at);
CREATE INDEX IF NOT EXISTS idx_reminders_not_sent ON reminders(is_sent) WHERE is_sent = false;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Apply update_updated_at trigger to all tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at 
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_relationships_updated_at ON user_relationships;
CREATE TRIGGER update_user_relationships_updated_at 
  BEFORE UPDATE ON user_relationships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_types_updated_at ON task_types;
CREATE TRIGGER update_task_types_updated_at 
  BEFORE UPDATE ON task_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at 
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA - Default Task Types
-- ============================================

INSERT INTO task_types (name, slug, icon, schema, is_system) VALUES
('Video İzleme', 'video', 'play-circle', '{
  "fields": [
    {"name": "video_url", "type": "url", "label": "Video Linki", "required": true, "placeholder": "https://youtube.com/watch?v=..."},
    {"name": "duration", "type": "number", "label": "Süre (dakika)", "required": false, "min": 1}
  ]
}', true),
('Yapılacak', 'todo', 'check-square', '{
  "fields": [
    {"name": "notes", "type": "textarea", "label": "Notlar", "required": false}
  ]
}', true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - Users
-- ============================================

-- Users can view own profile
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update own profile
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Coaches can view their students
DROP POLICY IF EXISTS "Coaches can view their students" ON users;
CREATE POLICY "Coaches can view their students"
  ON users FOR SELECT
  USING (
    id IN (
      SELECT student_id FROM user_relationships
      WHERE coach_id = auth.uid() AND is_active = true
    )
  );

-- ============================================
-- RLS POLICIES - Tasks
-- ============================================

-- Users can view own tasks
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (user_id = auth.uid());

-- Users can create own tasks
DROP POLICY IF EXISTS "Users can create own tasks" ON tasks;
CREATE POLICY "Users can create own tasks"
  ON tasks FOR INSERT
  WITH CHECK (user_id = auth.uid() AND created_by = auth.uid());

-- Users can update own tasks
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete own tasks
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (user_id = auth.uid());

-- Coaches can view student tasks
DROP POLICY IF EXISTS "Coaches can view student tasks" ON tasks;
CREATE POLICY "Coaches can view student tasks"
  ON tasks FOR SELECT
  USING (
    user_id IN (
      SELECT student_id FROM user_relationships
      WHERE coach_id = auth.uid() AND is_active = true
    )
  );

-- Coaches can create tasks for students
DROP POLICY IF EXISTS "Coaches can create tasks for students" ON tasks;
CREATE POLICY "Coaches can create tasks for students"
  ON tasks FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    assigned_by = auth.uid() AND
    user_id IN (
      SELECT student_id FROM user_relationships
      WHERE coach_id = auth.uid() AND is_active = true
    )
  );

-- ============================================
-- RLS POLICIES - Task Types
-- ============================================

-- Everyone can view active task types
DROP POLICY IF EXISTS "Anyone can view active task types" ON task_types;
CREATE POLICY "Anyone can view active task types"
  ON task_types FOR SELECT
  USING (is_active = true);

-- ============================================
-- RLS POLICIES - User Relationships
-- ============================================

-- Coaches can view their relationships
DROP POLICY IF EXISTS "Coaches can view their relationships" ON user_relationships;
CREATE POLICY "Coaches can view their relationships"
  ON user_relationships FOR SELECT
  USING (coach_id = auth.uid());

-- Students can view their coaches
DROP POLICY IF EXISTS "Students can view their coaches" ON user_relationships;
CREATE POLICY "Students can view their coaches"
  ON user_relationships FOR SELECT
  USING (student_id = auth.uid());

-- ============================================
-- RLS POLICIES - Reminders
-- ============================================

-- Users can view reminders for their tasks
DROP POLICY IF EXISTS "Users can view own reminders" ON reminders;
CREATE POLICY "Users can view own reminders"
  ON reminders FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = auth.uid()
    )
  );

-- Users can create reminders for their tasks
DROP POLICY IF EXISTS "Users can create own reminders" ON reminders;
CREATE POLICY "Users can create own reminders"
  ON reminders FOR INSERT
  WITH CHECK (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = auth.uid()
    )
  );
