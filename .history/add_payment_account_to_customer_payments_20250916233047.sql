-- Add payment_account_id to customer_payments table
-- This migration adds the missing payment_account_id field to link customer payments to finance accounts

-- Add payment_account_id column to customer_payments table
ALTER TABLE customer_payments 
ADD COLUMN IF NOT EXISTS payment_account_id UUID REFERENCES finance_accounts(id);

-- Add currency column if it doesn't exist
ALTER TABLE customer_payments 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'TZS';

-- Add reference and notes columns if they don't exist
ALTER TABLE customer_payments 
ADD COLUMN IF NOT EXISTS reference VARCHAR(255);
ALTER TABLE customer_payments 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for payment_account_id
CREATE INDEX IF NOT EXISTS idx_customer_payments_payment_account_id ON customer_payments(payment_account_id);

-- Create account_transactions table for tracking all account movements
CREATE TABLE IF NOT EXISTS account_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES finance_accounts(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- 'payment_received', 'payment_made', 'expense', 'transfer_in', 'transfer_out'
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TZS',
    description TEXT NOT NULL,
    reference_id UUID, -- Links to customer_payments, purchase_order_payments, etc.
    reference_table VARCHAR(50), -- 'customer_payments', 'purchase_order_payments', 'expenses'
    balance_before DECIMAL(15,2) NOT NULL,
    balance_after DECIMAL(15,2) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for account_transactions
CREATE INDEX IF NOT EXISTS idx_account_transactions_account_id ON account_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_account_transactions_type ON account_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_account_transactions_created_at ON account_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_account_transactions_reference ON account_transactions(reference_id, reference_table);

-- Enable RLS for account_transactions
ALTER TABLE account_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy for account_transactions
CREATE POLICY "Enable all access for authenticated users" ON account_transactions
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON account_transactions TO authenticated;

-- Create function to record account transaction
CREATE OR REPLACE FUNCTION record_account_transaction(
    account_id_param UUID,
    transaction_type_param VARCHAR(50),
    amount_param DECIMAL(15,2),
    description_param TEXT,
    reference_id_param UUID DEFAULT NULL,
    reference_table_param VARCHAR(50) DEFAULT NULL,
    user_id_param UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    current_balance DECIMAL(15,2);
    new_balance DECIMAL(15,2);
BEGIN
    -- Get current balance
    SELECT balance INTO current_balance
    FROM finance_accounts 
    WHERE id = account_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Account % not found', account_id_param;
    END IF;
    
    -- Calculate new balance based on transaction type
    IF transaction_type_param IN ('payment_received', 'transfer_in') THEN
        new_balance := current_balance + amount_param;
    ELSIF transaction_type_param IN ('payment_made', 'expense', 'transfer_out') THEN
        new_balance := current_balance - amount_param;
    ELSE
        RAISE EXCEPTION 'Invalid transaction type: %', transaction_type_param;
    END IF;
    
    -- Insert transaction record
    INSERT INTO account_transactions (
        account_id,
        transaction_type,
        amount,
        description,
        reference_id,
        reference_table,
        balance_before,
        balance_after,
        created_by
    ) VALUES (
        account_id_param,
        transaction_type_param,
        amount_param,
        description_param,
        reference_id_param,
        reference_table_param,
        current_balance,
        new_balance,
        user_id_param
    );
    
    -- Update account balance
    UPDATE finance_accounts 
    SET 
        balance = new_balance,
        updated_at = NOW()
    WHERE id = account_id_param;
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to record account transaction: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Update the process_customer_payment function to use account transactions
CREATE OR REPLACE FUNCTION process_customer_payment(
    customer_id_param UUID,
    amount_param DECIMAL(15,2),
    currency_param VARCHAR(3),
    payment_method_param VARCHAR(100),
    payment_account_id_param UUID,
    user_id_param UUID,
    device_id_param UUID DEFAULT NULL,
    reference_param VARCHAR(255) DEFAULT NULL,
    notes_param TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    payment_id UUID;
BEGIN
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
    ) RETURNING id INTO payment_id;
    
    -- Record account transaction
    PERFORM record_account_transaction(
        payment_account_id_param,
        'payment_received',
        amount_param,
        'Customer payment received',
        payment_id,
        'customer_payments',
        user_id_param
    );
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Payment processing failed: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Update the process_purchase_order_payment function to use account transactions
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
    current_paid DECIMAL(15,2);
    new_paid DECIMAL(15,2);
    payment_status VARCHAR(20);
    converted_amount DECIMAL(15,2);
    payment_id UUID;
BEGIN
    -- Get purchase order details
    SELECT total_amount, total_paid, currency
    INTO order_record
    FROM lats_purchase_orders 
    WHERE id = purchase_order_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Purchase order % not found', purchase_order_id_param;
    END IF;
    
    -- Handle currency conversion if needed
    converted_amount := amount_param;
    IF currency_param != order_record.currency THEN
        converted_amount := amount_param;
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
    ) RETURNING id INTO payment_id;
    
    -- Update purchase order payment status
    UPDATE lats_purchase_orders 
    SET 
        total_paid = new_paid,
        payment_status = payment_status,
        updated_at = NOW()
    WHERE id = purchase_order_id_param;
    
    -- Record account transaction (deduct from account)
    PERFORM record_account_transaction(
        payment_account_id_param,
        'payment_made',
        amount_param,
        'Purchase order payment made',
        payment_id,
        'purchase_order_payments',
        user_id_param
    );
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Payment processing failed: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
