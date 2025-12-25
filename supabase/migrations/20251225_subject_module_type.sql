-- Migration to add module_type to subjects table
-- This allows categorizing programs into specialized areas like nutrition, music, academic, etc.

ALTER TABLE subjects ADD COLUMN IF NOT EXISTS module_type TEXT DEFAULT 'general';

-- Update existing subjects based on their category or name if possible
UPDATE subjects SET module_type = 'academic' WHERE category IN ('TYT', 'AYT', 'LGS');
UPDATE subjects SET module_type = 'nutrition' WHERE category IN ('Diyet', 'Beslenme');
UPDATE subjects SET module_type = 'fitness' WHERE category IN ('Spor', 'Fitness');
UPDATE subjects SET module_type = 'music' WHERE name ILIKE '%Müzik%' OR name ILIKE '%Enstrüman%';

-- Index for better filtering
CREATE INDEX IF NOT EXISTS idx_subjects_module_type ON subjects(module_type);
