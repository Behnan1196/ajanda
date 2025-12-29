
-- Add metadata column to tasks table for extensible properties
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for faster querying on metadata
CREATE INDEX IF NOT EXISTS tasks_metadata_idx ON tasks USING gin (metadata);
