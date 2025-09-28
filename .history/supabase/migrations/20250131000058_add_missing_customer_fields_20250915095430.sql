-- Add missing fields to customers table that are referenced in the application code
-- Migration: 20250131000058_add_missing_customer_fields.sql

-- Add missing columns to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS color_tag TEXT DEFAULT 'new' CHECK (color_tag IN ('new', 'vip', 'complainer', 'purchased', 'normal'));

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS loyalty_level TEXT DEFAULT 'bronze' CHECK (loyalty_level IN ('bronze', 'silver', 'gold', 'platinum'));

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS total_spent NUMERIC(12,2) DEFAULT 0;

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS last_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES customers(id) ON DELETE SET NULL;

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS referral_source TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_color_tag ON customers(color_tag);
CREATE INDEX IF NOT EXISTS idx_customers_loyalty_level ON customers(loyalty_level);
CREATE INDEX IF NOT EXISTS idx_customers_total_spent ON customers(total_spent);
CREATE INDEX IF NOT EXISTS idx_customers_last_visit ON customers(last_visit);
CREATE INDEX IF NOT EXISTS idx_customers_points ON customers(points);
CREATE INDEX IF NOT EXISTS idx_customers_referred_by ON customers(referred_by);

-- Add comments for documentation
COMMENT ON COLUMN customers.color_tag IS 'Customer color tag for categorization (new, vip, complainer, purchased, normal)';
COMMENT ON COLUMN customers.loyalty_level IS 'Customer loyalty level (bronze, silver, gold, platinum)';
COMMENT ON COLUMN customers.total_spent IS 'Total amount spent by customer';
COMMENT ON COLUMN customers.last_visit IS 'Date of last customer visit';
COMMENT ON COLUMN customers.points IS 'Customer loyalty points';
COMMENT ON COLUMN customers.referred_by IS 'ID of customer who referred this customer';
COMMENT ON COLUMN customers.referral_source IS 'Source of customer referral';

-- Verification
DO $$
DECLARE
    color_tag_exists BOOLEAN;
    loyalty_level_exists BOOLEAN;
    total_spent_exists BOOLEAN;
    last_visit_exists BOOLEAN;
    points_exists BOOLEAN;
    referred_by_exists BOOLEAN;
    referral_source_exists BOOLEAN;
BEGIN
    -- Check if color_tag column exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers'
        AND column_name = 'color_tag'
    ) INTO color_tag_exists;
    
    -- Check if loyalty_level column exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers'
        AND column_name = 'loyalty_level'
    ) INTO loyalty_level_exists;
    
    -- Check if total_spent column exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers'
        AND column_name = 'total_spent'
    ) INTO total_spent_exists;
    
    -- Check if last_visit column exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers'
        AND column_name = 'last_visit'
    ) INTO last_visit_exists;
    
    -- Check if points column exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers'
        AND column_name = 'points'
    ) INTO points_exists;
    
    -- Check if referred_by column exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers'
        AND column_name = 'referred_by'
    ) INTO referred_by_exists;
    
    -- Check if referral_source column exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers'
        AND column_name = 'referral_source'
    ) INTO referral_source_exists;
    
    -- Report results
    IF color_tag_exists THEN
        RAISE NOTICE '✅ color_tag column exists';
    ELSE
        RAISE NOTICE '❌ color_tag column missing';
    END IF;
    
    IF loyalty_level_exists THEN
        RAISE NOTICE '✅ loyalty_level column exists';
    ELSE
        RAISE NOTICE '❌ loyalty_level column missing';
    END IF;
    
    IF total_spent_exists THEN
        RAISE NOTICE '✅ total_spent column exists';
    ELSE
        RAISE NOTICE '❌ total_spent column missing';
    END IF;
    
    IF last_visit_exists THEN
        RAISE NOTICE '✅ last_visit column exists';
    ELSE
        RAISE NOTICE '❌ last_visit column missing';
    END IF;
    
    IF points_exists THEN
        RAISE NOTICE '✅ points column exists';
    ELSE
        RAISE NOTICE '❌ points column missing';
    END IF;
    
    IF referred_by_exists THEN
        RAISE NOTICE '✅ referred_by column exists';
    ELSE
        RAISE NOTICE '❌ referred_by column missing';
    END IF;
    
    IF referral_source_exists THEN
        RAISE NOTICE '✅ referral_source column exists';
    ELSE
        RAISE NOTICE '❌ referral_source column missing';
    END IF;
    
    RAISE NOTICE '✅ All missing customer fields should now be available!';
END $$;
