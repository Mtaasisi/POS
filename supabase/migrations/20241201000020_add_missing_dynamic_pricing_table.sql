-- Add Missing Dynamic Pricing Settings Table Migration
-- This migration adds the missing lats_pos_dynamic_pricing_settings table

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- DYNAMIC PRICING SETTINGS TABLE
-- =====================================================
DROP TABLE IF EXISTS lats_pos_dynamic_pricing_settings CASCADE;

CREATE TABLE lats_pos_dynamic_pricing_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID,
    
    -- General Pricing
    enable_dynamic_pricing BOOLEAN DEFAULT true,
    enable_loyalty_pricing BOOLEAN DEFAULT true,
    enable_bulk_pricing BOOLEAN DEFAULT true,
    enable_time_based_pricing BOOLEAN DEFAULT false,
    enable_customer_pricing BOOLEAN DEFAULT false,
    enable_special_events BOOLEAN DEFAULT false,
    
    -- Loyalty Pricing
    loyalty_discount_percent DECIMAL(5,2) DEFAULT 5.00 CHECK (loyalty_discount_percent BETWEEN 0 AND 100),
    loyalty_points_threshold INTEGER DEFAULT 1000,
    loyalty_max_discount DECIMAL(5,2) DEFAULT 20.00 CHECK (loyalty_max_discount BETWEEN 0 AND 100),
    
    -- Bulk Pricing
    bulk_discount_enabled BOOLEAN DEFAULT true,
    bulk_discount_threshold INTEGER DEFAULT 10,
    bulk_discount_percent DECIMAL(5,2) DEFAULT 10.00 CHECK (bulk_discount_percent BETWEEN 0 AND 100),
    
    -- Time-based Pricing
    time_based_discount_enabled BOOLEAN DEFAULT false,
    time_based_start_time TIME DEFAULT '18:00',
    time_based_end_time TIME DEFAULT '22:00',
    time_based_discount_percent DECIMAL(5,2) DEFAULT 15.00 CHECK (time_based_discount_percent BETWEEN 0 AND 100),
    
    -- Customer-based Pricing
    customer_pricing_enabled BOOLEAN DEFAULT false,
    vip_customer_discount DECIMAL(5,2) DEFAULT 10.00 CHECK (vip_customer_discount BETWEEN 0 AND 100),
    regular_customer_discount DECIMAL(5,2) DEFAULT 5.00 CHECK (regular_customer_discount BETWEEN 0 AND 100),
    
    -- Special Events
    special_events_enabled BOOLEAN DEFAULT false,
    special_event_discount_percent DECIMAL(5,2) DEFAULT 20.00 CHECK (special_event_discount_percent BETWEEN 0 AND 100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for user_id and business_id lookups
CREATE INDEX IF NOT EXISTS idx_pos_dynamic_pricing_user_business ON lats_pos_dynamic_pricing_settings(user_id, business_id);

-- Indexes for updated_at for efficient queries
CREATE INDEX IF NOT EXISTS idx_pos_dynamic_pricing_updated ON lats_pos_dynamic_pricing_settings(updated_at);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE lats_pos_dynamic_pricing_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================

-- Users can view their own settings
CREATE POLICY "Users can view their own dynamic pricing settings" ON lats_pos_dynamic_pricing_settings 
FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert their own dynamic pricing settings" ON lats_pos_dynamic_pricing_settings 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update their own dynamic pricing settings" ON lats_pos_dynamic_pricing_settings 
FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own settings
CREATE POLICY "Users can delete their own dynamic pricing settings" ON lats_pos_dynamic_pricing_settings 
FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

-- Create or replace the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at column
CREATE TRIGGER update_pos_dynamic_pricing_updated_at 
    BEFORE UPDATE ON lats_pos_dynamic_pricing_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Insert default settings for existing users (optional)
-- This will create default settings for any user who doesn't have them yet
INSERT INTO lats_pos_dynamic_pricing_settings (user_id, business_id)
SELECT DISTINCT u.id, NULL::uuid
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM lats_pos_dynamic_pricing_settings s WHERE s.user_id = u.id
)
ON CONFLICT (user_id, business_id) DO NOTHING;
