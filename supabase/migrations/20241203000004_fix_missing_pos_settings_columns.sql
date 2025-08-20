-- Migration to fix missing columns in POS settings tables
-- This addresses the 400 Bad Request errors when creating default records

-- =====================================================
-- FIX LOYALTY CUSTOMER SETTINGS TABLE
-- =====================================================

-- Add missing columns to loyalty customer settings table
ALTER TABLE lats_pos_loyalty_customer_settings 
ADD COLUMN IF NOT EXISTS anniversary_points_bonus INTEGER DEFAULT 250,
ADD COLUMN IF NOT EXISTS enable_first_purchase_bonus BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS first_purchase_points_bonus INTEGER DEFAULT 200,
ADD COLUMN IF NOT EXISTS enable_spending_tiers BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS bronze_points_multiplier DECIMAL(3,2) DEFAULT 1.00,
ADD COLUMN IF NOT EXISTS silver_points_multiplier DECIMAL(3,2) DEFAULT 1.25,
ADD COLUMN IF NOT EXISTS gold_points_multiplier DECIMAL(3,2) DEFAULT 1.50,
ADD COLUMN IF NOT EXISTS platinum_points_multiplier DECIMAL(3,2) DEFAULT 2.00,
ADD COLUMN IF NOT EXISTS enable_auto_tier_upgrade BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_auto_tier_downgrade BOOLEAN DEFAULT true;

-- =====================================================
-- FIX ANALYTICS REPORTING SETTINGS TABLE
-- =====================================================

-- Add missing columns to analytics reporting settings table
ALTER TABLE lats_pos_analytics_reporting_settings 
ADD COLUMN IF NOT EXISTS enable_alert_system BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_anomaly_detection BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_benchmarking BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_competitor_analysis BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_market_analysis BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_customer_insights BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_product_insights BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_sales_insights BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_inventory_insights BOOLEAN DEFAULT true;

-- =====================================================
-- VERIFY CHANGES
-- =====================================================

-- Check that all required columns exist
DO $$
BEGIN
    -- Check loyalty table columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_pos_loyalty_customer_settings' 
        AND column_name = 'anniversary_points_bonus'
    ) THEN
        RAISE EXCEPTION 'Missing column: anniversary_points_bonus in lats_pos_loyalty_customer_settings';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_pos_analytics_reporting_settings' 
        AND column_name = 'enable_alert_system'
    ) THEN
        RAISE EXCEPTION 'Missing column: enable_alert_system in lats_pos_analytics_reporting_settings';
    END IF;

    RAISE NOTICE 'All required columns have been added successfully';
END $$;
