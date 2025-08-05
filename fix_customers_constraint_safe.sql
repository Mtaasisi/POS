-- Safe fix for customers color_tag constraint
-- This script handles the constraint violation by checking existing data first

-- =============================================
-- STEP 1: Check current color_tag values
-- =============================================

-- Let's see what values currently exist
SELECT DISTINCT color_tag, COUNT(*) as count 
FROM customers 
GROUP BY color_tag 
ORDER BY color_tag;

-- =============================================
-- STEP 2: Update data to match new constraint
-- =============================================

-- Update existing data to match the new constraint values
-- Map 'normal' to 'new' (most common case)
UPDATE customers SET color_tag = 'new' WHERE color_tag = 'normal';

-- Keep existing valid values as they are
-- 'vip' stays 'vip'
-- 'complainer' stays 'complainer'

-- =============================================
-- STEP 3: Verify all data is now valid
-- =============================================

-- Check if any invalid values remain
SELECT DISTINCT color_tag 
FROM customers 
WHERE color_tag NOT IN ('new', 'vip', 'complainer', 'purchased');

-- =============================================
-- STEP 4: Apply new constraint
-- =============================================

-- Only proceed if no invalid values found
DO $$
BEGIN
    -- Check if there are any invalid values
    IF EXISTS (
        SELECT 1 FROM customers 
        WHERE color_tag NOT IN ('new', 'vip', 'complainer', 'purchased')
    ) THEN
        RAISE EXCEPTION 'Cannot apply constraint: invalid color_tag values found';
    ELSE
        -- Drop old constraint
        ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_color_tag_check;
        
        -- Add new constraint
        ALTER TABLE customers ADD CONSTRAINT customers_color_tag_check 
        CHECK (color_tag IN ('new', 'vip', 'complainer', 'purchased'));
        
        RAISE NOTICE 'Constraint updated successfully';
    END IF;
END $$;

-- =============================================
-- STEP 5: Final verification
-- =============================================

-- Show final state
SELECT DISTINCT color_tag, COUNT(*) as count 
FROM customers 
GROUP BY color_tag 
ORDER BY color_tag;

SELECT 'Customers color_tag constraint fixed successfully!' as status; 