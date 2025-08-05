-- Payments Accounts Database Setup - SAFE VERSION
-- Copy and paste this into your Supabase SQL Editor
-- This version handles existing tables and policies gracefully

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Finance Accounts Table (Payment Accounts)
CREATE TABLE IF NOT EXISTS finance_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('bank', 'cash', 'mobile_money', 'credit_card', 'savings', 'investment', 'other')),
    balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    account_number VARCHAR(100),
    bank_name VARCHAR(255),
    currency VARCHAR(10) DEFAULT 'KES',
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Payment Methods Table
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('cash', 'card', 'transfer', 'mobile_money', 'check', 'installment', 'delivery')),
    icon VARCHAR(50),
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Payment Method Accounts Mapping Table
CREATE TABLE IF NOT EXISTS payment_method_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_method_id UUID REFERENCES payment_methods(id) ON DELETE CASCADE,
    account_id UUID REFERENCES finance_accounts(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(payment_method_id, account_id)
);

-- 4. Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_method_id UUID REFERENCES payment_methods(id),
    account_id UUID REFERENCES finance_accounts(id),
    amount DECIMAL(15,2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('payment', 'deposit', 'withdrawal', 'transfer', 'refund')),
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    reference_number VARCHAR(100),
    description TEXT,
    customer_id UUID,
    order_id UUID,
    receipt_url TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Account Balance History Table
CREATE TABLE IF NOT EXISTS account_balance_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES finance_accounts(id) ON DELETE CASCADE,
    previous_balance DECIMAL(15,2) NOT NULL,
    new_balance DECIMAL(15,2) NOT NULL,
    change_amount DECIMAL(15,2) NOT NULL,
    change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'adjustment')),
    transaction_id UUID REFERENCES payment_transactions(id),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (only if not already enabled)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'finance_accounts' AND rowsecurity = true) THEN
        ALTER TABLE finance_accounts ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'payment_methods' AND rowsecurity = true) THEN
        ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'payment_method_accounts' AND rowsecurity = true) THEN
        ALTER TABLE payment_method_accounts ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'payment_transactions' AND rowsecurity = true) THEN
        ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'account_balance_history' AND rowsecurity = true) THEN
        ALTER TABLE account_balance_history ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Drop existing policies if they exist (to avoid conflicts)
DO $$
BEGIN
    -- Drop finance_accounts policies
    DROP POLICY IF EXISTS "Users can view finance accounts" ON finance_accounts;
    DROP POLICY IF EXISTS "Users can insert finance accounts" ON finance_accounts;
    DROP POLICY IF EXISTS "Users can update finance accounts" ON finance_accounts;
    DROP POLICY IF EXISTS "Users can delete finance accounts" ON finance_accounts;
    
    -- Drop payment_methods policies
    DROP POLICY IF EXISTS "Users can view payment methods" ON payment_methods;
    DROP POLICY IF EXISTS "Users can insert payment methods" ON payment_methods;
    DROP POLICY IF EXISTS "Users can update payment methods" ON payment_methods;
    DROP POLICY IF EXISTS "Users can delete payment methods" ON payment_methods;
    
    -- Drop payment_method_accounts policies
    DROP POLICY IF EXISTS "Users can view payment method accounts" ON payment_method_accounts;
    DROP POLICY IF EXISTS "Users can insert payment method accounts" ON payment_method_accounts;
    DROP POLICY IF EXISTS "Users can update payment method accounts" ON payment_method_accounts;
    DROP POLICY IF EXISTS "Users can delete payment method accounts" ON payment_method_accounts;
    
    -- Drop payment_transactions policies
    DROP POLICY IF EXISTS "Users can view payment transactions" ON payment_transactions;
    DROP POLICY IF EXISTS "Users can insert payment transactions" ON payment_transactions;
    DROP POLICY IF EXISTS "Users can update payment transactions" ON payment_transactions;
    DROP POLICY IF EXISTS "Users can delete payment transactions" ON payment_transactions;
    
    -- Drop account_balance_history policies
    DROP POLICY IF EXISTS "Users can view account balance history" ON account_balance_history;
    DROP POLICY IF EXISTS "Users can insert account balance history" ON account_balance_history;
END $$;

-- RLS Policies for finance_accounts
CREATE POLICY "Users can view finance accounts" ON finance_accounts
    FOR SELECT USING (true);

CREATE POLICY "Users can insert finance accounts" ON finance_accounts
    FOR INSERT WITH CHECK (auth.uid() = created_by OR auth.uid() IN (
        SELECT user_id FROM user_goals WHERE role = 'admin'
    ));

CREATE POLICY "Users can update finance accounts" ON finance_accounts
    FOR UPDATE USING (auth.uid() = created_by OR auth.uid() IN (
        SELECT user_id FROM user_goals WHERE role = 'admin'
    ));

