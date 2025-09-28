-- Fix RPC function and audit table schema mismatch
-- Migration: 20250131000058_fix_rpc_audit_schema_mismatch.sql

-- First, let's ensure the RPC function exists and is properly defined
-- Drop and recreate the function to ensure it matches the current audit table schema

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS process_purchase_order_payment(
    UUID, UUID, DECIMAL(15,2), VARCHAR(3), VARCHAR(100), UUID, UUID, VARCHAR(255), TEXT
);

-- Recreate the function with proper error handling
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
    exchange_rate DECIMAL(15,4);
    valid_user_id UUID;
BEGIN
    -- Validate purchase order exists
    SELECT id, total_amount, currency, total_paid, lats_purchase_orders.payment_status, lats_purchase_orders.exchange_rate
    INTO order_record
    FROM lats_purchase_orders 
    WHERE id = purchase_order_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Purchase order % not found', purchase_order_id_param;
    END IF;
    
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
        -- Use exchange rate from purchase order if available
        IF order_record.exchange_rate IS NOT NULL AND order_record.exchange_rate > 0 THEN
            -- Convert payment currency to account currency using PO exchange rate
            IF currency_param = order_record.currency THEN
                -- Payment is in PO currency, convert to account currency
                IF account_record.currency = 'TZS' THEN
                    converted_amount := amount_param * order_record.exchange_rate;
                ELSE
                    -- Account is in foreign currency, convert from PO currency
                    converted_amount := amount_param / order_record.exchange_rate;
                END IF;
            ELSE
                -- Payment is in different currency than PO, use simple conversion
                -- For now, assume 1:1 conversion for non-matching currencies
                -- This should be enhanced with proper exchange rate lookup
                converted_amount := amount_param;
            END IF;
        ELSE
            -- No exchange rate available, use 1:1 conversion as fallback
            converted_amount := amount_param;
        END IF;
    END IF;
    
    -- Check account balance with converted amount
    IF account_record.balance < converted_amount THEN
        RAISE EXCEPTION 'Insufficient balance in account. Available: % %, Required: % % (converted from % % %)', 
            account_record.balance, account_record.currency, converted_amount, account_record.currency, amount_param, currency_param, 
            CASE WHEN currency_param != account_record.currency THEN 'using exchange rate' ELSE '' END;
    END IF;
    
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
    
    -- Get a valid user ID - try the provided user_id_param first, then fallback to any valid user
    valid_user_id := user_id_param;
    
    -- If user_id_param is null or the default null UUID, get a valid user from auth.users
    IF valid_user_id IS NULL OR valid_user_id = '00000000-0000-0000-0000-000000000000'::UUID THEN
        SELECT id INTO valid_user_id FROM auth.users LIMIT 1;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'No valid user found in auth.users table';
        END IF;
    END IF;
    
    -- Update finance account balance (use converted amount for account currency)
    UPDATE finance_accounts 
    SET balance = balance - converted_amount,
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
        valid_user_id,
        NOW()
    );
    
    -- Update purchase order payment status
    UPDATE lats_purchase_orders 
    SET total_paid = new_paid,
        payment_status = new_payment_status,
        updated_at = NOW()
    WHERE id = purchase_order_id_param;
    
    -- Add audit entry - ensure the audit table has the correct schema
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
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error and re-raise
        RAISE EXCEPTION 'Error in process_purchase_order_payment: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION process_purchase_order_payment(
    UUID, UUID, DECIMAL(15,2), VARCHAR(3), VARCHAR(100), UUID, UUID, VARCHAR(255), TEXT
) TO authenticated;
