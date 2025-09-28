-- Fix customer_payments table by adding missing columns and fixing trigger
-- This migration adds the updated_by column and ensures updated_at column exists

-- First, ensure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at column if it doesn't exist
ALTER TABLE customer_payments 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add updated_by column to customer_payments table
ALTER TABLE customer_payments 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Create index for updated_by column for better performance
CREATE INDEX IF NOT EXISTS idx_customer_payments_updated_by ON customer_payments(updated_by);

-- Drop existing trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS update_customer_payments_updated_at ON customer_payments;

-- Create the trigger for updating timestamps
CREATE TRIGGER update_customer_payments_updated_at 
    BEFORE UPDATE ON customer_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update existing records to have NULL updated_by (they were created before this column existed)
-- This is already the default behavior, but being explicit
UPDATE customer_payments 
SET updated_by = NULL 
WHERE updated_by IS NULL;

-- Verify the columns were added successfully
DO $$
BEGIN
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
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customer_payments' 
    AND column_name = 'updated_at'
    AND table_schema = 'public'
  ) THEN
    RAISE NOTICE '✅ updated_at column exists in customer_payments table';
  ELSE
    RAISE NOTICE '❌ updated_at column missing from customer_payments table';
  END IF;
END $$;
