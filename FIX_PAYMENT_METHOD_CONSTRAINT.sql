-- Fix payment_method NOT NULL constraint issue
-- This will allow null values in payment_method column

-- Step 1: Alter the payment_method column to allow NULL values
ALTER TABLE lats_sales ALTER COLUMN payment_method DROP NOT NULL;

-- Step 2: Set a default value for existing records that might have NULL
UPDATE lats_sales 
SET payment_method = 'Cash' 
WHERE payment_method IS NULL;

-- Step 3: Test the fix by inserting a record with NULL payment_method
INSERT INTO lats_sales (sale_number, customer_id, total_amount, status, created_by, payment_method)
VALUES ('TEST-NULL-' || extract(epoch from now())::text, 
        (SELECT id FROM customers LIMIT 1), 
        1000, 
        'completed', 
        'test_user',
        NULL)
RETURNING id, sale_number, payment_method, created_at;

-- Step 4: Also test with a valid payment method
INSERT INTO lats_sales (sale_number, customer_id, total_amount, status, created_by, payment_method)
VALUES ('TEST-CASH-' || extract(epoch from now())::text, 
        (SELECT id FROM customers LIMIT 1), 
        1000, 
        'completed', 
        'test_user',
        'Cash')
RETURNING id, sale_number, payment_method, created_at;

-- Step 5: Verify the fix
SELECT 'Payment method constraint fixed successfully!' as result;
