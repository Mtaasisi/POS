-- =====================================================
-- SIMPLE INSERT TEST
-- =====================================================
-- Test if we can insert a payment directly

DO $$
DECLARE
    test_customer_id UUID;
    test_user_id UUID;
    test_account_id UUID;
    test_payment_id UUID;
BEGIN
    -- Get test data
    SELECT id INTO test_customer_id FROM customers LIMIT 1;
    SELECT id INTO test_user_id FROM auth_users LIMIT 1;
    SELECT id INTO test_account_id FROM finance_accounts LIMIT 1;
    
    IF test_customer_id IS NOT NULL AND test_user_id IS NOT NULL AND test_account_id IS NOT NULL THEN
        -- Try a simple insert
        INSERT INTO customer_payments (
            customer_id, 
            amount, 
            method, 
            payment_type, 
            status, 
            currency, 
            created_by, 
            payment_account_id
        ) VALUES (
            test_customer_id, 
            100.00, 
            'cash', 
            'payment', 
            'completed', 
            'TZS', 
            test_user_id, 
            test_account_id
        ) RETURNING id INTO test_payment_id;
        
        RAISE NOTICE '✅ SUCCESS: Direct insert worked! Payment ID: %', test_payment_id;
        
        -- Clean up
        DELETE FROM customer_payments WHERE id = test_payment_id;
        
    ELSE
        RAISE NOTICE '❌ No test data available';
        RAISE NOTICE 'Customers: %', (SELECT COUNT(*) FROM customers);
        RAISE NOTICE 'Users: %', (SELECT COUNT(*) FROM auth_users);
        RAISE NOTICE 'Accounts: %', (SELECT COUNT(*) FROM finance_accounts);
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ INSERT FAILED: %', SQLERRM;
        RAISE NOTICE 'Error Code: %', SQLSTATE;
END $$;
