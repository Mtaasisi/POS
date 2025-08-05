-- Payments Accounts Database Setup - MINIMAL VERSION
-- Copy and paste this into your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Finance Accounts Table
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

-- Enable Row Level Security
ALTER TABLE finance_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_method_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_balance_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view finance accounts" ON finance_accounts;
DROP POLICY IF EXISTS "Users can insert finance accounts" ON finance_accounts;
DROP POLICY IF EXISTS "Users can update finance accounts" ON finance_accounts;
DROP POLICY IF EXISTS "Users can delete finance accounts" ON finance_accounts;

DROP POLICY IF EXISTS "Users can view payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can insert payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can update payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can delete payment methods" ON payment_methods;

DROP POLICY IF EXISTS "Users can view payment method accounts" ON payment_method_accounts;
DROP POLICY IF EXISTS "Users can insert payment method accounts" ON payment_method_accounts;
DROP POLICY IF EXISTS "Users can update payment method accounts" ON payment_method_accounts;
DROP POLICY IF EXISTS "Users can delete payment method accounts" ON payment_method_accounts;

DROP POLICY IF EXISTS "Users can view payment transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Users can insert payment transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Users can update payment transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Users can delete payment transactions" ON payment_transactions;

DROP POLICY IF EXISTS "Users can view account balance history" ON account_balance_history;
DROP POLICY IF EXISTS "Users can insert account balance history" ON account_balance_history;

-- Create RLS Policies
CREATE POLICY "Users can view finance accounts" ON finance_accounts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert finance accounts" ON finance_accounts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update finance accounts" ON finance_accounts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete finance accounts" ON finance_accounts FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view payment methods" ON payment_methods FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert payment methods" ON payment_methods FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update payment methods" ON payment_methods FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete payment methods" ON payment_methods FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view payment method accounts" ON payment_method_accounts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert payment method accounts" ON payment_method_accounts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update payment method accounts" ON payment_method_accounts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete payment method accounts" ON payment_method_accounts FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view payment transactions" ON payment_transactions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert payment transactions" ON payment_transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update payment transactions" ON payment_transactions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete payment transactions" ON payment_transactions FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view account balance history" ON account_balance_history FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert account balance history" ON account_balance_history FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Insert Default Payment Methods
INSERT INTO payment_methods (name, code, type, icon, color, description) VALUES
('Cash', 'cash', 'cash', 'dollar-sign', '#10B981', 'Physical cash payments'),
('Cash on Delivery', 'cash_on_delivery', 'cash', 'truck', '#F59E0B', 'Cash payment upon delivery'),
('Credit Card', 'credit_card', 'card', 'credit-card', '#3B82F6', 'Credit card payments'),
('Debit Card', 'debit_card', 'card', 'credit-card', '#8B5CF6', 'Debit card payments'),
('Card Payment', 'card', 'card', 'credit-card', '#6366F1', 'Generic card payment'),
('Bank Transfer', 'bank_transfer', 'transfer', 'building', '#059669', 'Direct bank transfers'),
('Mobile Money', 'mobile_money', 'mobile_money', 'smartphone', '#DC2626', 'Mobile money payments'),
('Wire Transfer', 'wire_transfer', 'transfer', 'globe', '#7C3AED', 'International wire transfers'),
('Check', 'check', 'check', 'file-text', '#F97316', 'Check payments'),
('Postdated Check', 'postdated_check', 'check', 'calendar', '#EF4444', 'Postdated check payments'),
('Installment Payment', 'installment', 'installment', 'calendar', '#8B5CF6', 'Payment in installments'),
('Monthly Installment', 'monthly_installment', 'installment', 'calendar', '#EC4899', 'Monthly installment payments'),
('Payment on Delivery', 'payment_on_delivery', 'delivery', 'truck', '#F59E0B', 'Payment upon delivery'),
('Pickup Payment', 'pickup_payment', 'delivery', 'package', '#10B981', 'Payment upon pickup')
ON CONFLICT (code) DO NOTHING;

-- Insert Sample Finance Accounts
INSERT INTO finance_accounts (name, type, balance, account_number, bank_name, currency, is_active) VALUES
('Main Cash Register', 'cash', 50000, NULL, NULL, 'KES', true),
('Business Bank Account', 'bank', 250000, '1234567890', 'Equity Bank', 'KES', true),
('Mobile Money Account', 'mobile_money', 75000, '254700123456', 'M-Pesa', 'KES', true),
('Savings Account', 'savings', 150000, '9876543210', 'KCB Bank', 'KES', true),
('Credit Card Account', 'credit_card', 0, '4111111111111111', 'Visa', 'KES', true),
('Investment Account', 'investment', 500000, NULL, 'NSE Portfolio', 'KES', true)
ON CONFLICT DO NOTHING;

-- Link Payment Methods to Accounts
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_finance_accounts_type ON finance_accounts(type);
CREATE INDEX IF NOT EXISTS idx_finance_accounts_active ON finance_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_methods_code ON payment_methods(code);
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_date ON payment_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_method ON payment_transactions(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_account ON payment_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_account_balance_history_account ON account_balance_history(account_id);
CREATE INDEX IF NOT EXISTS idx_account_balance_history_date ON account_balance_history(created_at);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated; 