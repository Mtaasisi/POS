-- Check and fix user_daily_goals table structure
-- Step 1: See what columns actually exist

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_daily_goals'
ORDER BY ordinal_position;

-- Step 2: Add missing columns based on what your app expects
ALTER TABLE user_daily_goals 
ADD COLUMN IF NOT EXISTS target_value DECIMAL(10,2);

ALTER TABLE user_daily_goals 
ADD COLUMN IF NOT EXISTS current_value DECIMAL(10,2) DEFAULT 0;

ALTER TABLE user_daily_goals 
ADD COLUMN IF NOT EXISTS unit VARCHAR(50);

ALTER TABLE user_daily_goals 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

ALTER TABLE user_daily_goals 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Step 3: Show the updated structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_daily_goals'
ORDER BY ordinal_position;

-- Step 4: Test insert with only the columns that exist
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

-- Step 5: Show the result
SELECT 
    id,
    user_id,
    goal_type,
    target_value,
    current_value,
    unit,
    status,
    notes,
    created_at
FROM user_daily_goals 
WHERE user_id = 'a7c9adb7-f525-4850-bd42-79a769f12953'
ORDER BY created_at DESC 
LIMIT 1; 