-- Fix user_daily_goals table with correct column names
-- First, let's see what columns actually exist

-- Show current structure
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

-- Find the correct date column name and create unique constraint
DO $$
DECLARE
    date_column_name TEXT;
BEGIN
    -- Find the date column (could be 'date', 'daily_date', 'goal_date', etc.)
    SELECT column_name INTO date_column_name
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
        AND table_name = 'user_daily_goals'
        AND data_type IN ('date', 'timestamp', 'timestamp with time zone')
    LIMIT 1;
    
    -- Create unique constraint with the correct column name
    IF date_column_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE user_daily_goals ADD CONSTRAINT user_daily_goals_user_date_type_unique UNIQUE(user_id, %I, goal_type)', date_column_name);
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

-- Test inserting a record (using the correct column names)
DO $$
DECLARE
    date_column_name TEXT;
BEGIN
    -- Find the date column name
    SELECT column_name INTO date_column_name
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
        AND table_name = 'user_daily_goals'
        AND data_type IN ('date', 'timestamp', 'timestamp with time zone')
    LIMIT 1;
    
    -- Insert test record using the correct column name
    IF date_column_name IS NOT NULL THEN
        EXECUTE format('
            INSERT INTO user_daily_goals (
                user_id, 
                %I, 
                goal_type, 
                target_value, 
                current_value, 
                unit, 
                status, 
                notes
            ) VALUES (
                ''a7c9adb7-f525-4850-bd42-79a769f12953'',
                CURRENT_DATE,
                ''new_customers'',
                5,
                0,
                ''customers'',
                ''active'',
                ''Test record''
            ) ON CONFLICT (user_id, %I, goal_type) 
            DO UPDATE SET 
                notes = EXCLUDED.notes,
                updated_at = NOW()
        ', date_column_name, date_column_name);
    END IF;
END $$;

-- Show the test record
SELECT 
    id,
    user_id,
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