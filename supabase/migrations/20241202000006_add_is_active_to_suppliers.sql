-- Migration to add is_active column to lats_suppliers table
-- This migration adds the is_active column that the getActiveSuppliers function expects

-- Add is_active column to lats_suppliers table
ALTER TABLE lats_suppliers 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add comment to document the new field
COMMENT ON COLUMN lats_suppliers.is_active IS 'Whether the supplier is active and can be used for new orders';

-- Create index on is_active for better query performance
CREATE INDEX IF NOT EXISTS idx_lats_suppliers_is_active ON lats_suppliers(is_active);

-- Update existing suppliers to be active by default
UPDATE lats_suppliers SET is_active = true WHERE is_active IS NULL;
