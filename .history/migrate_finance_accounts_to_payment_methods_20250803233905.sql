-- Migration: Add payment method columns to finance_accounts table
-- Run this in your Supabase SQL Editor

-- Add new columns to finance_accounts table
ALTER TABLE finance_accounts 
ADD COLUMN IF NOT EXISTS is_payment_method BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS payment_icon VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_color VARCHAR(7) DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS payment_description TEXT;

-- Update existing accounts to have payment method properties based on their type
UPDATE finance_accounts 
SET 
    is_payment_method = true,
    payment_icon = CASE 
        WHEN type = 'cash' THEN 'dollar-sign'
        WHEN type = 'bank' THEN 'building'
        WHEN type = 'mobile_money' THEN 'smartphone'
        WHEN type = 'credit_card' THEN 'credit-card'
        WHEN type = 'savings' THEN 'piggy-bank'
        WHEN type = 'investment' THEN 'trending-up'
        ELSE 'credit-card'
    END,
    payment_color = CASE 
        WHEN type = 'cash' THEN '#10B981'
        WHEN type = 'bank' THEN '#059669'
        WHEN type = 'mobile_money' THEN '#DC2626'
        WHEN type = 'credit_card' THEN '#3B82F6'
        WHEN type = 'savings' THEN '#F59E0B'
        WHEN type = 'investment' THEN '#10B981'
        ELSE '#3B82F6'
    END,
    payment_description = CASE 
        WHEN type = 'cash' THEN 'Physical cash payments'
        WHEN type = 'bank' THEN 'Bank account payments'
        WHEN type = 'mobile_money' THEN 'Mobile money payments'
        WHEN type = 'credit_card' THEN 'Credit card payments'
        WHEN type = 'savings' THEN 'Savings account payments'
        WHEN type = 'investment' THEN 'Investment account payments'
        ELSE 'Account payments'
    END;

-- Create index for payment method filtering
CREATE INDEX IF NOT EXISTS idx_finance_accounts_payment_method ON finance_accounts(is_payment_method);

-- Update payment_transactions table to remove payment_method_id column if it exists
-- (This is optional - only run if you want to simplify the transactions table)
-- ALTER TABLE payment_transactions DROP COLUMN IF EXISTS payment_method_id; 