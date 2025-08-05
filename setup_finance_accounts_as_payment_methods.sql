-- Finance Accounts as Payment Methods - SIMPLIFIED VERSION
-- Copy and paste this into your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Finance Accounts Table (used as payment methods)
CREATE TABLE IF NOT EXISTS finance_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('bank', 'cash', 'mobile_money', 'credit_card', 'savings', 'investment', 'other')),
    balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    account_number VARCHAR(100),
    bank_name VARCHAR(255),
    currency VARCHAR(10) DEFAULT 'KES',
    is_active BOOLEAN DEFAULT true,
    is_payment_method BOOLEAN DEFAULT true, -- New field to identify payment methods
    payment_icon VARCHAR(50), -- Icon for payment method display
    payment_color VARCHAR(7) DEFAULT '#3B82F6', -- Color for payment method display
    payment_description TEXT, -- Description for payment method
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Payment Transactions Table (simplified)
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES finance_accounts(id), -- Direct reference to finance account
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

-- 3. Account Balance History Table
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
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_balance_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view finance accounts" ON finance_accounts;
DROP POLICY IF EXISTS "Users can insert finance accounts" ON finance_accounts;
DROP POLICY IF EXISTS "Users can update finance accounts" ON finance_accounts;
DROP POLICY IF EXISTS "Users can delete finance accounts" ON finance_accounts;

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

CREATE POLICY "Users can view payment transactions" ON payment_transactions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert payment transactions" ON payment_transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update payment transactions" ON payment_transactions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete payment transactions" ON payment_transactions FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view account balance history" ON account_balance_history FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert account balance history" ON account_balance_history FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Insert Sample Finance Accounts (as payment methods)
INSERT INTO finance_accounts (name, type, balance, account_number, bank_name, currency, is_payment_method, payment_icon, payment_color, payment_description) VALUES
('Cash Register', 'cash', 50000, NULL, NULL, 'KES', true, 'dollar-sign', '#10B981', 'Physical cash payments'),
('Bank Account', 'bank', 250000, '1234567890', 'Equity Bank', 'KES', true, 'building', '#059669', 'Direct bank transfers'),
('Mobile Money', 'mobile_money', 75000, '254700123456', 'M-Pesa', 'KES', true, 'smartphone', '#DC2626', 'Mobile money payments'),
('Credit Card', 'credit_card', 0, '4111111111111111', 'Visa', 'KES', true, 'credit-card', '#3B82F6', 'Credit card payments'),
('Debit Card', 'credit_card', 0, '5555555555554444', 'Mastercard', 'KES', true, 'credit-card', '#8B5CF6', 'Debit card payments'),
('Savings Account', 'savings', 150000, '9876543210', 'KCB Bank', 'KES', true, 'piggy-bank', '#F59E0B', 'Savings account payments'),
('Investment Account', 'investment', 500000, NULL, 'NSE Portfolio', 'KES', true, 'trending-up', '#10B981', 'Investment account payments'),
('Check Account', 'bank', 100000, '1111111111', 'Cooperative Bank', 'KES', true, 'file-text', '#F97316', 'Check payments'),
('Wire Transfer', 'bank', 200000, '2222222222', 'Stanbic Bank', 'KES', true, 'globe', '#7C3AED', 'International wire transfers'),
('Installment Account', 'bank', 75000, '3333333333', 'Family Bank', 'KES', true, 'calendar', '#8B5CF6', 'Installment payments')
ON CONFLICT DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_finance_accounts_type ON finance_accounts(type);
CREATE INDEX IF NOT EXISTS idx_finance_accounts_active ON finance_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_finance_accounts_payment_method ON finance_accounts(is_payment_method);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_date ON payment_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_account ON payment_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_account_balance_history_account ON account_balance_history(account_id);
CREATE INDEX IF NOT EXISTS idx_account_balance_history_date ON account_balance_history(created_at);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated; 