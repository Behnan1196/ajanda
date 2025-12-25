-- Self-Coaching RLS Policy Updates
-- Allow users to manage their own data across all modules without requiring a tutor relationship

-- Music Module Updates
DROP POLICY IF EXISTS "Users can view own repertoire" ON music_repertoire;
CREATE POLICY "Users can manage own repertoire" ON music_repertoire
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own exercises" ON music_exercises;
CREATE POLICY "Users can manage own exercises" ON music_exercises
  FOR ALL USING (auth.uid() = user_id);

-- Nutrition Module Updates
DROP POLICY IF EXISTS "Users can view own measurements" ON nutrition_measurements;
CREATE POLICY "Users can manage own measurements" ON nutrition_measurements
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own diet plans" ON nutrition_diet_plans;
CREATE POLICY "Users can manage own diet plans" ON nutrition_diet_plans
  FOR ALL USING (auth.uid() = user_id);
