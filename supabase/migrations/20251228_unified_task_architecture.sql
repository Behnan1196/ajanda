-- Unified Task Architecture Migration
-- Created: 2025-12-28
-- Purpose: Consolidate all module-specific tables into unified task system

BEGIN;

-- ============================================================================
-- 1. ENHANCE CORE TABLES
-- ============================================================================

-- Projects: Add type and module columns
ALTER TABLE projects 
  ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'program',
  ADD COLUMN IF NOT EXISTS module VARCHAR(50);

COMMENT ON COLUMN projects.type IS 'Type of project: program, standalone, quick_collection';
COMMENT ON COLUMN projects.module IS 'Module identifier: exam, nutrition, music, coding, general';

-- Tasks: Ensure settings column exists
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

COMMENT ON COLUMN tasks.settings IS 'Module-specific data stored as JSONB';

-- ============================================================================
-- 2. CREATE MODULE ENABLEMENT TABLE (Future-Ready)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_slug VARCHAR(50) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  enabled_at TIMESTAMPTZ DEFAULT NOW(),
  enabled_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_module UNIQUE(user_id, module_slug)
);

COMMENT ON TABLE user_modules IS 'Tracks which modules are enabled for each user (coach)';

-- ============================================================================
-- 3. ENHANCE TASK_TYPES TABLE
-- ============================================================================

-- Add schema definition columns for dynamic forms
ALTER TABLE task_types
  ADD COLUMN IF NOT EXISTS settings_schema JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ui_config JSONB DEFAULT '{}';

COMMENT ON COLUMN task_types.settings_schema IS 'JSON Schema for validating task.settings';
COMMENT ON COLUMN task_types.ui_config IS 'UI configuration: icon, color, form fields';

-- Update existing task types with metadata
UPDATE task_types SET 
  ui_config = jsonb_build_object(
    'icon', '📚',
    'color', 'blue',
    'category', 'education'
  ),
  settings_schema = jsonb_build_object(
    'type', 'object',
    'properties', jsonb_build_object(
      'subject', jsonb_build_object('type', 'string'),
      'topic', jsonb_build_object('type', 'string'),
      'question_count', jsonb_build_object('type', 'number')
    )
  )
WHERE slug = 'exam';

UPDATE task_types SET 
  ui_config = jsonb_build_object(
    'icon', '🥗',
    'color', 'green',
    'category', 'nutrition'
  ),
  settings_schema = jsonb_build_object(
    'type', 'object',
    'properties', jsonb_build_object(
      'meal_type', jsonb_build_object('type', 'string', 'enum', jsonb_build_array('breakfast', 'lunch', 'dinner', 'snack')),
      'calories', jsonb_build_object('type', 'number'),
      'protein', jsonb_build_object('type', 'number'),
      'carbs', jsonb_build_object('type', 'number'),
      'fats', jsonb_build_object('type', 'number')
    )
  )
WHERE slug = 'nutrition';

UPDATE task_types SET 
  ui_config = jsonb_build_object(
    'icon', '🎸',
    'color', 'purple',
    'category', 'music'
  ),
  settings_schema = jsonb_build_object(
    'type', 'object',
    'properties', jsonb_build_object(
      'instrument', jsonb_build_object('type', 'string'),
      'piece', jsonb_build_object('type', 'string'),
      'technique', jsonb_build_object('type', 'string'),
      'tempo', jsonb_build_object('type', 'number')
    )
  )
WHERE slug = 'music';

-- Add quick_todo type if not exists
INSERT INTO task_types (name, slug, schema, description, ui_config, settings_schema)
VALUES (
  'Hızlı Görev',
  'quick_todo',
  '{}',  -- Empty schema for quick todos
  'Tek seferlik hızlı görevler',
  jsonb_build_object('icon', '✓', 'color', 'gray', 'category', 'general'),
  jsonb_build_object('type', 'object', 'properties', jsonb_build_object())
)
ON CONFLICT (slug) DO UPDATE SET
  ui_config = EXCLUDED.ui_config,
  settings_schema = EXCLUDED.settings_schema;

-- ============================================================================
-- 4. CREATE INDEXES
-- ============================================================================

-- Tasks settings index for fast JSONB queries
CREATE INDEX IF NOT EXISTS idx_tasks_settings 
  ON tasks USING GIN (settings);

-- Tasks without project (standalone quick todos)
CREATE INDEX IF NOT EXISTS idx_tasks_standalone 
  ON tasks(user_id, created_at DESC) 
  WHERE project_id IS NULL;

-- Project type filtering
CREATE INDEX IF NOT EXISTS idx_projects_type_module 
  ON projects(type, module);

-- User modules for fast lookup
CREATE INDEX IF NOT EXISTS idx_user_modules_user_enabled 
  ON user_modules(user_id, enabled) 
  WHERE enabled = true;

-- ============================================================================
-- 5. DROP OLD MODULE-SPECIFIC TABLES
-- ============================================================================

-- These tables are no longer needed in unified architecture
DROP TABLE IF EXISTS nutrition_entries CASCADE;
DROP TABLE IF EXISTS nutrition_meals CASCADE;
DROP TABLE IF EXISTS music_practice_logs CASCADE;
DROP TABLE IF EXISTS practice_sessions CASCADE;
DROP TABLE IF EXISTS exam_results CASCADE;

-- ============================================================================
-- 6. UPDATE RLS POLICIES
-- ============================================================================

-- Enable RLS on user_modules first
ALTER TABLE user_modules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "users_can_view_own_modules" ON user_modules;
CREATE POLICY "users_can_view_own_modules"
  ON user_modules FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admins_can_manage_modules" ON user_modules;
CREATE POLICY "admins_can_manage_modules"
  ON user_modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND 'admin' = ANY(users.roles)
    )
  );

-- ============================================================================
-- 7. DATA MIGRATION NOTES
-- ============================================================================

-- Since there's no production data, no migration needed
-- Future: If data exists in old tables, would need migration scripts here

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check new columns
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name IN ('projects', 'tasks', 'task_types') 
  AND column_name IN ('type', 'module', 'settings', 'settings_schema', 'ui_config');

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('tasks', 'projects', 'user_modules')
ORDER BY tablename, indexname;

-- Check task types
SELECT slug, name, ui_config->>'icon' as icon, ui_config->>'color' as color
FROM task_types
ORDER BY slug;
