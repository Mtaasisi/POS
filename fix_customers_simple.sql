-- Simple fix for customers color_tag constraint violation
-- This handles the most common case where 'normal' needs to become 'new'

-- Step 1: Update the problematic data
UPDATE customers SET color_tag = 'new' WHERE color_tag = 'normal';

-- Step 2: Drop the old constraint
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_color_tag_check;

-- Step 3: Add the new constraint
ALTER TABLE customers ADD CONSTRAINT customers_color_tag_check 
CHECK (color_tag IN ('new', 'vip', 'complainer', 'purchased'));

-- Success message
SELECT 'Customers color_tag constraint fixed successfully!' as status; 