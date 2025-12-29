-- migration 20251228_cleanup_legacy_tables.sql
-- Purpose: Consolidate the database by removing redundant legacy tables and columns.

BEGIN;

-- 1. Drop tables (ordered by dependencies)
DROP TABLE IF EXISTS library_items CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS exam_templates CASCADE;
DROP TABLE IF EXISTS exams CASCADE;

-- 2. Remove columns from tasks table
-- These columns were previously used for the subjects/topics model but are now replaced by JSONB settings.
ALTER TABLE tasks DROP COLUMN IF EXISTS subject_id;
ALTER TABLE tasks DROP COLUMN IF EXISTS topic_id;

COMMIT;
