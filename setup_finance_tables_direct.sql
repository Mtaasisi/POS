-- Finance Tables Setup - Copy and paste this into your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Finance Accounts Table
CREATE TABLE IF NOT EXISTS finance_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('bank', 'cash', 'mobile_money', 'credit_card', 'savings', 'investment')),
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

-- 2. Finance Expense Categories Table
CREATE TABLE IF NOT EXISTS finance_expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50),
    budget_limit DECIMAL(15,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Finance Expenses Table
CREATE TABLE IF NOT EXISTS finance_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    category VARCHAR(255),
    expense_date DATE NOT NULL,
    payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'card', 'transfer', 'mobile_money', 'check')),
    status VARCHAR(50) DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'cancelled')),
    receipt_url TEXT,
    account_id UUID REFERENCES finance_accounts(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Finance Transfers Table
CREATE TABLE IF NOT EXISTS finance_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_account_id UUID NOT NULL REFERENCES finance_accounts(id),
    to_account_id UUID NOT NULL REFERENCES finance_accounts(id),
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    transfer_date DATE NOT NULL,
    reference_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE finance_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transfers ENABLE ROW LEVEL SECURITY;

-- Insert default expense categories
INSERT INTO finance_expense_categories (name, color, icon, budget_limit) VALUES
('Office Supplies', '#3B82F6', 'briefcase', 5000),
('Utilities', '#10B981', 'zap', 15000),
('Rent', '#F59E0B', 'home', 50000),
('Transportation', '#EF4444', 'truck', 8000),
('Marketing', '#8B5CF6', 'megaphone', 20000),
('Equipment', '#06B6D4', 'settings', 30000),
('Insurance', '#84CC16', 'shield', 12000),
('Maintenance', '#F97316', 'wrench', 10000),
('Software', '#EC4899', 'monitor', 15000),
('Miscellaneous', '#6B7280', 'more-horizontal', 5000)
ON CONFLICT DO NOTHING;

-- Insert a default cash account
INSERT INTO finance_accounts (name, type, balance, currency) VALUES
('Cash Account', 'cash', 0, 'KES')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_finance_expenses_date ON finance_expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_finance_expenses_category ON finance_expenses(category);
CREATE INDEX IF NOT EXISTS idx_finance_transfers_date ON finance_transfers(transfer_date);
CREATE INDEX IF NOT EXISTS idx_finance_accounts_type ON finance_accounts(type); 