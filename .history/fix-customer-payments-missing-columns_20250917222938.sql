-- Fix customer_payments table by adding missing columns that are causing 400 errors
-- This migration adds the missing columns that the frontend code is trying to update

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

-- Add updated_by column if it doesn't exist
ALTER TABLE customer_payments 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_payments_currency ON customer_payments(currency);
CREATE INDEX IF NOT EXISTS idx_customer_payments_payment_account_id ON customer_payments(payment_account_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_payment_method_id ON customer_payments(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_reference ON customer_payments(reference);
CREATE INDEX IF NOT EXISTS idx_customer_payments_updated_by ON customer_payments(updated_by);

-- Add check constraint for currency
ALTER TABLE customer_payments 
ADD CONSTRAINT IF NOT EXISTS check_customer_payments_currency 
CHECK (currency IN ('TZS', 'USD', 'EUR', 'GBP', 'AED', 'KES', 'CNY'));

-- Update existing records to have TZS as default currency
UPDATE customer_payments 
SET currency = 'TZS' 
WHERE currency IS NULL;

-- Ensure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS update_customer_payments_updated_at ON customer_payments;

-- Create the trigger for updating timestamps
CREATE TRIGGER update_customer_payments_updated_at 
    BEFORE UPDATE ON customer_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify the columns were added successfully
DO $$
BEGIN
  -- Check if currency column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customer_payments' 
    AND column_name = 'currency'
    AND table_schema = 'public'
  ) THEN
    RAISE NOTICE '✅ currency column added to customer_payments table successfully';
  ELSE
    RAISE NOTICE '❌ Failed to add currency column to customer_payments table';
  END IF;
  
  -- Check if payment_account_id column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customer_payments' 
    AND column_name = 'payment_account_id'
    AND table_schema = 'public'
  ) THEN
    RAISE NOTICE '✅ payment_account_id column added to customer_payments table successfully';
  ELSE
    RAISE NOTICE '❌ Failed to add payment_account_id column to customer_payments table';
  END IF;
  
  -- Check if payment_method_id column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customer_payments' 
    AND column_name = 'payment_method_id'
    AND table_schema = 'public'
  ) THEN
    RAISE NOTICE '✅ payment_method_id column added to customer_payments table successfully';
  ELSE
    RAISE NOTICE '❌ Failed to add payment_method_id column to customer_payments table';
  END IF;
  
  -- Check if reference column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customer_payments' 
    AND column_name = 'reference'
    AND table_schema = 'public'
  ) THEN
    RAISE NOTICE '✅ reference column added to customer_payments table successfully';
  ELSE
    RAISE NOTICE '❌ Failed to add reference column to customer_payments table';
  END IF;
  
  -- Check if notes column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customer_payments' 
    AND column_name = 'notes'
    AND table_schema = 'public'
  ) THEN
    RAISE NOTICE '✅ notes column added to customer_payments table successfully';
  ELSE
    RAISE NOTICE '❌ Failed to add notes column to customer_payments table';
  END IF;
  
  -- Check if updated_by column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customer_payments' 
    AND column_name = 'updated_by'
    AND table_schema = 'public'
  ) THEN
    RAISE NOTICE '✅ updated_by column added to customer_payments table successfully';
  ELSE
    RAISE NOTICE '❌ Failed to add updated_by column to customer_payments table';
  END IF;
END $$;
