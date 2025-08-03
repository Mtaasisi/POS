-- Fix data types in user_daily_goals table
-- Based on the results, we need to fix the current_value column

-- Step 1: Check current data types
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_daily_goals'
ORDER BY ordinal_position;

-- Step 2: Fix current_value data type if needed
-- Convert from text to decimal if necessary
DO $$
BEGIN
    -- Check if current_value is text and needs conversion
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
            AND table_name = 'user_daily_goals' 
            AND column_name = 'current_value'
            AND data_type = 'text'
    ) THEN
        -- Convert text to decimal
        ALTER TABLE user_daily_goals 
        ALTER COLUMN current_value TYPE DECIMAL(10,2) 
        USING current_value::DECIMAL(10,2);
    END IF;
END $$;

-- Step 3: Fix target_value data type if needed
DO $$
BEGIN
    -- Check if target_value is text and needs conversion
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
            AND table_name = 'user_daily_goals' 
            AND column_name = 'target_value'
            AND data_type = 'text'
    ) THEN
        -- Convert text to decimal
        ALTER TABLE user_daily_goals 
        ALTER COLUMN target_value TYPE DECIMAL(10,2) 
        USING target_value::DECIMAL(10,2);
    END IF;
END $$;

-- Step 4: Show updated data types
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_daily_goals'
ORDER BY ordinal_position;

-- Step 5: Test with proper data types
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
    5.00,
    0.00,
    'customers',
    'active',
    'Test record with proper data types'
) ON CONFLICT (user_id, goal_type) 
DO UPDATE SET 
    target_value = EXCLUDED.target_value,
    current_value = EXCLUDED.current_value,
    unit = EXCLUDED.unit,
    status = EXCLUDED.status,
    notes = EXCLUDED.notes,
    updated_at = NOW();

-- Step 6: Show the test result
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
LIMIT 2; 