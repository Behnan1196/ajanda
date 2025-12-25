-- Diyetisyen Ölçümleri
CREATE TABLE IF NOT EXISTS nutrition_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  weight DECIMAL(5,2),
  fat_percentage DECIMAL(4,1),
  waist_circumference DECIMAL(5,1),
  hip_circumference DECIMAL(5,1),
  notes TEXT,
  recorded_by UUID REFERENCES users(id),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Beslenme Programları (Haftalık/Günlük Şablon)
CREATE TABLE IF NOT EXISTS nutrition_diet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER, -- 0: Pazartesi, 6: Pazar
  meal_type TEXT, -- 'Kahvaltı', 'Öğle', 'Akşam', 'Ara Öğün'
  content TEXT, -- Yemek detayları
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Günlük Takip (Su, Adım, öğün onayı)
CREATE TABLE IF NOT EXISTS nutrition_daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  log_date DATE DEFAULT CURRENT_DATE,
  water_ml INTEGER DEFAULT 0,
  step_count INTEGER DEFAULT 0,
  meal_confirmations JSONB DEFAULT '{}', -- {'breakfast': true, etc.}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

-- Enable RLS
ALTER TABLE nutrition_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_daily_logs ENABLE ROW LEVEL SECURITY;

-- Policies for Measurements
CREATE POLICY "Users can view own measurements" ON nutrition_measurements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Tutors can view/insert student measurements" ON nutrition_measurements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_relationships
      WHERE coach_id = auth.uid() AND student_id = nutrition_measurements.user_id AND is_active = true
    )
  );

-- Policies for Diet Plans
CREATE POLICY "Users can view own diet plans" ON nutrition_diet_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Tutors can manage student diet plans" ON nutrition_diet_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_relationships
      WHERE coach_id = auth.uid() AND student_id = nutrition_diet_plans.user_id AND is_active = true
    )
  );

-- Policies for Daily Logs
CREATE POLICY "Users can manage own daily logs" ON nutrition_daily_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Tutors can view student daily logs" ON nutrition_daily_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_relationships
      WHERE coach_id = auth.uid() AND student_id = nutrition_daily_logs.user_id AND is_active = true
    )
  );
