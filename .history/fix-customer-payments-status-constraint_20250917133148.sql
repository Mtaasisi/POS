-- Fix customer_payments table status constraint and add missing columns
-- This migration fixes the status constraint to allow 'approved' status and adds missing columns

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

-- Drop the existing status constraint to allow 'approved' status
ALTER TABLE customer_payments 
DROP CONSTRAINT IF EXISTS customer_payments_status_check;

-- Add new status constraint that includes 'approved'
ALTER TABLE customer_payments 
ADD CONSTRAINT customer_payments_status_check 
CHECK (status IN ('completed', 'pending', 'failed', 'approved'));

-- Drop existing trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS update_customer_payments_updated_at ON customer_payments;

-- Create the trigger for updating timestamps
CREATE TRIGGER update_customer_payments_updated_at 
    BEFORE UPDATE ON customer_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update existing records to have NULL updated_by (they were created before this column existed)
UPDATE customer_payments 
SET updated_by = NULL 
WHERE updated_by IS NULL;

-- Verify the changes were applied successfully
DO $$
BEGIN
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
  
  -- Check if updated_at column exists
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
  
  -- Check if status constraint allows 'approved'
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'customer_payments_status_check'
    AND check_clause LIKE '%approved%'
  ) THEN
    RAISE NOTICE '✅ Status constraint updated to allow approved status';
  ELSE
    RAISE NOTICE '❌ Status constraint does not allow approved status';
  END IF;
END $$;
