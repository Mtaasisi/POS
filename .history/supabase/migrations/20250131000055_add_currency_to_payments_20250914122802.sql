-- =====================================================
-- ADD CURRENCY SUPPORT TO ALL PAYMENT TABLES
-- =====================================================

-- Add currency column to customer_payments table
ALTER TABLE customer_payments 
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'TZS';

-- Add currency column to purchase_order_payments table  
ALTER TABLE purchase_order_payments 
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'TZS';

-- Add currency column to finance_accounts table if not exists
ALTER TABLE finance_accounts 
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'TZS';

-- Add currency column to payment_methods table
ALTER TABLE payment_methods 
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'TZS';

-- Update existing records to have TZS as default currency
UPDATE customer_payments 
SET currency = 'TZS' 
WHERE currency IS NULL;

UPDATE purchase_order_payments 
SET currency = 'TZS' 
WHERE currency IS NULL;

UPDATE finance_accounts 
SET currency = 'TZS' 
WHERE currency IS NULL;

UPDATE payment_methods 
SET currency = 'TZS' 
WHERE currency IS NULL;

-- Add check constraints for valid currency codes
ALTER TABLE customer_payments 
    ADD CONSTRAINT check_customer_payments_currency 
    CHECK (currency IN ('TZS', 'USD', 'EUR', 'GBP', 'AED', 'KES', 'CNY'));

ALTER TABLE purchase_order_payments 
    ADD CONSTRAINT check_purchase_order_payments_currency 
    CHECK (currency IN ('TZS', 'USD', 'EUR', 'GBP', 'AED', 'KES', 'CNY'));

ALTER TABLE finance_accounts 
    ADD CONSTRAINT check_finance_accounts_currency 
    CHECK (currency IN ('TZS', 'USD', 'EUR', 'GBP', 'AED', 'KES', 'CNY'));

ALTER TABLE payment_methods 
    ADD CONSTRAINT check_payment_methods_currency 
    CHECK (currency IN ('TZS', 'USD', 'EUR', 'GBP', 'AED', 'KES', 'CNY'));

-- Create index for better performance on currency queries
CREATE INDEX IF NOT EXISTS idx_customer_payments_currency ON customer_payments(currency);
CREATE INDEX IF NOT EXISTS idx_purchase_order_payments_currency ON purchase_order_payments(currency);
CREATE INDEX IF NOT EXISTS idx_finance_accounts_currency ON finance_accounts(currency);
CREATE INDEX IF NOT EXISTS idx_payment_methods_currency ON payment_methods(currency);

-- Update the process_purchase_order_payment function to handle currency properly
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

-- Create function to process customer payment with currency support
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
    
    -- Insert payment record
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
        payment_account_id
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
        payment_account_id_param
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
        RAISE EXCEPTION 'Customer payment processing failed: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
