-- Fix trigger conflicts by dropping existing triggers before recreating them

-- Drop existing triggers that might conflict
DROP TRIGGER IF EXISTS update_returns_updated_at ON returns;
DROP TRIGGER IF EXISTS update_redemption_rewards_updated_at ON redemption_rewards;

-- Recreate the triggers
CREATE TRIGGER update_returns_updated_at 
    BEFORE UPDATE ON returns 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_redemption_rewards_updated_at 
    BEFORE UPDATE ON redemption_rewards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verify triggers were created successfully
SELECT 
    trigger_name,
    event_object_table,
    '✅ CREATED' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
    AND trigger_name IN ('update_returns_updated_at', 'update_redemption_rewards_updated_at')
ORDER BY trigger_name; 