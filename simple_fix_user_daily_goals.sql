-- Simple fix for user_daily_goals table
-- Step 1: Check current structure
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_daily_goals'
ORDER BY ordinal_position;

-- Step 2: Add missing columns
ALTER TABLE user_daily_goals 
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE user_daily_goals 
ADD COLUMN IF NOT EXISTS unit VARCHAR(50);

ALTER TABLE user_daily_goals 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Step 3: Show updated structure
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_daily_goals'
ORDER BY ordinal_position;

-- Step 4: Test basic insert
INSERT INTO user_daily_goals (
    user_id, 
    goal_type, 
    target_value, 
    current_value, 
    unit, 
    status, 
    notes
) VALUES (
    'a7c9adb7-f525-4850-bd42-79a769f12953',
    'new_customers',
    5,
    0,
    'customers',
    'active',
    'Test record'
) ON CONFLICT DO NOTHING;

-- Step 5: Show test result
SELECT 
    id,
    user_id,
    goal_type,
    target_value,
    current_value,
    unit,
    status,
    notes
FROM user_daily_goals 
WHERE user_id = 'a7c9adb7-f525-4850-bd42-79a769f12953'
ORDER BY created_at DESC 
LIMIT 1; 