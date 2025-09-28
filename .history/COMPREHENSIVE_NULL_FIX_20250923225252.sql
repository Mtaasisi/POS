-- =====================================================
-- COMPREHENSIVE NULL FIX FOR CUSTOMER_PAYMENTS
-- =====================================================
-- This fixes all potential null constraint issues

-- Step 1: Make all potentially problematic columns nullable
ALTER TABLE customer_payments 
ALTER COLUMN payment_account_id DROP NOT NULL;

ALTER TABLE customer_payments 
ALTER COLUMN payment_method_id DROP NOT NULL;

ALTER TABLE customer_payments 
ALTER COLUMN reference DROP NOT NULL;

ALTER TABLE customer_payments 
ALTER COLUMN notes DROP NOT NULL;

-- Step 2: Set default values
ALTER TABLE customer_payments 
ALTER COLUMN payment_account_id SET DEFAULT NULL;

ALTER TABLE customer_payments 
ALTER COLUMN payment_method_id SET DEFAULT NULL;

ALTER TABLE customer_payments 
ALTER COLUMN reference SET DEFAULT NULL;

ALTER TABLE customer_payments 
ALTER COLUMN notes SET DEFAULT NULL;

-- Step 3: Check if created_at and payment_date should be auto-generated
-- If they are, we need to handle them differently

-- Step 4: Test insert with the exact payload your app is sending
DO $$
DECLARE
    test_customer_id UUID := '97051a56-3c5c-4343-906c-ce43cdf20436';
    test_device_id UUID := '61db5c36-af6d-4936-b3f8-5f39fcc74784';
    test_user_id UUID;
    test_payment_id UUID;
BEGIN
    -- Get a valid user ID
    SELECT id INTO test_user_id FROM auth_users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Try to insert with the exact payload your app is sending
        INSERT INTO customer_payments (
            customer_id,
            device_id,
            amount,
            method,
            payment_type,
            status,
            currency,
            notes,
            payment_account_id,
            payment_method_id,
            reference,
            created_by
        ) VALUES (
            test_customer_id,
            test_device_id,
            100.00,  -- You didn't include amount in the payload, using default
            'cash',
            'payment',
            'completed',
            'TZS',
            'Device repair payment - Xiaomi Redmi Note 10',
            NULL,  -- payment_account_id
            NULL,  -- payment_method_id
            NULL,  -- reference
            test_user_id
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
        RAISE NOTICE 'Error Detail: %', SQLERRM;
END $$;

-- Step 5: Check current column constraints
SELECT 
    column_name,
    is_nullable,
    column_default,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'customer_payments'
AND column_name IN ('payment_account_id', 'payment_method_id', 'reference', 'notes', 'created_at', 'payment_date')
ORDER BY column_name;

-- Final success message
SELECT 'Comprehensive null constraints fix applied!' as status;
