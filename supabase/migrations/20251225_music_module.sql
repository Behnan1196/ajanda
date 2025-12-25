-- Music Module Migration

-- 1. Repertuvar (Öğrenilen parçalar)
CREATE TABLE IF NOT EXISTS music_repertoire (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT,
  status TEXT DEFAULT 'learning', -- 'learning', 'mastered', 'wishlist'
  difficulty INTEGER DEFAULT 3, -- 1-5
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Egzersizler (Teknik çalışmalar)
CREATE TABLE IF NOT EXISTS music_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_bpm INTEGER,
  current_bpm INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Pratik Günlüğü
CREATE TABLE IF NOT EXISTS music_practice_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  log_date DATE DEFAULT CURRENT_DATE,
  duration_minutes INTEGER DEFAULT 0,
  content TEXT, -- Hangi parça/egzersiz çalışıldı
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE music_repertoire ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_practice_logs ENABLE ROW LEVEL SECURITY;

-- Policies for Repertoire
CREATE POLICY "Users can view own repertoire" ON music_repertoire
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Tutors can manage student repertoire" ON music_repertoire
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_relationships 
      WHERE coach_id = auth.uid() AND student_id = music_repertoire.user_id AND is_active = true
    )
  );

-- Policies for Exercises
CREATE POLICY "Users can view own exercises" ON music_exercises
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Tutors can manage student exercises" ON music_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_relationships 
      WHERE coach_id = auth.uid() AND student_id = music_exercises.user_id AND is_active = true
    )
  );

-- Policies for Practice Logs
CREATE POLICY "Users can manage own practice logs" ON music_practice_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Tutors can view student logs" ON music_practice_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_relationships 
      WHERE coach_id = auth.uid() AND student_id = music_practice_logs.user_id AND is_active = true
    )
  );