CREATE POLICY "Users can delete finance accounts" ON finance_accounts
    FOR DELETE USING (auth.uid() = created_by OR auth.uid() IN (
        SELECT user_id FROM user_goals WHERE role = 'admin'
    ));

-- RLS Policies for payment_methods
CREATE POLICY "Users can view payment methods" ON payment_methods
    FOR SELECT USING (true);

CREATE POLICY "Users can insert payment methods" ON payment_methods
    FOR INSERT WITH CHECK (auth.uid() IN (
        SELECT user_id FROM user_goals WHERE role = 'admin'
    ));

CREATE POLICY "Users can update payment methods" ON payment_methods
    FOR UPDATE USING (auth.uid() IN (
        SELECT user_id FROM user_goals WHERE role = 'admin'
    ));

CREATE POLICY "Users can delete payment methods" ON payment_methods
    FOR DELETE USING (auth.uid() IN (
        SELECT user_id FROM user_goals WHERE role = 'admin'
    ));

-- RLS Policies for payment_method_accounts
CREATE POLICY "Users can view payment method accounts" ON payment_method_accounts
    FOR SELECT USING (true);

CREATE POLICY "Users can insert payment method accounts" ON payment_method_accounts
    FOR INSERT WITH CHECK (auth.uid() IN (
        SELECT user_id FROM user_goals WHERE role = 'admin'
    ));

CREATE POLICY "Users can update payment method accounts" ON payment_method_accounts
    FOR UPDATE USING (auth.uid() IN (
        SELECT user_id FROM user_goals WHERE role = 'admin'
    ));

CREATE POLICY "Users can delete payment method accounts" ON payment_method_accounts
    FOR DELETE USING (auth.uid() IN (
        SELECT user_id FROM user_goals WHERE role = 'admin'
    ));

-- RLS Policies for payment_transactions
CREATE POLICY "Users can view payment transactions" ON payment_transactions
    FOR SELECT USING (true);

CREATE POLICY "Users can insert payment transactions" ON payment_transactions
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update payment transactions" ON payment_transactions
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete payment transactions" ON payment_transactions
    FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for account_balance_history
CREATE POLICY "Users can view account balance history" ON account_balance_history
    FOR SELECT USING (true);

CREATE POLICY "Users can insert account balance history" ON account_balance_history
    FOR INSERT WITH CHECK (auth.uid() IN (
        SELECT user_id FROM user_goals WHERE role = 'admin'
    ));

