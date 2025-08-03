-- Test the user_daily_goals fix
-- Verify that the table now works properly

-- Test 1: Check if the table structure is complete
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_daily_goals'
ORDER BY ordinal_position;

-- Test 2: Verify your user has goals
SELECT 
    id,
    user_id,
    daily_date,
    goal_type,
    target_value,
    current_value,
    unit,
    status
FROM user_daily_goals 
WHERE user_id = 'a7c9adb7-f525-4850-bd42-79a769f12953'
ORDER BY daily_date DESC, goal_type;

-- Test 3: Test the exact query your app uses (based on the 406 error)
SELECT 
    id,
    user_id,
    daily_date,
    goal_type,
    target_value,
    current_value,
    unit,
    status,
    notes
FROM user_daily_goals 
WHERE user_id = 'a7c9adb7-f525-4850-bd42-79a769f12953'
    AND goal_type = 'new_customers'
    AND status = 'active'
ORDER BY daily_date DESC;

-- Test 4: Test checkins goal query
SELECT 
    id,
    user_id,
    daily_date,
    goal_type,
    target_value,
    current_value,
    unit,
    status,
    notes
FROM user_daily_goals 
WHERE user_id = 'a7c9adb7-f525-4850-bd42-79a769f12953'
    AND goal_type = 'checkins'
    AND status = 'active'
ORDER BY daily_date DESC;

-- Test 5: Test inserting a new goal (simulate app behavior)
INSERT INTO user_daily_goals (
    user_id, 
    daily_date,
    goal_type, 
    target_value, 
    current_value, 
    unit, 
    status, 
    notes
) VALUES (
    'a7c9adb7-f525-4850-bd42-79a769f12953',
    CURRENT_DATE,
    'devices_processed',
    8.00,
    0.00,
    'devices',
    'active',
    'Test insert from app'
) ON CONFLICT (user_id, daily_date, goal_type) 
DO UPDATE SET 
    target_value = EXCLUDED.target_value,
    current_value = EXCLUDED.current_value,
    unit = EXCLUDED.unit,
    status = EXCLUDED.status,
    notes = EXCLUDED.notes,
    updated_at = NOW();

-- Test 6: Show all goals for your user
SELECT 
    goal_type,
    target_value,
    current_value,
    unit,
    status,
    daily_date
FROM user_daily_goals 
WHERE user_id = 'a7c9adb7-f525-4850-bd42-79a769f12953'
    AND daily_date = CURRENT_DATE
ORDER BY goal_type; 