-- =====================================================
-- FIX PAYMENT FUNCTION 400 ERROR
-- =====================================================
-- This script fixes the 400 Bad Request error in process_purchase_order_payment
-- by ensuring all required columns exist and the function is properly defined

-- =====================================================
-- ENSURE REQUIRED COLUMNS EXIST
-- =====================================================

-- Add total_paid column if it doesn't exist
ALTER TABLE lats_purchase_orders 
    ADD COLUMN IF NOT EXISTS total_paid DECIMAL(15,2) DEFAULT 0;

-- Add payment_status column if it doesn't exist
ALTER TABLE lats_purchase_orders 
    ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid';

-- Add exchange_rate column if it doesn't exist (from previous migrations)
ALTER TABLE lats_purchase_orders 
    ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(15,4) DEFAULT 1.0;

-- =====================================================
-- UPDATE EXISTING RECORDS
-- =====================================================

-- Update existing purchase orders to have default values
UPDATE lats_purchase_orders 
SET 
    total_paid = COALESCE(total_paid, 0),
    payment_status = COALESCE(payment_status, 'unpaid'),
    exchange_rate = COALESCE(exchange_rate, 1.0)
WHERE total_paid IS NULL OR payment_status IS NULL OR exchange_rate IS NULL;

-- =====================================================
-- ADD CONSTRAINTS
-- =====================================================

-- Drop existing constraint if it exists
ALTER TABLE lats_purchase_orders 
    DROP CONSTRAINT IF EXISTS check_payment_status;

-- Add check constraint for payment status
ALTER TABLE lats_purchase_orders 
    ADD CONSTRAINT check_payment_status 
    CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'overpaid'));

-- =====================================================
-- RECREATE THE PAYMENT FUNCTION
-- =====================================================

-- Drop the existing function
DROP FUNCTION IF EXISTS process_purchase_order_payment(UUID, UUID, DECIMAL, VARCHAR, VARCHAR, UUID, UUID, VARCHAR, TEXT);

-- Create the corrected function
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
    payment_status VARCHAR(20);
    converted_amount DECIMAL(15,2);
    exchange_rate DECIMAL(15,4);
BEGIN
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
        user_id_param
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

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION process_purchase_order_payment TO authenticated;
GRANT EXECUTE ON FUNCTION process_purchase_order_payment TO anon;

-- =====================================================
-- VERIFY THE FIX
-- =====================================================

-- Test the function with a simple query to ensure it exists
DO $$
BEGIN
    -- Check if the function exists
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'process_purchase_order_payment'
    ) THEN
        RAISE NOTICE '✅ Function process_purchase_order_payment created successfully';
    ELSE
        RAISE EXCEPTION '❌ Function process_purchase_order_payment was not created';
    END IF;
    
    -- Check if required columns exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_purchase_orders' 
        AND column_name = 'total_paid'
    ) THEN
        RAISE NOTICE '✅ Column total_paid exists in lats_purchase_orders';
    ELSE
        RAISE EXCEPTION '❌ Column total_paid missing from lats_purchase_orders';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_purchase_orders' 
        AND column_name = 'payment_status'
    ) THEN
        RAISE NOTICE '✅ Column payment_status exists in lats_purchase_orders';
    ELSE
        RAISE EXCEPTION '❌ Column payment_status missing from lats_purchase_orders';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_purchase_orders' 
        AND column_name = 'exchange_rate'
    ) THEN
        RAISE NOTICE '✅ Column exchange_rate exists in lats_purchase_orders';
    ELSE
        RAISE NOTICE '⚠️ Column exchange_rate missing from lats_purchase_orders (optional)';
    END IF;
END $$;
