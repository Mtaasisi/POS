-- Check and fix user_daily_goals table structure
-- First, let's see what columns actually exist

-- Show current structure of user_daily_goals
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_daily_goals'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
ALTER TABLE user_daily_goals 
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE user_daily_goals 
ADD COLUMN IF NOT EXISTS unit VARCHAR(50);

ALTER TABLE user_daily_goals 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Add check constraint for status if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'user_daily_goals_status_check'
    ) THEN
        ALTER TABLE user_daily_goals 
        ADD CONSTRAINT user_daily_goals_status_check 
        CHECK (status IN ('active', 'completed', 'cancelled'));
    END IF;
END $$;

-- Add unique constraint if it doesn't exist
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

-- Show the updated structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_daily_goals'
ORDER BY ordinal_position;

-- Show constraints
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
    AND table_name = 'user_daily_goals';

-- Test inserting a record
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
    5,
    0,
    'customers',
    'active',
    'Test record'
) ON CONFLICT (user_id, daily_date, goal_type) 
DO UPDATE SET 
    notes = EXCLUDED.notes,
    updated_at = NOW();

-- Show the test record
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
    updated_at
FROM user_daily_goals 
WHERE user_id = 'a7c9adb7-f525-4850-bd42-79a769f12953'
ORDER BY updated_at DESC 
LIMIT 1; 