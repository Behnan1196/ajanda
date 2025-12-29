-- Cleanup script: Delete all test tasks and projects
-- Run this in Supabase SQL Editor

BEGIN;

-- Delete all tasks
DELETE FROM tasks;

-- Delete all projects  
DELETE FROM projects;

-- Verify nutrition task type exists
SELECT id, slug, name FROM task_types WHERE slug = 'nutrition';

-- If not exists, insert it
INSERT INTO task_types (name, slug, schema, description, ui_config, settings_schema)
VALUES (
  'Beslenme',
  'nutrition',
  '{}',
  'Beslenme ve öğün görevleri',
  jsonb_build_object('icon', '🥗', 'color', 'green', 'category', 'nutrition'),
  jsonb_build_object('type', 'object', 'properties', jsonb_build_object(
    'meal_type', jsonb_build_object('type', 'string'),
    'calories', jsonb_build_object('type', 'number'),
    'protein', jsonb_build_object('type', 'number'),
    'carbs', jsonb_build_object('type', 'number'),
    'fats', jsonb_build_object('type', 'number')
  ))
)
ON CONFLICT (slug) DO UPDATE SET
  ui_config = EXCLUDED.ui_config,
  settings_schema = EXCLUDED.settings_schema;

COMMIT;

-- Verify
SELECT slug, name, ui_config->>'icon' as icon FROM task_types ORDER BY slug;
