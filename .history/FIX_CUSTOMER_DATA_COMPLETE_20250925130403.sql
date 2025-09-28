-- Complete Customer Data Fix
-- Run this SQL in your Supabase database

-- First, let's check what color_tag values are currently in the database
SELECT DISTINCT color_tag, COUNT(*) as count 
FROM customers 
GROUP BY color_tag 
ORDER BY count DESC;

-- Fix Customer 0186 data with correct color_tag value
UPDATE customers SET
    total_spent = 29396000,
    total_purchases = 129,
    points = 29396,
    loyalty_level = 'platinum',
    color_tag = 'vip'  -- Changed from 'VIP' to 'vip' (lowercase)
WHERE phone = '25564000186';

-- Fix any other customers with incorrect data
UPDATE customers SET
    total_spent = COALESCE(total_spent, 0),
    total_purchases = COALESCE(total_purchases, 0),
    points = COALESCE(points, 0),
    loyalty_level = COALESCE(loyalty_level, 'bronze'),
    color_tag = CASE 
        WHEN color_tag IS NULL THEN 'new'
        WHEN UPPER(color_tag) = 'VIP' THEN 'vip'
        WHEN UPPER(color_tag) = 'NEW' THEN 'new'
        WHEN UPPER(color_tag) = 'COMPLAINER' THEN 'complainer'
        WHEN UPPER(color_tag) = 'PURCHASED' THEN 'purchased'
        WHEN UPPER(color_tag) = 'NORMAL' THEN 'normal'
        ELSE 'new'  -- Default to 'new' for any invalid values
    END
WHERE total_spent IS NULL 
   OR total_purchases IS NULL 
   OR points IS NULL 
   OR loyalty_level IS NULL
   OR color_tag IS NULL
   OR UPPER(color_tag) NOT IN ('NEW', 'VIP', 'COMPLAINER', 'PURCHASED', 'NORMAL');

-- Verify the fix
SELECT 
    name,
    phone,
    total_spent,
    total_purchases,
    points,
    loyalty_level,
    color_tag
FROM customers 
WHERE phone = '25564000186';

-- Show all valid color_tag values for reference
SELECT 'Valid color_tag values:' as info
UNION ALL
SELECT 'new' as valid_values
UNION ALL
SELECT 'vip' as valid_values
UNION ALL
SELECT 'complainer' as valid_values
UNION ALL
SELECT 'purchased' as valid_values
UNION ALL
SELECT 'normal' as valid_values;
