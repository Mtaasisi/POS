-- Fix customer_payments table by adding missing updated_by column
-- This migration adds the updated_by column that is referenced in the updatePaymentStatus function

-- Add updated_by column to customer_payments table
ALTER TABLE customer_payments 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Create index for updated_by column for better performance
CREATE INDEX IF NOT EXISTS idx_customer_payments_updated_by ON customer_payments(updated_by);

-- Update existing records to have NULL updated_by (they were created before this column existed)
-- This is already the default behavior, but being explicit
UPDATE customer_payments 
SET updated_by = NULL 
WHERE updated_by IS NULL;

-- Verify the column was added successfully
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
END $$;