-- Insert Default Payment Methods (only if they don't exist)
INSERT INTO payment_methods (name, code, type, icon, color, description) VALUES
-- Cash Methods
('Cash', 'cash', 'cash', 'dollar-sign', '#10B981', 'Physical cash payments'),
('Cash on Delivery', 'cash_on_delivery', 'cash', 'truck', '#F59E0B', 'Cash payment upon delivery'),

-- Card Methods
('Credit Card', 'credit_card', 'card', 'credit-card', '#3B82F6', 'Credit card payments'),
('Debit Card', 'debit_card', 'card', 'credit-card', '#8B5CF6', 'Debit card payments'),
('Card Payment', 'card', 'card', 'credit-card', '#6366F1', 'Generic card payment'),

-- Transfer Methods
('Bank Transfer', 'bank_transfer', 'transfer', 'building', '#059669', 'Direct bank transfers'),
('Mobile Money', 'mobile_money', 'mobile_money', 'smartphone', '#DC2626', 'Mobile money payments'),
('Wire Transfer', 'wire_transfer', 'transfer', 'globe', '#7C3AED', 'International wire transfers'),

-- Check Methods
('Check', 'check', 'check', 'file-text', '#F97316', 'Check payments'),
('Postdated Check', 'postdated_check', 'check', 'calendar', '#EF4444', 'Postdated check payments'),

-- Installment Methods
('Installment Payment', 'installment', 'installment', 'calendar', '#8B5CF6', 'Payment in installments'),
('Monthly Installment', 'monthly_installment', 'installment', 'calendar', '#EC4899', 'Monthly installment payments'),

-- Delivery Methods
('Payment on Delivery', 'payment_on_delivery', 'delivery', 'truck', '#F59E0B', 'Payment upon delivery'),
('Pickup Payment', 'pickup_payment', 'delivery', 'package', '#10B981', 'Payment upon pickup')
ON CONFLICT (code) DO NOTHING;

-- Insert Sample Finance Accounts (only if they don't exist)
INSERT INTO finance_accounts (name, type, balance, account_number, bank_name, currency, is_active) VALUES
('Main Cash Register', 'cash', 50000, NULL, NULL, 'KES', true),
('Business Bank Account', 'bank', 250000, '1234567890', 'Equity Bank', 'KES', true),
('Mobile Money Account', 'mobile_money', 75000, '254700123456', 'M-Pesa', 'KES', true),
('Savings Account', 'savings', 150000, '9876543210', 'KCB Bank', 'KES', true),
('Credit Card Account', 'credit_card', 0, '4111111111111111', 'Visa', 'KES', true),
('Investment Account', 'investment', 500000, NULL, 'NSE Portfolio', 'KES', true)
ON CONFLICT DO NOTHING;

-- Link Payment Methods to Accounts (only if they don't exist)
INSERT INTO payment_method_accounts (payment_method_id, account_id, is_default) 
SELECT 
    pm.id as payment_method_id,
    fa.id as account_id,
    CASE 
        WHEN pm.code = 'cash' THEN true
        WHEN pm.code = 'credit_card' THEN true
        WHEN pm.code = 'mobile_money' THEN true
        WHEN pm.code = 'bank_transfer' THEN true
        ELSE false
    END as is_default
FROM payment_methods pm
CROSS JOIN finance_accounts fa
WHERE 
    (pm.code = 'cash' AND fa.type = 'cash') OR
    (pm.code = 'credit_card' AND fa.type = 'credit_card') OR
    (pm.code = 'mobile_money' AND fa.type = 'mobile_money') OR
    (pm.code = 'bank_transfer' AND fa.type = 'bank')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_finance_accounts_type ON finance_accounts(type);
CREATE INDEX IF NOT EXISTS idx_finance_accounts_active ON finance_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_methods_code ON payment_methods(code);
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_date ON payment_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_method ON payment_transactions(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_account ON payment_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_account_balance_history_account ON account_balance_history(account_id);
CREATE INDEX IF NOT EXISTS idx_account_balance_history_date ON account_balance_history(created_at);

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS update_account_balance(UUID, DECIMAL, VARCHAR, UUID, TEXT);
DROP FUNCTION IF EXISTS get_payment_method_by_code(VARCHAR);
DROP FUNCTION IF EXISTS get_default_account_for_payment_method(UUID);
DROP FUNCTION IF EXISTS trigger_update_account_balance();

-- Create function to update account balance
CREATE OR REPLACE FUNCTION update_account_balance(
    p_account_id UUID,
    p_amount DECIMAL(15,2),
    p_change_type VARCHAR(50),
    p_transaction_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_previous_balance DECIMAL(15,2);
    v_new_balance DECIMAL(15,2);
BEGIN
    -- Get current balance
    SELECT balance INTO v_previous_balance
    FROM finance_accounts
    WHERE id = p_account_id;
    
    -- Calculate new balance
    CASE p_change_type
        WHEN 'deposit', 'transfer_in' THEN
            v_new_balance := v_previous_balance + p_amount;
        WHEN 'withdrawal', 'transfer_out' THEN
            v_new_balance := v_previous_balance - p_amount;
        WHEN 'adjustment' THEN
            v_new_balance := p_amount;
        ELSE
            RAISE EXCEPTION 'Invalid change type: %', p_change_type;
    END CASE;
    
    -- Update account balance
    UPDATE finance_accounts
    SET balance = v_new_balance, updated_at = NOW()
    WHERE id = p_account_id;
    
    -- Record balance history
    INSERT INTO account_balance_history (
        account_id,
        previous_balance,
        new_balance,
        change_amount,
        change_type,
        transaction_id,
        description
    ) VALUES (
        p_account_id,
        v_previous_balance,
        v_new_balance,
        p_amount,
        p_change_type,
        p_transaction_id,
        p_description
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to get payment method by code
CREATE OR REPLACE FUNCTION get_payment_method_by_code(payment_code VARCHAR(50))
RETURNS UUID AS $$
DECLARE
    method_id UUID;
BEGIN
    SELECT id INTO method_id 
    FROM payment_methods 
    WHERE code = payment_code AND is_active = true;
    
    RETURN method_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get default account for payment method
CREATE OR REPLACE FUNCTION get_default_account_for_payment_method(payment_method_id UUID)
RETURNS UUID AS $$
DECLARE
    account_id UUID;
BEGIN
    SELECT pma.account_id INTO account_id
    FROM payment_method_accounts pma
    WHERE pma.payment_method_id = payment_method_id 
    AND pma.is_default = true
    LIMIT 1;
    
    RETURN account_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update account balance when transactions are inserted
CREATE OR REPLACE FUNCTION trigger_update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update account balance based on transaction
    PERFORM update_account_balance(
        NEW.account_id,
        NEW.amount,
        CASE 
            WHEN NEW.transaction_type = 'payment' THEN 'withdrawal'
            WHEN NEW.transaction_type = 'deposit' THEN 'deposit'
            WHEN NEW.transaction_type = 'withdrawal' THEN 'withdrawal'
            WHEN NEW.transaction_type = 'transfer' THEN 'withdrawal'
            WHEN NEW.transaction_type = 'refund' THEN 'deposit'
            ELSE 'adjustment'
        END,
        NEW.id,
        NEW.description
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_payment_transaction_balance ON payment_transactions;

-- Create trigger
CREATE TRIGGER trigger_payment_transaction_balance
    AFTER INSERT ON payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_account_balance();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated; 