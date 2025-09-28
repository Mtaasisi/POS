-- Quick Fix for Customer 0186
-- Run this SQL in your Supabase database

UPDATE customers SET
    total_spent = 29396000,
    total_purchases = 129,
    points = 29396,
    loyalty_level = 'platinum',
    color_tag = 'vip'
WHERE phone = '25564000186';

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