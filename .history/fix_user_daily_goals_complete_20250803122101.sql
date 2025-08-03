-- Complete fix for user_daily_goals table
-- Migrate from old structure to new structure

-- Step 1: Check current structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_daily_goals'
ORDER BY ordinal_position;

-- Step 2: Migrate data from old structure to new structure
-- Update target_value from goal_value where it's null
UPDATE user_daily_goals 
SET target_value = goal_value::DECIMAL(10,2)
WHERE target_value IS NULL AND goal_value IS NOT NULL;

-- Update current_value data type
ALTER TABLE user_daily_goals 
ALTER COLUMN current_value TYPE DECIMAL(10,2) 
USING current_value::DECIMAL(10,2);

-- Step 3: Add missing columns if they don't exist
ALTER TABLE user_daily_goals 
ADD COLUMN IF NOT EXISTS daily_date DATE DEFAULT CURRENT_DATE;

ALTER TABLE user_daily_goals 
ADD COLUMN IF NOT EXISTS unit VARCHAR(50);

-- Step 4: Update unit based on goal_type
UPDATE user_daily_goals 
SET unit = CASE 
    WHEN goal_type = 'new_customers' THEN 'customers'
    WHEN goal_type = 'devices_processed' THEN 'devices'
    WHEN goal_type = 'checkins' THEN 'checkins'
    ELSE 'units'
END
WHERE unit IS NULL;

-- Step 5: Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_daily_goals_user_date_type_unique'
    ) THEN
        ALTER TABLE user_daily_goals 
        ADD CONSTRAINT user_daily_goals_user_date_type_unique 
        UNIQUE(user_id, daily_date, goal_type);
    END IF;
END $$;

-- Step 6: Show the updated structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_daily_goals'
ORDER BY ordinal_position;

-- Step 7: Test with proper structure
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
    'new_customers',
    5.00,
    0.00,
    'customers',
    'active',
    'Test record with complete structure'
) ON CONFLICT (user_id, daily_date, goal_type) 
DO UPDATE SET 
    target_value = EXCLUDED.target_value,
    current_value = EXCLUDED.current_value,
    unit = EXCLUDED.unit,
    status = EXCLUDED.status,
    notes = EXCLUDED.notes,
    updated_at = NOW();

-- Step 8: Show sample of migrated data
SELECT 
    id,
    user_id,
    daily_date,
    goal_type,
    target_value,
    current_value,
    unit,
    status,
    notes,
    created_at,
    updated_at
FROM user_daily_goals 
ORDER BY created_at DESC 
LIMIT 5;

-- Step 9: Verify the fix works for your specific user
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
ORDER BY created_at DESC; 