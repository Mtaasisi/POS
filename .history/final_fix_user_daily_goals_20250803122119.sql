-- Final fix for user_daily_goals table
-- Based on the actual structure we can see

-- Step 1: Add missing daily_date column
ALTER TABLE user_daily_goals 
ADD COLUMN IF NOT EXISTS daily_date DATE DEFAULT CURRENT_DATE;

-- Step 2: Migrate existing data to have daily_date
UPDATE user_daily_goals 
SET daily_date = CURRENT_DATE
WHERE daily_date IS NULL;

-- Step 3: Migrate goal_value to target_value where needed
UPDATE user_daily_goals 
SET target_value = goal_value::DECIMAL(10,2)
WHERE target_value IS NULL AND goal_value IS NOT NULL;

-- Step 4: Set proper unit values based on goal_type
UPDATE user_daily_goals 
SET unit = CASE 
    WHEN goal_type = 'new_customers' THEN 'customers'
    WHEN goal_type = 'devices_processed' THEN 'devices'
    WHEN goal_type = 'checkins' THEN 'checkins'
    WHEN goal_type = 'sales' THEN 'sales'
    ELSE 'units'
END
WHERE unit IS NULL;

-- Step 5: Add unique constraint for daily goals
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

-- Step 6: Show the complete structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_daily_goals'
ORDER BY ordinal_position;

-- Step 7: Test insert for your specific user
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
    'Test record - final fix'
) ON CONFLICT (user_id, daily_date, goal_type) 
DO UPDATE SET 
    target_value = EXCLUDED.target_value,
    current_value = EXCLUDED.current_value,
    unit = EXCLUDED.unit,
    status = EXCLUDED.status,
    notes = EXCLUDED.notes,
    updated_at = NOW();

-- Step 8: Show your user's goals
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
WHERE user_id = 'a7c9adb7-f525-4850-bd42-79a769f12953'
ORDER BY created_at DESC;

-- Step 9: Test query that your app uses
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
    AND is_active = true
ORDER BY daily_date DESC; 