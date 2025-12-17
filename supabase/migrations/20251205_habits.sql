-- Habit Tracker System - Database Migration

-- ============================================
-- TABLES
-- ============================================

-- 1. Habits (Alışkanlıklar)
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Frequency & Schedule
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'custom')),
  frequency_days INTEGER[], -- [1,2,3,4,5] = Monday-Friday (1=Monday, 7=Sunday)
  
  -- Goals
  target_type TEXT CHECK (target_type IN ('count', 'duration', 'boolean')),
  target_count INTEGER, -- How many times (e.g., 8 glasses of water)
  target_duration INTEGER, -- Minutes (e.g., 30 min exercise)
  
  -- Appearance
  color TEXT DEFAULT '#10B981',
  icon TEXT DEFAULT '⭐',
  
  -- Streak & Stats
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  
  -- Dates
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE, -- Optional (for challenges like "21-day challenge")
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habit Completions (Tamamlamalar)
CREATE TABLE IF NOT EXISTS habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_date DATE NOT NULL,
  
  -- Progress tracking
  count INTEGER DEFAULT 1, -- How many times completed that day
  duration INTEGER, -- Minutes spent
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Habits
CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_subject ON habits(subject_id);
CREATE INDEX IF NOT EXISTS idx_habits_active ON habits(is_active);
CREATE INDEX IF NOT EXISTS idx_habits_frequency ON habits(frequency);

-- Habit Completions
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit ON habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user ON habit_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON habit_completions(completed_date);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_date ON habit_completions(habit_id, completed_date);

-- ============================================
-- TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_habits_updated_at ON habits;
CREATE TRIGGER update_habits_updated_at
  BEFORE UPDATE ON habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update streak when completion is added
CREATE OR REPLACE FUNCTION update_habit_streak()
RETURNS TRIGGER AS $$
DECLARE
  habit_record RECORD;
  yesterday DATE;
  yesterday_completed BOOLEAN;
BEGIN
  -- Get habit info
  SELECT * INTO habit_record FROM habits WHERE id = NEW.habit_id;
  
  -- Check if yesterday was completed
  yesterday := NEW.completed_date - INTERVAL '1 day';
  SELECT EXISTS (
    SELECT 1 FROM habit_completions
    WHERE habit_id = NEW.habit_id
    AND completed_date = yesterday
  ) INTO yesterday_completed;
  
  -- Update streak
  IF yesterday_completed THEN
    -- Continue streak
    UPDATE habits
    SET current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        total_completions = total_completions + 1
    WHERE id = NEW.habit_id;
  ELSE
    -- Start new streak
    UPDATE habits
    SET current_streak = 1,
        longest_streak = GREATEST(longest_streak, 1),
        total_completions = total_completions + 1
    WHERE id = NEW.habit_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_habit_streak ON habit_completions;
CREATE TRIGGER trigger_update_habit_streak
  AFTER INSERT ON habit_completions
  FOR EACH ROW EXECUTE FUNCTION update_habit_streak();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;

-- Habits Policies
DROP POLICY IF EXISTS "Users can view own habits" ON habits;
CREATE POLICY "Users can view own habits"
  ON habits FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own habits" ON habits;
CREATE POLICY "Users can create own habits"
  ON habits FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own habits" ON habits;
CREATE POLICY "Users can update own habits"
  ON habits FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own habits" ON habits;
CREATE POLICY "Users can delete own habits"
  ON habits FOR DELETE
  USING (user_id = auth.uid());

-- Habit Completions Policies
DROP POLICY IF EXISTS "Users can view own completions" ON habit_completions;
CREATE POLICY "Users can view own completions"
  ON habit_completions FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own completions" ON habit_completions;
CREATE POLICY "Users can create own completions"
  ON habit_completions FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own completions" ON habit_completions;
CREATE POLICY "Users can delete own completions"
  ON habit_completions FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- SEED DATA - Example Habits
-- ============================================

-- Example habit for demo user (if exists)
INSERT INTO habits (
  user_id,
  name,
  description,
  frequency,
  frequency_days,
  target_type,
  target_duration,
  color,
  icon,
  start_date
)
SELECT 
  id,
  'Sabah Koşusu',
  '30 dakika sabah koşusu',
  'daily',
  ARRAY[1,2,3,4,5], -- Monday to Friday
  'duration',
  30,
  '#10B981',
  '🏃',
  CURRENT_DATE
FROM users
WHERE email = 'demo@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO habits (
  user_id,
  name,
  description,
  frequency,
  frequency_days,
  target_type,
  target_count,
  color,
  icon,
  start_date
)
SELECT 
  id,
  'Su İçmek',
  'Günde 8 bardak su',
  'daily',
  ARRAY[1,2,3,4,5,6,7], -- Every day
  'count',
  8,
  '#3B82F6',
  '💧',
  CURRENT_DATE
FROM users
WHERE email = 'demo@example.com'
ON CONFLICT DO NOTHING;

INSERT INTO habits (
  user_id,
  name,
  description,
  frequency,
  frequency_days,
  target_type,
  target_duration,
  color,
  icon,
  start_date
)
SELECT 
  id,
  'Meditasyon',
  'Günlük meditasyon',
  'daily',
  ARRAY[1,2,3,4,5,6,7],
  'duration',
  15,
  '#8B5CF6',
  '🧘',
  CURRENT_DATE
FROM users
WHERE email = 'demo@example.com'
ON CONFLICT DO NOTHING;
