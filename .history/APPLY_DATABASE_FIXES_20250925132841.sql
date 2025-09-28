-- =====================================================
-- COMPREHENSIVE DATABASE FIXES FOR PRODUCTION
-- =====================================================

-- Fix Customer 0186 Data (Critical)
UPDATE customers SET
    total_spent = 29396000,
    total_purchases = 129,
    points = 29396,
    loyalty_level = 'platinum',
    color_tag = 'vip',
    updated_at = NOW()
WHERE phone = '25564000186';

-- Verify the fix
SELECT 
    name,
    phone,
    total_spent,
    total_purchases,
    points,
    loyalty_level,
    color_tag,
    updated_at
FROM customers 
WHERE phone = '25564000186';

-- Fix any other customers with zero total_spent but have payments
UPDATE customers 
SET 
    total_spent = (
        SELECT COALESCE(SUM(amount), 0)
        FROM payments 
        WHERE customer_id = customers.id 
        AND status = 'completed'
    ),
    total_purchases = (
        SELECT COUNT(*)
        FROM payments 
        WHERE customer_id = customers.id 
        AND status = 'completed'
    ),
    points = (
        SELECT COALESCE(SUM(amount), 0) / 1000
        FROM payments 
        WHERE customer_id = customers.id 
        AND status = 'completed'
    ),
    updated_at = NOW()
WHERE total_spent = 0 
AND id IN (
    SELECT DISTINCT customer_id 
    FROM payments 
    WHERE status = 'completed' 
    AND amount > 0
);

-- Update loyalty levels based on total_spent
UPDATE customers 
SET 
    loyalty_level = CASE
        WHEN total_spent >= 50000000 THEN 'platinum'
        WHEN total_spent >= 20000000 THEN 'gold'
        WHEN total_spent >= 10000000 THEN 'silver'
        ELSE 'bronze'
    END,
    updated_at = NOW()
WHERE total_spent > 0;

-- Update color tags based on loyalty and activity
UPDATE customers 
SET 
    color_tag = CASE
        WHEN loyalty_level = 'platinum' THEN 'vip'
        WHEN total_purchases >= 50 THEN 'purchased'
        WHEN created_at > NOW() - INTERVAL '30 days' THEN 'new'
        ELSE 'regular'
    END,
    updated_at = NOW()
WHERE total_spent > 0;

-- Fix any missing device relationships
UPDATE devices 
SET 
    customer_id = (
        SELECT id 
        FROM customers 
        WHERE customers.phone = devices.customer_phone 
        LIMIT 1
    ),
    updated_at = NOW()
WHERE customer_id IS NULL 
AND customer_phone IS NOT NULL;

-- Clean up any orphaned records
DELETE FROM payments 
WHERE customer_id NOT IN (SELECT id FROM customers);

DELETE FROM devices 
WHERE customer_id NOT IN (SELECT id FROM customers);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_total_spent ON customers(total_spent);
CREATE INDEX IF NOT EXISTS idx_customers_loyalty_level ON customers(loyalty_level);
CREATE INDEX IF NOT EXISTS idx_customers_color_tag ON customers(color_tag);
CREATE INDEX IF NOT EXISTS idx_payments_customer_status ON payments(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_devices_customer_id ON devices(customer_id);

-- Final verification query
SELECT 
    'Customer Data Summary' as report_type,
    COUNT(*) as total_customers,
    COUNT(CASE WHEN total_spent > 0 THEN 1 END) as customers_with_purchases,
    SUM(total_spent) as total_revenue,
    AVG(total_spent) as avg_spent_per_customer,
    COUNT(CASE WHEN loyalty_level = 'platinum' THEN 1 END) as platinum_customers,
    COUNT(CASE WHEN loyalty_level = 'gold' THEN 1 END) as gold_customers,
    COUNT(CASE WHEN loyalty_level = 'silver' THEN 1 END) as silver_customers,
    COUNT(CASE WHEN loyalty_level = 'bronze' THEN 1 END) as bronze_customers
FROM customers;

-- Show top customers
SELECT 
    name,
    phone,
    total_spent,
    total_purchases,
    points,
    loyalty_level,
    color_tag
FROM customers 
WHERE total_spent > 0
ORDER BY total_spent DESC 
LIMIT 10;
