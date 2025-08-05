-- Fix customers color_tag constraint violation
-- This script identifies and fixes all problematic values

-- =============================================
-- STEP 1: Identify all current color_tag values
-- =============================================

-- Show all current values and their counts
SELECT color_tag, COUNT(*) as count 
FROM customers 
GROUP BY color_tag 
ORDER BY color_tag;

-- =============================================
-- STEP 2: Show problematic values
-- =============================================

-- Show values that don't match the new constraint
SELECT DISTINCT color_tag 
FROM customers 
WHERE color_tag NOT IN ('new', 'vip', 'complainer', 'purchased');

-- =============================================
-- STEP 3: Fix all problematic values
-- =============================================

-- Update 'normal' to 'new'
UPDATE customers SET color_tag = 'new' WHERE color_tag = 'normal';

-- Update any other unexpected values to 'new' as fallback
UPDATE customers SET color_tag = 'new' 
WHERE color_tag NOT IN ('new', 'vip', 'complainer', 'purchased');

-- =============================================
-- STEP 4: Verify all data is now valid
-- =============================================

-- Check if any invalid values remain
SELECT DISTINCT color_tag 
FROM customers 
WHERE color_tag NOT IN ('new', 'vip', 'complainer', 'purchased');

-- =============================================
-- STEP 5: Apply new constraint
-- =============================================

-- Drop the old constraint
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_color_tag_check;

-- Add the new constraint
ALTER TABLE customers ADD CONSTRAINT customers_color_tag_check 
CHECK (color_tag IN ('new', 'vip', 'complainer', 'purchased'));

-- =============================================
-- STEP 6: Final verification
-- =============================================

-- Show final state
SELECT color_tag, COUNT(*) as count 
FROM customers 
GROUP BY color_tag 
ORDER BY color_tag;

SELECT 'Constraint violation fixed successfully!' as status; 