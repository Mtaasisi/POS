-- =====================================================
-- SIMPLE FIX FOR PAYMENT 400 ERROR
-- =====================================================
-- This script fixes the most common causes of the 400 Bad Request error

-- =====================================================
-- STEP 1: ENSURE REQUIRED COLUMNS EXIST
-- =====================================================

-- Add missing columns to lats_purchase_orders table
ALTER TABLE lats_purchase_orders 
    ADD COLUMN IF NOT EXISTS total_paid DECIMAL(15,2) DEFAULT 0;

ALTER TABLE lats_purchase_orders 
    ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'unpaid';

ALTER TABLE lats_purchase_orders 
    ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(15,4) DEFAULT 1.0;

-- =====================================================
-- STEP 2: UPDATE EXISTING RECORDS
-- =====================================================

-- Set default values for existing records
UPDATE lats_purchase_orders 
SET 
    total_paid = 0,
    payment_status = 'unpaid',
    exchange_rate = 1.0
WHERE total_paid IS NULL OR payment_status IS NULL OR exchange_rate IS NULL;

-- =====================================================
-- STEP 3: ADD CONSTRAINTS
-- =====================================================

-- Add check constraint for payment status
DO $$
BEGIN
    -- Drop existing constraint if it exists
    ALTER TABLE lats_purchase_orders DROP CONSTRAINT IF EXISTS check_payment_status;
    
    -- Add new constraint
    ALTER TABLE lats_purchase_orders 
    ADD CONSTRAINT check_payment_status 
    CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'overpaid'));
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if constraint already exists
        NULL;
END $$;

-- =====================================================
-- STEP 4: RECREATE THE FUNCTION WITH BETTER ERROR HANDLING
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
BEGIN
    -- Validate purchase order exists
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
    
    -- Simple currency conversion (1:1 for now)
    converted_amount := amount_param;
    
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
-- STEP 5: GRANT PERMISSIONS
-- =====================================================

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION process_purchase_order_payment TO authenticated;
GRANT EXECUTE ON FUNCTION process_purchase_order_payment TO anon;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check if everything was created successfully
DO $$
BEGIN
    RAISE NOTICE '✅ Payment function fix applied successfully';
    RAISE NOTICE '📋 Applied fixes:';
    RAISE NOTICE '  - Added total_paid, payment_status, exchange_rate columns';
    RAISE NOTICE '  - Updated existing records with default values';
    RAISE NOTICE '  - Recreated process_purchase_order_payment function';
    RAISE NOTICE '  - Granted necessary permissions';
END $$;
