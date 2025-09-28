
-- Update Customer 0186 with correct transaction data
UPDATE customers SET
    name = 'Customer 0186',
    total_spent = 29396000,
    points = 29396,
    loyalty_level = 'platinum',
    color_tag = 'vip',
    total_purchases = 129,
    last_visit = '2023-10-03T16:43:02Z',
    last_purchase_date = '2023-10-03T16:43:02Z',
    updated_at = NOW()
WHERE phone = '25564000186';

-- Verify the update
SELECT name, total_spent, points, loyalty_level, color_tag 
FROM customers 
WHERE phone = '25564000186';
