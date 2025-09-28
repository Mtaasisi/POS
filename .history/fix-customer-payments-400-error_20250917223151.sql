-- Fix customer_payments 400 error by adding missing columns
-- Run this in your Supabase SQL Editor

-- Add missing columns to customer_payments table
ALTER TABLE customer_payments 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'TZS';

ALTER TABLE customer_payments 
ADD COLUMN IF NOT EXISTS payment_account_id UUID REFERENCES finance_accounts(id);

ALTER TABLE customer_payments 
ADD COLUMN IF NOT EXISTS payment_method_id UUID;

ALTER TABLE customer_payments 
ADD COLUMN IF NOT EXISTS reference VARCHAR(255);

ALTER TABLE customer_payments 
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE customer_payments 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_payments_currency ON customer_payments(currency);
CREATE INDEX IF NOT EXISTS idx_customer_payments_payment_account_id ON customer_payments(payment_account_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_payment_method_id ON customer_payments(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_reference ON customer_payments(reference);
CREATE INDEX IF NOT EXISTS idx_customer_payments_updated_by ON customer_payments(updated_by);

-- Add check constraint for currency (drop first if exists)
ALTER TABLE customer_payments 
DROP CONSTRAINT IF EXISTS check_customer_payments_currency;

ALTER TABLE customer_payments 
ADD CONSTRAINT check_customer_payments_currency 
CHECK (currency IN ('TZS', 'USD', 'EUR', 'GBP', 'AED', 'KES', 'CNY'));

-- Update existing records to have TZS as default currency
UPDATE customer_payments 
SET currency = 'TZS' 
WHERE currency IS NULL;

-- Verify the columns were added successfully
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'customer_payments' 
  AND table_schema = 'public'
  AND column_name IN ('currency', 'payment_account_id', 'payment_method_id', 'reference', 'notes', 'updated_by')
ORDER BY column_name;
