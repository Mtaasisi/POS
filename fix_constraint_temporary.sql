-- Fix customers color_tag constraint violation
-- This script temporarily disables the constraint to fix the data

-- =============================================
-- STEP 1: Temporarily disable the constraint
-- =============================================

-- Drop the constraint temporarily
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_color_tag_check;

-- =============================================
-- STEP 2: Update all problematic data
-- =============================================

-- Update 'normal' to 'new'
UPDATE customers SET color_tag = 'new' WHERE color_tag = 'normal';

-- Update any other unexpected values to 'new' as fallback
UPDATE customers SET color_tag = 'new' 
WHERE color_tag NOT IN ('new', 'vip', 'complainer', 'purchased');

-- =============================================
-- STEP 3: Verify data is clean
-- =============================================

-- Show current state
SELECT color_tag, COUNT(*) as count 
FROM customers 
GROUP BY color_tag 
ORDER BY color_tag;

-- =============================================
-- STEP 4: Re-add the constraint
-- =============================================

-- Add the new constraint
ALTER TABLE customers ADD CONSTRAINT customers_color_tag_check 
CHECK (color_tag IN ('new', 'vip', 'complainer', 'purchased'));

-- =============================================
-- STEP 5: Final verification
-- =============================================

-- Test the constraint
SELECT 'Constraint test:' as test;
SELECT color_tag, COUNT(*) as count 
FROM customers 
GROUP BY color_tag 
ORDER BY color_tag;

SELECT 'Constraint violation fixed successfully!' as status; 