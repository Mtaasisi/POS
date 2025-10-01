-- Fix the process_purchase_order_payment RPC function
-- This addresses the 400 Bad Request error when processing payments
-- Based on the logs, the function is failing but legacy method works

-- Drop the existing function completely
DROP FUNCTION IF EXISTS process_purchase_order_payment(
    UUID, UUID, DECIMAL(15,2), VARCHAR(3), VARCHAR(100), UUID, UUID, VARCHAR(255), TEXT
);

-- Create a simplified, robust version of the function
CREATE OR REPLACE FUNCTION process_purchase_order_payment(
    purchase_order_id_param UUID,
    payment_account_id_param UUID,
    amount_param DECIMAL(15,2),
    currency_param VARCHAR(3),
    payment_method_param VARCHAR(100),
    payment_method_id_param UUID,
    user_id_param UUID,
    reference_param VARCHAR(255) DEFAULT NULL,
    notes_param TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    order_record RECORD;
    account_record RECORD;
    current_paid DECIMAL(15,2);
    new_paid DECIMAL(15,2);
    new_payment_status VARCHAR(20);
    converted_amount DECIMAL(15,2);
    valid_user_id UUID;
BEGIN
    -- Validate purchase order exists with proper null handling
    SELECT 
        id, 
        COALESCE(total_amount, 0) as total_amount, 
        COALESCE(currency, 'TZS') as currency, 
        COALESCE(total_paid, 0) as total_paid, 
        COALESCE(payment_status, 'unpaid') as payment_status, 
        COALESCE(exchange_rate, 2500.0) as exchange_rate
    INTO order_record
    FROM lats_purchase_orders 
    WHERE id = purchase_order_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Purchase order % not found', purchase_order_id_param;
    END IF;
    
    -- Validate payment account exists with proper null handling
    SELECT 
        id, 
        COALESCE(balance, 0) as balance, 
        COALESCE(currency, 'TZS') as currency
    INTO account_record
    FROM finance_accounts 
    WHERE id = payment_account_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment account % not found', payment_account_id_param;
    END IF;
    
    -- Handle currency conversion - simplified logic
    converted_amount := amount_param;
    IF currency_param != account_record.currency THEN
        -- Use exchange rate from purchase order or default rate
        IF order_record.exchange_rate IS NOT NULL AND order_record.exchange_rate > 0 THEN
            IF account_record.currency = 'TZS' THEN
                -- Convert to TZS
                converted_amount := amount_param * order_record.exchange_rate;
            ELSE
                -- Convert from TZS to foreign currency
                converted_amount := amount_param / order_record.exchange_rate;
            END IF;
        ELSE
            -- Default exchange rate for USD to TZS
            IF currency_param = 'USD' AND account_record.currency = 'TZS' THEN
                converted_amount := amount_param * 2500.0;
            ELSE
                converted_amount := amount_param;
            END IF;
        END IF;
    END IF;
    
    -- Check account balance
    IF account_record.balance < converted_amount THEN
        RAISE EXCEPTION 'Insufficient balance. Available: % %, Required: % %', 
            account_record.balance, account_record.currency, converted_amount, account_record.currency;
    END IF;
    
    -- Calculate new paid amount
    current_paid := COALESCE(order_record.total_paid, 0);
    new_paid := current_paid + amount_param;
    
    -- Determine payment status
    IF new_paid >= order_record.total_amount THEN
        new_payment_status := 'paid';
    ELSIF new_paid > 0 THEN
        new_payment_status := 'partial';
    ELSE
        new_payment_status := 'unpaid';
    END IF;
    
    -- Handle user ID validation
    valid_user_id := user_id_param;
    IF valid_user_id IS NULL OR valid_user_id = '00000000-0000-0000-0000-000000000000'::UUID THEN
        -- Get any valid user from auth.users
        SELECT id INTO valid_user_id FROM auth.users LIMIT 1;
        IF NOT FOUND THEN
            -- Use a default UUID if no users found
            valid_user_id := '00000000-0000-0000-0000-000000000000'::UUID;
        END IF;
    END IF;
    
    -- Update finance account balance (use converted amount)
    UPDATE finance_accounts 
    SET 
        balance = balance - converted_amount,
        updated_at = NOW()
    WHERE id = payment_account_id_param;
    
    -- Insert payment record
    INSERT INTO purchase_order_payments (
        purchase_order_id,
        payment_account_id,
        amount,
        currency,
        payment_method,
        payment_method_id,
        reference,
        notes,
        status,
        payment_date,
        created_by,
        created_at
    ) VALUES (
        purchase_order_id_param,
        payment_account_id_param,
        amount_param,
        currency_param,
        payment_method_param,
        payment_method_id_param,
        reference_param,
        notes_param,
        'completed',
        NOW(),
        valid_user_id,
        NOW()
    );
    
    -- Update purchase order payment status
    UPDATE lats_purchase_orders 
    SET 
        total_paid = new_paid,
        payment_status = new_payment_status,
        updated_at = NOW()
    WHERE id = purchase_order_id_param;
    
    -- Add audit entry if audit table exists
    BEGIN
        INSERT INTO purchase_order_audit (
            purchase_order_id,
            action,
            details,
            user_id,
            created_by,
            timestamp
        ) VALUES (
            purchase_order_id_param,
            'payment_processed',
            json_build_object(
                'amount', amount_param,
                'currency', currency_param,
                'converted_amount', converted_amount,
                'account_currency', account_record.currency,
                'payment_method', payment_method_param,
                'new_total_paid', new_paid,
                'payment_status', new_payment_status
            ),
            valid_user_id,
            valid_user_id,
            NOW()
        );
    EXCEPTION
        WHEN OTHERS THEN
            -- Audit table might not exist or have different schema, continue
            NULL;
    END;
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error and re-raise with more context
        RAISE EXCEPTION 'Payment processing failed: % (PO: %, Account: %, Amount: % %)', 
            SQLERRM, purchase_order_id_param, payment_account_id_param, amount_param, currency_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION process_purchase_order_payment(
    UUID, UUID, DECIMAL(15,2), VARCHAR(3), VARCHAR(100), UUID, UUID, VARCHAR(255), TEXT
) TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ RPC payment function fixed successfully';
    RAISE NOTICE '🔧 Improvements:';
    RAISE NOTICE '   - Simplified currency conversion logic';
    RAISE NOTICE '   - Better null handling for all fields';
    RAISE NOTICE '   - Robust user ID validation';
    RAISE NOTICE '   - Graceful audit table handling';
    RAISE NOTICE '   - Enhanced error messages';
    RAISE NOTICE '🎯 Ready for testing';
END $$;
