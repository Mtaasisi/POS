-- Check and fix color_tag constraint properly
-- This will resolve the constraint violation error

-- STEP 1: Check current constraint definition
SELECT 'Current color_tag constraint:' as info;
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'customers'::regclass 
AND contype = 'c' 
AND conname LIKE '%color_tag%';

-- STEP 2: Check current color_tag values
SELECT 'Current color_tag values:' as info;
SELECT DISTINCT color_tag, COUNT(*) as count FROM customers GROUP BY color_tag;

-- STEP 3: Drop the existing constraint (if it exists)
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_color_tag_check;

-- STEP 4: Create the correct constraint
ALTER TABLE customers ADD CONSTRAINT customers_color_tag_check 
CHECK (color_tag IN ('normal', 'vip', 'complainer', 'purchased'));

-- STEP 5: Update any invalid values to 'normal'
UPDATE customers SET color_tag = 'normal' 
WHERE color_tag IS NULL OR color_tag NOT IN ('normal', 'vip', 'complainer', 'purchased');

-- STEP 6: Verify the fix
SELECT 'Final color_tag values:' as info;
SELECT DISTINCT color_tag, COUNT(*) as count FROM customers GROUP BY color_tag;

-- STEP 7: Show the new constraint
SELECT 'New color_tag constraint:' as info;
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'customers'::regclass 
AND contype = 'c' 
AND conname LIKE '%color_tag%';

-- Success message
SELECT 'Color_tag constraint fixed successfully!' as status; 