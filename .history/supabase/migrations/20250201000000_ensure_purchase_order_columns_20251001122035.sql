-- Ensure all necessary columns exist in lats_purchase_orders table
-- This migration adds any missing columns that might be causing the 400 Bad Request error

-- =====================================================
-- ENSURE BASE COLUMNS EXIST
-- =====================================================

-- Add currency column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lats_purchase_orders' AND column_name = 'currency') THEN
        ALTER TABLE lats_purchase_orders ADD COLUMN currency VARCHAR(3) DEFAULT 'TZS';
        RAISE NOTICE 'Added currency column';
    END IF;
END $$;

-- Add payment_terms column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lats_purchase_orders' AND column_name = 'payment_terms') THEN
        ALTER TABLE lats_purchase_orders ADD COLUMN payment_terms TEXT;
        RAISE NOTICE 'Added payment_terms column';
    END IF;
END $$;

-- Add exchange_rate column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lats_purchase_orders' AND column_name = 'exchange_rate') THEN
        ALTER TABLE lats_purchase_orders ADD COLUMN exchange_rate DECIMAL(10,6) DEFAULT 1.0;
        RAISE NOTICE 'Added exchange_rate column';
    END IF;
END $$;

-- Add base_currency column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lats_purchase_orders' AND column_name = 'base_currency') THEN
        ALTER TABLE lats_purchase_orders ADD COLUMN base_currency TEXT DEFAULT 'TZS';
        RAISE NOTICE 'Added base_currency column';
    END IF;
END $$;

-- Add exchange_rate_source column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lats_purchase_orders' AND column_name = 'exchange_rate_source') THEN
        ALTER TABLE lats_purchase_orders ADD COLUMN exchange_rate_source TEXT;
        RAISE NOTICE 'Added exchange_rate_source column';
    END IF;
END $$;

-- Add exchange_rate_date column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'lats_purchase_orders' AND column_name = 'exchange_rate_date') THEN
        ALTER TABLE lats_purchase_orders ADD COLUMN exchange_rate_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added exchange_rate_date column';
    END IF;
END $$;

-- =====================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN lats_purchase_orders.currency IS 'Currency code for the purchase order (e.g., TZS, USD, EUR)';
COMMENT ON COLUMN lats_purchase_orders.payment_terms IS 'Payment terms for the purchase order (e.g., Net 30, COD, etc.)';
COMMENT ON COLUMN lats_purchase_orders.exchange_rate IS 'Exchange rate from purchase currency to base currency at time of purchase';
COMMENT ON COLUMN lats_purchase_orders.base_currency IS 'Base currency for the business (typically TZS)';
COMMENT ON COLUMN lats_purchase_orders.exchange_rate_source IS 'Source of the exchange rate (manual, api, bank, etc.)';
COMMENT ON COLUMN lats_purchase_orders.exchange_rate_date IS 'Date when the exchange rate was applied';

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_purchase_orders_currency ON lats_purchase_orders(currency);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_exchange_rate_date ON lats_purchase_orders(exchange_rate_date);

