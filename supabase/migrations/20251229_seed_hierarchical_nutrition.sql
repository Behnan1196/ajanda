-- migration 20251229_seed_hierarchical_nutrition.sql

BEGIN;

-- Variables
-- Project ID from official_templates.sql: '00000000-0000-0000-0000-000000000003'
-- User ID (System): '00000000-0000-0000-0000-000000000000'

-- 1. DELETE existing tasks for this project (to start fresh)
DELETE FROM tasks WHERE project_id = '00000000-0000-0000-0000-000000000003';

-- 2. GET Task Type IDs (Assuming they exist, else fallback to NULL or create)
-- We need 'nutrition' type.
DO $$
DECLARE
    sys_user_id UUID := '00000000-0000-0000-0000-000000000000';
    proj_id UUID := '00000000-0000-0000-0000-000000000003';
    type_nutrition UUID;
    type_todo UUID;
    
    day_1 UUID;
    day_2 UUID;
    day_3 UUID;
    day_4 UUID;
    day_5 UUID;
    day_6 UUID;
    day_7 UUID;
BEGIN
    -- Get task types
    SELECT id INTO type_nutrition FROM task_types WHERE slug = 'nutrition' LIMIT 1;
    SELECT id INTO type_todo FROM task_types WHERE slug = 'todo' LIMIT 1;
    
    -- If nutrition type doesn't exist, use todo
    IF type_nutrition IS NULL THEN type_nutrition := type_todo; END IF;

    -- ====================================================
    -- DAY 1
    -- ====================================================
    -- Parent Task: "1. Gün Beslenme Planı"
    INSERT INTO tasks (
        project_id, user_id, title, description, task_type_id, 
        start_date, due_date, sort_order, created_by, is_completed
    ) VALUES (
        proj_id, sys_user_id, '1. Gün Beslenme Planı', 'Bugünün beslenme hedefi: 1850 Kalori', type_nutrition,
        NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day', 0, sys_user_id, false
    ) RETURNING id INTO day_1;

    -- Subtasks for Day 1
    INSERT INTO tasks (project_id, user_id, parent_id, title, description, task_type_id, start_date, due_date, sort_order, created_by, is_completed, metadata)
    VALUES 
    (proj_id, sys_user_id, day_1, 'Kahvaltı', 'Yulaf ezmesi (40g), Süt (200ml), 1 Muz', type_nutrition, NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day', 0, sys_user_id, false, '{"calories": 450, "protein": 12}'),
    (proj_id, sys_user_id, day_1, 'Öğle', 'Izgara Tavuk (150g), Bulgur Pilavı (4 kaşık), Ayran', type_nutrition, NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day', 1, sys_user_id, false, '{"calories": 600, "protein": 35}'),
    (proj_id, sys_user_id, day_1, 'Ara Öğün', '10 Çiğ Badem, 1 Yeşil Elma', type_nutrition, NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day', 2, sys_user_id, false, '{"calories": 200, "protein": 4}'),
    (proj_id, sys_user_id, day_1, 'Akşam', 'Zeytinyağlı Taze Fasulye, Cacık, 1 Dilim Ekmek', type_nutrition, NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day', 3, sys_user_id, false, '{"calories": 500, "protein": 10}');

    -- ====================================================
    -- DAY 2
    -- ====================================================
    INSERT INTO tasks (
        project_id, user_id, title, description, task_type_id, 
        start_date, due_date, sort_order, created_by, is_completed
    ) VALUES (
        proj_id, sys_user_id, '2. Gün Beslenme Planı', 'Bugünün beslenme hedefi: 1900 Kalori', type_nutrition,
        NOW() + INTERVAL '2 day', NOW() + INTERVAL '2 day', 1, sys_user_id, false
    ) RETURNING id INTO day_2;

    INSERT INTO tasks (project_id, user_id, parent_id, title, description, task_type_id, start_date, due_date, sort_order, created_by, is_completed, metadata)
    VALUES 
    (proj_id, sys_user_id, day_2, 'Kahvaltı', '2 Haşlanmış Yumurta, Peynir (30g), Zeytin (5 adet), Söğüş', type_nutrition, NOW() + INTERVAL '2 day', NOW() + INTERVAL '2 day', 0, sys_user_id, false, '{"calories": 400, "protein": 18}'),
    (proj_id, sys_user_id, day_2, 'Öğle', 'Köfte (4 adet), Piyaz, Yarım Lavaş', type_nutrition, NOW() + INTERVAL '2 day', NOW() + INTERVAL '2 day', 1, sys_user_id, false, '{"calories": 650, "protein": 30}'),
    (proj_id, sys_user_id, day_2, 'Akşam', 'Fırın Somon (150g), Roka Salatası', type_nutrition, NOW() + INTERVAL '2 day', NOW() + INTERVAL '2 day', 2, sys_user_id, false, '{"calories": 550, "protein": 35}');

    -- ====================================================
    -- DAY 3 (Example)
    -- ====================================================
    INSERT INTO tasks (
        project_id, user_id, title, description, task_type_id, 
        start_date, due_date, sort_order, created_by, is_completed
    ) VALUES (
        proj_id, sys_user_id, '3. Gün Beslenme Planı', 'Sebze ağırlıklı gün', type_nutrition,
        NOW() + INTERVAL '3 day', NOW() + INTERVAL '3 day', 2, sys_user_id, false
    ) RETURNING id INTO day_3;
    
    INSERT INTO tasks (project_id, user_id, parent_id, title, description, task_type_id, start_date, due_date, sort_order, created_by, is_completed, metadata)
    VALUES 
    (proj_id, sys_user_id, day_3, 'Kahvaltı', 'Menemen, 1 Dilim Tam Buğday Ekmeği', type_nutrition, NOW() + INTERVAL '3 day', NOW() + INTERVAL '3 day', 0, sys_user_id, false, '{"calories": 450, "protein": 15}'),
    (proj_id, sys_user_id, day_3, 'Öğle', 'Mercimek Çorbası, Mevsim Salatası', type_nutrition, NOW() + INTERVAL '3 day', NOW() + INTERVAL '3 day', 1, sys_user_id, false, '{"calories": 400, "protein": 12}'),
    (proj_id, sys_user_id, day_3, 'Akşam', 'Kabak Sandal (Kıymalı), Yoğurt', type_nutrition, NOW() + INTERVAL '3 day', NOW() + INTERVAL '3 day', 2, sys_user_id, false, '{"calories": 500, "protein": 25}');

    -- Adding placeholder days 4-7 to show complete week structure
    INSERT INTO tasks (project_id, user_id, title, description, task_type_id, start_date, due_date, sort_order, created_by, is_completed) VALUES 
    (proj_id, sys_user_id, '4. Gün Beslenme Planı', 'Standart Menü', type_nutrition, NOW() + INTERVAL '4 day', NOW() + INTERVAL '4 day', 3, sys_user_id, false),
    (proj_id, sys_user_id, '5. Gün Beslenme Planı', 'Standart Menü', type_nutrition, NOW() + INTERVAL '5 day', NOW() + INTERVAL '5 day', 4, sys_user_id, false),
    (proj_id, sys_user_id, '6. Gün Beslenme Planı', 'Haftasonu Başlangıç', type_nutrition, NOW() + INTERVAL '6 day', NOW() + INTERVAL '6 day', 5, sys_user_id, false),
    (proj_id, sys_user_id, '7. Gün Beslenme Planı', 'Pazar Kahvaltısı ve Detox', type_nutrition, NOW() + INTERVAL '7 day', NOW() + INTERVAL '7 day', 6, sys_user_id, false);

END $$;

COMMIT;
