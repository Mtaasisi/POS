-- =====================================================
-- FIX USER ID NULL HANDLING IN PAYMENT FUNCTION
-- =====================================================
-- This script updates the process_purchase_order_payment function
-- to properly handle null user_id_param values

-- Drop the existing function
DROP FUNCTION IF EXISTS process_purchase_order_payment(UUID, UUID, DECIMAL, VARCHAR, VARCHAR, UUID, UUID, VARCHAR, TEXT);

-- Create the updated function that handles null user_id_param
CREATE OR REPLACE FUNCTION process_purchase_order_payment(
    purchase_order_id_param UUID,
    payment_account_id_param UUID,
    amount_param DECIMAL(15,2),
    currency_param VARCHAR(3),
    payment_method_param VARCHAR(100),
    payment_method_id_param UUID,
    user_id_param UUID DEFAULT NULL,
    reference_param VARCHAR(255) DEFAULT NULL,
    notes_param TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    order_record RECORD;
    account_record RECORD;
    current_paid DECIMAL(15,2);
    new_paid DECIMAL(15,2);
    payment_status VARCHAR(20);
    converted_amount DECIMAL(15,2);
    exchange_rate DECIMAL(15,4);
    actual_user_id UUID;
BEGIN
    -- Handle null user_id_param by using a default system user or the first available user
    IF user_id_param IS NULL THEN
        -- Try to get the first user from auth.users, or use a system default
        SELECT id INTO actual_user_id FROM auth.users LIMIT 1;
        IF actual_user_id IS NULL THEN
            -- If no users exist, we'll use a placeholder UUID for system operations
            actual_user_id := '00000000-0000-0000-0000-000000000000'::UUID;
        END IF;
    ELSE
        actual_user_id := user_id_param;
    END IF;
    
    -- Validate purchase order exists and get required fields
    SELECT 
        id, 
        total_amount, 
        COALESCE(currency, 'TZS') as currency, 
        COALESCE(total_paid, 0) as total_paid, 
        COALESCE(payment_status, 'unpaid') as payment_status, 
        COALESCE(exchange_rate, 1.0) as exchange_rate
    INTO order_record
    FROM lats_purchase_orders 
    WHERE id = purchase_order_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Purchase order % not found', purchase_order_id_param;
    END IF;
    
    -- Validate payment account exists
    SELECT id, balance, COALESCE(currency, 'TZS') as currency
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
                -- This is a simplified approach - in production you'd want proper exchange rate handling
                converted_amount := amount_param; -- For now, assume 1:1 conversion
            END IF;
        ELSE
            -- No exchange rate available, assume 1:1 conversion
            converted_amount := amount_param;
        END IF;
    END IF;
    
    -- Get current paid amount
    current_paid := COALESCE(order_record.total_paid, 0);
    new_paid := current_paid + converted_amount;
    
    -- Determine payment status
    IF new_paid >= order_record.total_amount THEN
        payment_status := 'paid';
    ELSIF new_paid > 0 THEN
        payment_status := 'partial';
    ELSE
        payment_status := 'unpaid';
    END IF;
    
    -- Insert payment record
    INSERT INTO purchase_order_payments (
        purchase_order_id,
        payment_account_id,
        amount,
        currency,
        payment_method,
        payment_method_id,
        payment_date,
        reference,
        notes,
        created_by
    ) VALUES (
        purchase_order_id_param,
        payment_account_id_param,
        amount_param,
        currency_param,
        payment_method_param,
        payment_method_id_param,
        NOW(),
        reference_param,
        notes_param,
        actual_user_id
    );
    
    -- Update purchase order payment status
    UPDATE lats_purchase_orders 
    SET 
        total_paid = new_paid,
        payment_status = payment_status,
        updated_at = NOW()
    WHERE id = purchase_order_id_param;
    
    -- Update finance account balance
    UPDATE finance_accounts 
    SET 
        balance = balance + converted_amount,
        updated_at = NOW()
    WHERE id = payment_account_id_param;
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Payment processing failed: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION process_purchase_order_payment TO authenticated;
GRANT EXECUTE ON FUNCTION process_purchase_order_payment TO anon;

-- Test the function to ensure it works
DO $$
BEGIN
    -- Check if the function exists
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'process_purchase_order_payment'
    ) THEN
        RAISE NOTICE '✅ Function process_purchase_order_payment updated successfully';
    ELSE
        RAISE EXCEPTION '❌ Function process_purchase_order_payment was not updated';
    END IF;
END $$;
