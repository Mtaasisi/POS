-- Migration: Add currency field to purchase orders table
-- This migration adds currency support to purchase orders

-- =====================================================
-- ADD CURRENCY FIELD TO PURCHASE ORDERS
-- =====================================================

-- Add currency column if it doesn't exist
DO $$
BEGIN
    -- Add currency if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lats_purchase_orders' AND column_name = 'currency') THEN
        ALTER TABLE lats_purchase_orders ADD COLUMN currency VARCHAR(3) DEFAULT 'TZS';
    END IF;
    
    -- Add payment_terms if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lats_purchase_orders' AND column_name = 'payment_terms') THEN
        ALTER TABLE lats_purchase_orders ADD COLUMN payment_terms TEXT;
    END IF;
END $$;

-- =====================================================
-- ADD INDEXES FOR PERFORMANCE
-- =====================================================

-- Add index for currency queries
CREATE INDEX IF NOT EXISTS idx_purchase_orders_currency ON lats_purchase_orders(currency);

-- =====================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN lats_purchase_orders.currency IS 'Currency code for the purchase order (e.g., TZS, USD, EUR)';
COMMENT ON COLUMN lats_purchase_orders.payment_terms IS 'Payment terms for the purchase order (e.g., Net 30, COD, etc.)';
