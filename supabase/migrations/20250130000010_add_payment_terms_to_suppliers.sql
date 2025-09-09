-- Migration to add payment_terms column to lats_suppliers table
-- This migration adds the payment_terms field that the Supplier interface expects

-- Add payment_terms column to lats_suppliers table
DO $$ 
BEGIN
    -- Check if the column already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'lats_suppliers' AND column_name = 'payment_terms'
    ) THEN
        ALTER TABLE lats_suppliers ADD COLUMN payment_terms TEXT;
    END IF;
END $$;

-- Add comment to document the new field
COMMENT ON COLUMN lats_suppliers.payment_terms IS 'Default payment terms for this supplier (e.g., Net 30, COD, etc.)';

-- Create index on payment_terms for better query performance
CREATE INDEX IF NOT EXISTS idx_lats_suppliers_payment_terms ON lats_suppliers(payment_terms);

-- Set default payment terms for existing suppliers
UPDATE lats_suppliers SET payment_terms = 'Net 30' WHERE payment_terms IS NULL;
