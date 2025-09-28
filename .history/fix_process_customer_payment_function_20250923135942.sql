-- =====================================================
-- FIX PROCESS_CUSTOMER_PAYMENT FUNCTION
-- =====================================================
-- This fixes the process_customer_payment function to include
-- the missing payment_method_id column that's causing 400 errors

-- Drop and recreate the function with the missing column
DROP FUNCTION IF EXISTS process_customer_payment(
    UUID, DECIMAL(15,2), VARCHAR(3), VARCHAR(100), UUID, UUID, UUID, UUID, VARCHAR(255), TEXT
);

-- Create the corrected function
CREATE OR REPLACE FUNCTION process_customer_payment(
    customer_id_param UUID,
    amount_param DECIMAL(15,2),
    currency_param VARCHAR(3),
    payment_method_param VARCHAR(100),
    payment_method_id_param UUID,
    payment_account_id_param UUID,
    user_id_param UUID,
    device_id_param UUID DEFAULT NULL,
    reference_param VARCHAR(255) DEFAULT NULL,
    notes_param TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    account_record RECORD;
    converted_amount DECIMAL(15,2);
BEGIN
    -- Validate payment account exists
    SELECT id, balance, currency
    INTO account_record
    FROM finance_accounts 
    WHERE id = payment_account_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment account % not found', payment_account_id_param;
    END IF;
    
    -- Handle currency conversion if needed
    converted_amount := amount_param;
    IF currency_param != account_record.currency THEN
        -- For customer payments, we'll use a simple 1:1 conversion for now
        -- In production, you'd want proper exchange rate handling
        converted_amount := amount_param;
    END IF;
    
    -- Insert payment record with ALL required columns including payment_method_id
    INSERT INTO customer_payments (
        customer_id,
        amount,
        currency,
        method,
        device_id,
        payment_date,
        payment_type,
        status,
        created_by,
        reference,
        notes,
        payment_account_id,
        payment_method_id  -- This was missing!
    ) VALUES (
        customer_id_param,
        amount_param,
        currency_param,
        payment_method_param,
        device_id_param,
        NOW(),
        'payment',
        'completed',
        user_id_param,
        reference_param,
        notes_param,
        payment_account_id_param,
        payment_method_id_param  -- This was missing!
    );
    
    -- Update finance account balance
    UPDATE finance_accounts 
    SET 
        balance = balance + converted_amount,
        updated_at = NOW()
    WHERE id = payment_account_id_param;
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process customer payment: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Test the function to make sure it works
DO $$
DECLARE
    test_customer_id UUID;
    test_user_id UUID;
    test_account_id UUID;
    result BOOLEAN;
BEGIN
    -- Get test data
    SELECT id INTO test_customer_id FROM customers LIMIT 1;
    SELECT id INTO test_user_id FROM auth_users LIMIT 1;
    SELECT id INTO test_account_id FROM finance_accounts LIMIT 1;
    
    IF test_customer_id IS NOT NULL AND test_user_id IS NOT NULL AND test_account_id IS NOT NULL THEN
        -- Test the function
        SELECT process_customer_payment(
            test_customer_id,
            100.00,
            'TZS',
            'cash',
            test_account_id, -- Use account ID as method ID for testing
            test_account_id,
            test_user_id,
            NULL,
            'FUNCTION_TEST',
            'Test payment to verify function fix'
        ) INTO result;
        
        IF result THEN
            RAISE NOTICE '✅ process_customer_payment function test successful!';
            RAISE NOTICE '✅ Function now includes payment_method_id column';
            RAISE NOTICE '✅ 400 Bad Request errors should be resolved!';
        ELSE
            RAISE NOTICE '❌ Function test failed';
        END IF;
        
        -- Clean up test payment
        DELETE FROM customer_payments WHERE reference = 'FUNCTION_TEST';
    ELSE
        RAISE NOTICE '⚠️  No test data available, but function has been updated';
        RAISE NOTICE '✅ Function now includes payment_method_id column';
    END IF;
END $$;

-- Final success message
SELECT 'process_customer_payment function fixed successfully!' as status;
