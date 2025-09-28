-- Fix Customer Data Issues
-- Run this SQL in your Supabase database

-- Fix Customer 0186 data
UPDATE customers SET
    total_spent = 29396000,
    total_purchases = 129,
    points = 29396,
    loyalty_level = 'platinum',
    color_tag = 'VIP'
WHERE phone = '25564000186';

-- Fix any other customers with incorrect data
UPDATE customers SET
    total_spent = COALESCE(total_spent, 0),
    total_purchases = COALESCE(total_purchases, 0),
    points = COALESCE(points, 0),
    loyalty_level = COALESCE(loyalty_level, 'bronze')
WHERE total_spent IS NULL 
   OR total_purchases IS NULL 
   OR points IS NULL 
   OR loyalty_level IS NULL;

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
