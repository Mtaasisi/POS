-- Migration: Add currency field to suppliers table
-- This migration adds currency support to suppliers

-- =====================================================
-- ADD CURRENCY FIELD TO SUPPLIERS
-- =====================================================

-- Add currency column if it doesn't exist
DO $$
BEGIN
    -- Add currency if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lats_suppliers' AND column_name = 'currency') THEN
        ALTER TABLE lats_suppliers ADD COLUMN currency VARCHAR(3) DEFAULT 'TZS';
    END IF;
END $$;

-- =====================================================
-- ADD INDEXES FOR PERFORMANCE
-- =====================================================

-- Add index for currency queries
CREATE INDEX IF NOT EXISTS idx_suppliers_currency ON lats_suppliers(currency);

-- =====================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN lats_suppliers.currency IS 'Default currency for this supplier (e.g., TZS, USD, AED, EUR)';

-- =====================================================
-- UPDATE EXISTING SUPPLIERS WITH DEFAULT CURRENCY
-- =====================================================

-- Set default currency for existing suppliers
UPDATE lats_suppliers SET currency = 'TZS' WHERE currency IS NULL;
