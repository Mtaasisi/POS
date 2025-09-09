-- Create finance_accounts table for payment methods (Safe Version)
-- Migration: 20250128000003_create_finance_accounts_safe.sql

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_finance_accounts_updated_at ON finance_accounts;

-- Create finance accounts table (used for payment methods)
CREATE TABLE IF NOT EXISTS finance_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'bank', 'cash', 'mobile_money', 'credit_card', 'savings', 'investment', 'other'
    balance DECIMAL(15,2) DEFAULT 0,
    account_number VARCHAR(255),
    bank_name VARCHAR(255),
    currency VARCHAR(3) DEFAULT 'TZS',
    is_active BOOLEAN DEFAULT true,
    is_payment_method BOOLEAN DEFAULT false,
    payment_icon VARCHAR(10),
    payment_color VARCHAR(7),
    payment_description TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
ALTER TABLE finance_accounts ADD COLUMN IF NOT EXISTS requires_reference BOOLEAN DEFAULT false;
ALTER TABLE finance_accounts ADD COLUMN IF NOT EXISTS requires_account_number BOOLEAN DEFAULT false;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_finance_accounts_type ON finance_accounts(type);
CREATE INDEX IF NOT EXISTS idx_finance_accounts_is_active ON finance_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_finance_accounts_is_payment_method ON finance_accounts(is_payment_method);
CREATE INDEX IF NOT EXISTS idx_finance_accounts_created_at ON finance_accounts(created_at);

-- Create function to update updated_at timestamp (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_finance_accounts_updated_at
    BEFORE UPDATE ON finance_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE finance_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can manage finance accounts" ON finance_accounts;
DROP POLICY IF EXISTS "Authenticated users can view active finance accounts" ON finance_accounts;

-- Admin can manage all finance accounts
CREATE POLICY "Admin can manage finance accounts" ON finance_accounts
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Authenticated users can view active finance accounts
CREATE POLICY "Authenticated users can view active finance accounts" ON finance_accounts
    FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- Clear existing data and insert default payment methods (matching POS payment methods)
DELETE FROM finance_accounts WHERE id IN (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440006'
);

INSERT INTO finance_accounts (id, name, type, balance, currency, is_active, is_payment_method, payment_icon, payment_color, payment_description, requires_reference, requires_account_number, notes) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Cash', 'cash', 0, 'TZS', true, true, '💵', '#10B981', 'Cash payments at point of sale', false, false, 'Default cash payment method for POS'),
('550e8400-e29b-41d4-a716-446655440002', 'Card', 'credit_card', 0, 'TZS', true, true, '💳', '#3B82F6', 'Credit/Debit card payments', true, false, 'Card payment processing'),
('550e8400-e29b-41d4-a716-446655440003', 'ZenoPay', 'mobile_money', 0, 'TZS', true, true, '📱', '#8B5CF6', 'ZenoPay mobile money payments', false, false, 'ZenoPay mobile money integration'),
('550e8400-e29b-41d4-a716-446655440004', 'M-Pesa', 'mobile_money', 0, 'TZS', true, true, '📱', '#059669', 'M-Pesa mobile money payments', true, false, 'M-Pesa mobile money integration'),
('550e8400-e29b-41d4-a716-446655440005', 'Airtel Money', 'mobile_money', 0, 'TZS', true, true, '📱', '#DC2626', 'Airtel Money mobile payments', true, false, 'Airtel Money mobile money integration'),
('550e8400-e29b-41d4-a716-446655440006', 'Bank Transfer', 'bank', 0, 'TZS', true, true, '🏦', '#7C3AED', 'Direct bank transfer payments', true, true, 'Bank transfer payment method');
