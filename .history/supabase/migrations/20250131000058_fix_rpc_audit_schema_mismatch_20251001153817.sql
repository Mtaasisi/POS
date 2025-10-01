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
    amount_in_tzs DECIMAL(15,2);
    original_amount DECIMAL(15,2);
    original_currency VARCHAR(3);
    account_balance_in_tzs DECIMAL(15,2);
    deduction_amount DECIMAL(15,2);
    valid_user_id UUID;
BEGIN
    -- Validate purchase order exists
    SELECT id, total_amount, currency, total_paid, payment_status, exchange_rate
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
    
    -- Store original amount and currency for reference
    original_amount := amount_param;
    original_currency := currency_param;
    
    -- Convert to TZS if payment is in foreign currency
    IF currency_param != 'TZS' THEN
        -- Use exchange rate from purchase order if available
        IF order_record.exchange_rate IS NOT NULL AND order_record.exchange_rate > 0 THEN
            -- Convert foreign currency to TZS
            amount_in_tzs := amount_param * order_record.exchange_rate;
            RAISE NOTICE 'Converting % % to TZS using exchange rate %: % TZS', 
                original_amount, original_currency, order_record.exchange_rate, amount_in_tzs;
        ELSE
            RAISE EXCEPTION 'Exchange rate not available for purchase order. Cannot convert % to TZS', currency_param;
        END IF;
    ELSE
        -- Payment is already in TZS
        amount_in_tzs := amount_param;
    END IF;
    
    -- Check if account has enough balance (convert to TZS for comparison)
    IF account_record.currency = 'TZS' THEN
        account_balance_in_tzs := account_record.balance;
    ELSE
        -- Convert account balance to TZS if needed
        IF order_record.exchange_rate IS NOT NULL AND order_record.exchange_rate > 0 THEN
            account_balance_in_tzs := account_record.balance * order_record.exchange_rate;
        ELSE
            account_balance_in_tzs := account_record.balance;
        END IF;
    END IF;
    
    IF account_balance_in_tzs < amount_in_tzs THEN
        RAISE EXCEPTION 'Insufficient balance. Available: % TZS, Required: % TZS (from % %)', 
            account_balance_in_tzs, amount_in_tzs, original_amount, original_currency;
    END IF;
    
    -- Calculate new payment status (using TZS amounts)
    current_paid := COALESCE(order_record.total_paid, 0);
    new_paid := current_paid + amount_in_tzs;
    
    -- Determine payment status
    IF new_paid >= order_record.total_amount THEN
        new_payment_status := 'paid';
    ELSIF new_paid > 0 THEN
        new_payment_status := 'partial';
    ELSE
        new_payment_status := 'unpaid';
    END IF;
    
    -- Get a valid user ID
    valid_user_id := user_id_param;
    
    IF valid_user_id IS NULL OR valid_user_id = '00000000-0000-0000-0000-000000000000'::UUID THEN
        SELECT id INTO valid_user_id FROM auth.users LIMIT 1;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'No valid user found in auth.users table';
        END IF;
    END IF;
    
    -- Deduct from account balance (convert TZS back to account currency if needed)
    IF account_record.currency = 'TZS' THEN
        deduction_amount := amount_in_tzs;
    ELSE
        -- Convert TZS back to account currency
        IF order_record.exchange_rate IS NOT NULL AND order_record.exchange_rate > 0 THEN
            deduction_amount := amount_in_tzs / order_record.exchange_rate;
        ELSE
            deduction_amount := amount_in_tzs;
        END IF;
    END IF;
    
    UPDATE finance_accounts 
    SET balance = balance - deduction_amount,
        updated_at = NOW()
    WHERE id = payment_account_id_param;
    
    -- Insert payment record (always store in TZS)
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
        amount_in_tzs,  -- Store converted TZS amount
        'TZS',          -- Always store as TZS
        payment_method_param,
        payment_method_id_param,
        CASE 
            WHEN original_currency != 'TZS' THEN 
                COALESCE(reference_param, '') || ' (Original: ' || original_amount || ' ' || original_currency || ')'
            ELSE 
                reference_param
        END,
        CASE 
            WHEN original_currency != 'TZS' THEN 
                COALESCE(notes_param, '') || ' | Converted from ' || original_amount || ' ' || original_currency || ' to ' || amount_in_tzs || ' TZS using rate ' || order_record.exchange_rate
            ELSE 
                notes_param
        END,
        valid_user_id,
        NOW()
    );
    
    -- Update purchase order with TZS payment
    UPDATE lats_purchase_orders 
    SET total_paid = new_paid,
        payment_status = new_payment_status,
        updated_at = NOW()
    WHERE id = purchase_order_id_param;
    
    -- Add audit entry
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
            'original_amount', original_amount,
            'original_currency', original_currency,
            'amount_in_tzs', amount_in_tzs,
            'exchange_rate', order_record.exchange_rate,
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
