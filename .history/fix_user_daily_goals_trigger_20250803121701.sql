-- Fix user_daily_goals trigger issue
-- The trigger is calling the wrong function name

-- First, let's check what functions exist
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name LIKE '%updated_at%';

-- Create the correct trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop the incorrect trigger
DROP TRIGGER IF EXISTS update_user_daily_goals_updated_at_trigger ON user_daily_goals;

-- Create the correct trigger
CREATE TRIGGER update_user_daily_goals_updated_at 
    BEFORE UPDATE ON user_daily_goals
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Also fix user_goals trigger if it has the same issue
DROP TRIGGER IF EXISTS update_user_goals_updated_at_trigger ON user_goals;

CREATE TRIGGER update_user_goals_updated_at 
    BEFORE UPDATE ON user_goals
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the fix
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
    AND event_object_table IN ('user_daily_goals', 'user_goals')
ORDER BY event_object_table, trigger_name;

-- Test the trigger by updating a record
UPDATE user_daily_goals 
SET notes = 'Test trigger fix' 
WHERE id IN (SELECT id FROM user_daily_goals LIMIT 1);

-- Show the updated record to verify trigger worked
SELECT 
    id,
    updated_at,
    notes
FROM user_daily_goals 
ORDER BY updated_at DESC 
LIMIT 1; 