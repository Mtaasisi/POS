-- Fix 400 Bad Request error for lats_pos_general_settings table
-- This migration ensures the table exists with correct structure and RLS policies

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- DROP EXISTING TABLE TO START FRESH
-- =====================================================
DROP TABLE IF EXISTS lats_pos_general_settings CASCADE;

-- =====================================================
-- CREATE GENERAL SETTINGS TABLE
-- =====================================================
CREATE TABLE lats_pos_general_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID,
    
    -- Interface Settings
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    language VARCHAR(10) DEFAULT 'en' CHECK (language IN ('en', 'sw', 'fr')),
    currency VARCHAR(3) DEFAULT 'TZS',
    timezone VARCHAR(50) DEFAULT 'Africa/Dar_es_Salaam',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    time_format VARCHAR(10) DEFAULT '24' CHECK (time_format IN ('12', '24')),
    
    -- Display Settings
    show_product_images BOOLEAN DEFAULT true,
    show_stock_levels BOOLEAN DEFAULT true,
    show_prices BOOLEAN DEFAULT true,
    show_barcodes BOOLEAN DEFAULT true,
    products_per_page INTEGER DEFAULT 20 CHECK (products_per_page BETWEEN 10 AND 100),
    
    -- Behavior Settings
    auto_complete_search BOOLEAN DEFAULT true,
    confirm_delete BOOLEAN DEFAULT true,
    show_confirmations BOOLEAN DEFAULT true,
    enable_sound_effects BOOLEAN DEFAULT true,
    enable_animations BOOLEAN DEFAULT true,
    
    -- Performance Settings
    enable_caching BOOLEAN DEFAULT true,
    cache_duration INTEGER DEFAULT 300 CHECK (cache_duration BETWEEN 60 AND 3600),
    enable_lazy_loading BOOLEAN DEFAULT true,
    max_search_results INTEGER DEFAULT 50 CHECK (max_search_results BETWEEN 10 AND 200),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, business_id)
);

-- =====================================================
-- CREATE INDEX FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_pos_general_user_id ON lats_pos_general_settings(user_id);

-- =====================================================
-- CREATE UPDATED_AT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- CREATE TRIGGER FOR UPDATED_AT
-- =====================================================
CREATE TRIGGER update_general_settings_updated_at 
    BEFORE UPDATE ON lats_pos_general_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE lats_pos_general_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE PERMISSIVE RLS POLICY
-- =====================================================
CREATE POLICY "Enable all access for authenticated users" ON lats_pos_general_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT ALL ON lats_pos_general_settings TO authenticated;

-- =====================================================
-- INSERT DEFAULT SETTINGS FOR EXISTING USERS
-- =====================================================
INSERT INTO lats_pos_general_settings (
    user_id, 
    business_id, 
    theme, 
    language, 
    currency, 
    timezone, 
    date_format, 
    time_format, 
    show_product_images, 
    show_stock_levels, 
    show_prices, 
    show_barcodes, 
    products_per_page, 
    auto_complete_search, 
    confirm_delete, 
    show_confirmations, 
    enable_sound_effects, 
    enable_animations, 
    enable_caching, 
    cache_duration, 
    enable_lazy_loading, 
    max_search_results
)
SELECT 
    id as user_id,
    NULL as business_id,
    'light' as theme,
    'en' as language,
    'TZS' as currency,
    'Africa/Dar_es_Salaam' as timezone,
    'DD/MM/YYYY' as date_format,
    '24' as time_format,
    true as show_product_images,
    true as show_stock_levels,
    true as show_prices,
    true as show_barcodes,
    20 as products_per_page,
    true as auto_complete_search,
    true as confirm_delete,
    true as show_confirmations,
    true as enable_sound_effects,
    true as enable_animations,
    true as enable_caching,
    300 as cache_duration,
    true as enable_lazy_loading,
    50 as max_search_results
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM lats_pos_general_settings WHERE user_id IS NOT NULL);

-- =====================================================
-- VERIFY THE FIX
-- =====================================================
DO $$
BEGIN
  -- Check if table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'lats_pos_general_settings'
  ) THEN
    RAISE EXCEPTION 'Table lats_pos_general_settings was not created';
  END IF;
  
  -- Check if policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'lats_pos_general_settings' 
    AND policyname = 'Enable all access for authenticated users'
  ) THEN
    RAISE EXCEPTION 'RLS policy not created for lats_pos_general_settings';
  END IF;
  
  -- Check if index exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'lats_pos_general_settings' 
    AND indexname = 'idx_pos_general_user_id'
  ) THEN
    RAISE EXCEPTION 'Index not created for lats_pos_general_settings';
  END IF;
  
  RAISE NOTICE '✅ lats_pos_general_settings table has been fixed successfully';
END $$;
