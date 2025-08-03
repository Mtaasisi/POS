-- Safe fix for user_daily_goals table
-- First, let's see what we're working with

-- Step 1: Check current structure
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_daily_goals'
ORDER BY ordinal_position;

-- Step 2: Add only the essential missing columns
-- We'll add them one by one to avoid errors

-- Add target_value if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
            AND table_name = 'user_daily_goals' 
            AND column_name = 'target_value'
    ) THEN
        ALTER TABLE user_daily_goals ADD COLUMN target_value DECIMAL(10,2);
    END IF;
END $$;

-- Add current_value if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
            AND table_name = 'user_daily_goals' 
            AND column_name = 'current_value'
    ) THEN
        ALTER TABLE user_daily_goals ADD COLUMN current_value DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- Add unit if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
            AND table_name = 'user_daily_goals' 
            AND column_name = 'unit'
    ) THEN
        ALTER TABLE user_daily_goals ADD COLUMN unit VARCHAR(50);
    END IF;
END $$;

-- Add status if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
            AND table_name = 'user_daily_goals' 
            AND column_name = 'status'
    ) THEN
        ALTER TABLE user_daily_goals ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;
END $$;

-- Add notes if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
            AND table_name = 'user_daily_goals' 
            AND column_name = 'notes'
    ) THEN
        ALTER TABLE user_daily_goals ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Step 3: Show the updated structure
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_daily_goals'
ORDER BY ordinal_position;

-- Step 4: Test with a simple insert using only existing columns
-- We'll build the insert dynamically based on what columns exist
DO $$
DECLARE
    insert_columns TEXT := '';
    insert_values TEXT := '';
    select_columns TEXT := '';
BEGIN
    -- Build column list for insert
    SELECT string_agg(column_name, ', ') INTO insert_columns
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
        AND table_name = 'user_daily_goals'
        AND column_name IN ('user_id', 'goal_type', 'target_value', 'current_value', 'unit', 'status', 'notes');
    
    -- Build values list
    SELECT string_agg(
        CASE 
            WHEN column_name = 'user_id' THEN '''a7c9adb7-f525-4850-bd42-79a769f12953'''
            WHEN column_name = 'goal_type' THEN '''new_customers'''
            WHEN column_name = 'target_value' THEN '5'
            WHEN column_name = 'current_value' THEN '0'
            WHEN column_name = 'unit' THEN '''customers'''
            WHEN column_name = 'status' THEN '''active'''
            WHEN column_name = 'notes' THEN '''Test record'''
            ELSE 'NULL'
        END, ', '
    ) INTO insert_values
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
        AND table_name = 'user_daily_goals'
        AND column_name IN ('user_id', 'goal_type', 'target_value', 'current_value', 'unit', 'status', 'notes');
    
    -- Build select columns for result
    SELECT string_agg(column_name, ', ') INTO select_columns
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
        AND table_name = 'user_daily_goals';
    
    -- Execute the insert
    IF insert_columns != '' THEN
        EXECUTE format('INSERT INTO user_daily_goals (%s) VALUES (%s) ON CONFLICT DO NOTHING', 
                      insert_columns, insert_values);
        
        -- Show result
        EXECUTE format('SELECT %s FROM user_daily_goals WHERE user_id = ''a7c9adb7-f525-4850-bd42-79a769f12953'' ORDER BY created_at DESC LIMIT 1', 
                      select_columns);
    END IF;
END $$; 