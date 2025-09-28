-- =====================================================
-- TEST CUSTOMER_PAYMENTS 400 ERROR FIX
-- =====================================================
-- Run this script AFTER applying the comprehensive fix
-- to verify that the 400 error has been resolved

-- =====================================================
-- TEST 1: VERIFY TABLE STRUCTURE
-- =====================================================

DO $$
DECLARE
    required_columns TEXT[] := ARRAY[
        'id', 'customer_id', 'device_id', 'amount', 'method', 
        'payment_type', 'status', 'payment_date', 'created_by', 
        'created_at', 'updated_at', 'currency', 'payment_account_id', 
        'payment_method_id', 'reference', 'notes', 'updated_by'
    ];
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    col_name TEXT;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TEST 1: VERIFYING TABLE STRUCTURE';
    RAISE NOTICE '========================================';
    
    FOREACH col_name IN ARRAY required_columns
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'customer_payments'
            AND column_name = col_name
        ) THEN
            missing_columns := array_append(missing_columns, col_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) IS NULL THEN
        RAISE NOTICE '✅ PASS: All required columns are present';
    ELSE
        RAISE NOTICE '❌ FAIL: Missing columns: %', array_to_string(missing_columns, ', ');
    END IF;
    
END $$;

-- =====================================================
-- TEST 2: TEST DIRECT INSERT
-- =====================================================

DO $$
DECLARE
    test_customer_id UUID;
    test_device_id UUID;
    test_user_id UUID;
    test_account_id UUID;
    test_payment_id UUID;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TEST 2: TESTING DIRECT INSERT';
    RAISE NOTICE '========================================';
    
    -- Get test data
    SELECT id INTO test_customer_id FROM customers LIMIT 1;
    SELECT id INTO test_device_id FROM devices LIMIT 1;
    SELECT id INTO test_user_id FROM auth_users LIMIT 1;
    SELECT id INTO test_account_id FROM finance_accounts LIMIT 1;
    
    IF test_customer_id IS NOT NULL AND test_user_id IS NOT NULL AND test_account_id IS NOT NULL THEN
        BEGIN
            -- Try to insert a test payment with all columns
            INSERT INTO customer_payments (
                customer_id, device_id, amount, method, payment_type, 
                status, currency, reference, notes, created_by, 
                payment_account_id, payment_method_id
            ) VALUES (
                test_customer_id, 
                test_device_id, 
                100.00, 
                'cash', 
                'payment', 
                'completed', 
                'TZS', 
                'DIRECT_INSERT_TEST', 
                'Test payment for direct insert',
                test_user_id,
                test_account_id,
                test_account_id
            ) RETURNING id INTO test_payment_id;
            
            -- Clean up
            DELETE FROM customer_payments WHERE id = test_payment_id;
            
            RAISE NOTICE '✅ PASS: Direct insert successful';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '❌ FAIL: Direct insert failed: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE '⚠️  SKIP: No test data available';
    END IF;
    
END $$;

-- =====================================================
-- TEST 3: TEST FUNCTION CALL
-- =====================================================

DO $$
DECLARE
    test_customer_id UUID;
    test_device_id UUID;
    test_user_id UUID;
    test_account_id UUID;
    result BOOLEAN;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TEST 3: TESTING FUNCTION CALL';
    RAISE NOTICE '========================================';
    
    -- Get test data
    SELECT id INTO test_customer_id FROM customers LIMIT 1;
    SELECT id INTO test_device_id FROM devices LIMIT 1;
    SELECT id INTO test_user_id FROM auth_users LIMIT 1;
    SELECT id INTO test_account_id FROM finance_accounts LIMIT 1;
    
    IF test_customer_id IS NOT NULL AND test_user_id IS NOT NULL AND test_account_id IS NOT NULL THEN
        BEGIN
            -- Test the function
            SELECT process_customer_payment(
                test_customer_id,
                50.00,
                'TZS',
                'cash',
                test_account_id,
                test_account_id,
                test_user_id,
                test_device_id,
                'FUNCTION_TEST',
                'Test function call'
            ) INTO result;
            
            IF result THEN
                RAISE NOTICE '✅ PASS: Function call successful';
                -- Clean up
                DELETE FROM customer_payments WHERE reference = 'FUNCTION_TEST';
            ELSE
                RAISE NOTICE '❌ FAIL: Function returned false';
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '❌ FAIL: Function call failed: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE '⚠️  SKIP: No test data available';
    END IF;
    
END $$;

-- =====================================================
-- TEST 4: TEST CONSTRAINTS
-- =====================================================

DO $$
DECLARE
    test_customer_id UUID;
    test_user_id UUID;
    test_account_id UUID;
    test_payment_id UUID;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TEST 4: TESTING CONSTRAINTS';
    RAISE NOTICE '========================================';
    
    -- Get test data
    SELECT id INTO test_customer_id FROM customers LIMIT 1;
    SELECT id INTO test_user_id FROM auth_users LIMIT 1;
    SELECT id INTO test_account_id FROM finance_accounts LIMIT 1;
    
    IF test_customer_id IS NOT NULL AND test_user_id IS NOT NULL AND test_account_id IS NOT NULL THEN
        -- Test invalid currency
        BEGIN
            INSERT INTO customer_payments (
                customer_id, amount, method, payment_type, 
                status, currency, created_by, payment_account_id
            ) VALUES (
                test_customer_id, 100.00, 'cash', 'payment', 
                'completed', 'XYZ', test_user_id, test_account_id
            );
            
            RAISE NOTICE '❌ FAIL: Invalid currency was accepted';
            DELETE FROM customer_payments WHERE currency = 'XYZ';
        EXCEPTION
            WHEN check_violation THEN
                RAISE NOTICE '✅ PASS: Currency constraint working';
        END;
        
        -- Test invalid method
        BEGIN
            INSERT INTO customer_payments (
                customer_id, amount, method, payment_type, 
                status, currency, created_by, payment_account_id
            ) VALUES (
                test_customer_id, 100.00, 'invalid_method', 'payment', 
                'completed', 'TZS', test_user_id, test_account_id
            );
            
            RAISE NOTICE '❌ FAIL: Invalid method was accepted';
            DELETE FROM customer_payments WHERE method = 'invalid_method';
        EXCEPTION
            WHEN check_violation THEN
                RAISE NOTICE '✅ PASS: Method constraint working';
        END;
        
    ELSE
        RAISE NOTICE '⚠️  SKIP: No test data available';
    END IF;
    
END $$;

-- =====================================================
-- TEST 5: TEST RLS POLICIES
-- =====================================================

DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TEST 5: TESTING RLS POLICIES';
    RAISE NOTICE '========================================';
    
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'customer_payments';
    
    IF policy_count > 0 THEN
        RAISE NOTICE '✅ PASS: RLS policies are configured';
    ELSE
        RAISE NOTICE '❌ FAIL: No RLS policies found';
    END IF;
    
END $$;

-- =====================================================
-- FINAL TEST SUMMARY
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'FINAL TEST SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'If all tests passed, your 400 error should be fixed!';
    RAISE NOTICE 'If any tests failed, check the error messages above.';
    RAISE NOTICE '========================================';
END $$;
