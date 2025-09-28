-- =====================================================
-- FIX NULL CONSTRAINTS FOR CUSTOMER_PAYMENTS
-- =====================================================
-- This fixes the issue where payment_account_id and payment_method_id
-- are being sent as null but have constraints preventing null values

-- Step 1: Check current constraints on these columns
SELECT 
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'customer_payments'
AND column_name IN ('payment_account_id', 'payment_method_id');

-- Step 2: Make payment_account_id nullable if it isn't already
ALTER TABLE customer_payments 
ALTER COLUMN payment_account_id DROP NOT NULL;

-- Step 3: Make payment_method_id nullable if it isn't already  
ALTER TABLE customer_payments 
ALTER COLUMN payment_method_id DROP NOT NULL;

-- Step 4: Add default values for these columns
ALTER TABLE customer_payments 
ALTER COLUMN payment_account_id SET DEFAULT NULL;

ALTER TABLE customer_payments 
ALTER COLUMN payment_method_id SET DEFAULT NULL;

-- Step 5: Verify the changes
SELECT 
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'customer_payments'
AND column_name IN ('payment_account_id', 'payment_method_id');

-- Step 6: Test insert with null values
DO $$
DECLARE
    test_customer_id UUID;
    test_user_id UUID;
    test_payment_id UUID;
BEGIN
    -- Get test data
    SELECT id INTO test_customer_id FROM customers LIMIT 1;
    SELECT id INTO test_user_id FROM auth_users LIMIT 1;
    
    IF test_customer_id IS NOT NULL AND test_user_id IS NOT NULL THEN
        -- Try to insert with null values (like your app is doing)
        INSERT INTO customer_payments (
            customer_id, 
            amount, 
            method, 
            payment_type, 
            status, 
            currency, 
            created_by,
            payment_account_id,
            payment_method_id,
            notes,
            reference
        ) VALUES (
            test_customer_id, 
            100.00, 
            'cash', 
            'payment', 
            'completed', 
            'TZS', 
            test_user_id,
            NULL,  -- payment_account_id
            NULL,  -- payment_method_id
            'Test payment with null values',
            NULL   -- reference
        ) RETURNING id INTO test_payment_id;
        
        RAISE NOTICE '✅ SUCCESS: Insert with null values worked! Payment ID: %', test_payment_id;
        
        -- Clean up
        DELETE FROM customer_payments WHERE id = test_payment_id;
        
    ELSE
        RAISE NOTICE '❌ No test data available';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ INSERT FAILED: %', SQLERRM;
        RAISE NOTICE 'Error Code: %', SQLSTATE;
END $$;

-- Final success message
SELECT 'Null constraints fixed for customer_payments!' as status;
