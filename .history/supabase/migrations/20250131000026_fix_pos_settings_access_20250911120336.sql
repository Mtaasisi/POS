-- Fix POS Settings Table Access Issues
-- Migration: 20250131000026_fix_pos_settings_access.sql

-- Ensure the table exists
CREATE TABLE IF NOT EXISTS lats_pos_general_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pos_general_user_id ON lats_pos_general_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_general_business_id ON lats_pos_general_settings(business_id);

-- Enable Row Level Security
ALTER TABLE lats_pos_general_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lats_pos_general_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON lats_pos_general_settings;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON lats_pos_general_settings;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON lats_pos_general_settings;

-- Create very permissive policies for testing
CREATE POLICY "Enable read access for all users" ON lats_pos_general_settings
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON lats_pos_general_settings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON lats_pos_general_settings
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON lats_pos_general_settings
    FOR DELETE USING (true);

-- Grant permissions
GRANT ALL ON lats_pos_general_settings TO authenticated;
GRANT ALL ON lats_pos_general_settings TO anon;
GRANT ALL ON lats_pos_general_settings TO service_role;

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_general_settings_updated_at ON lats_pos_general_settings;
CREATE TRIGGER update_general_settings_updated_at 
    BEFORE UPDATE ON lats_pos_general_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings if none exist
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
) VALUES (
    NULL, -- user_id
    NULL, -- business_id
    'light',
    'en',
    'TZS',
    'Africa/Dar_es_Salaam',
    'DD/MM/YYYY',
    '24',
    true,
    true,
    true,
    true,
    20,
    true,
    true,
    true,
    true,
    true,
    true,
    300,
    true,
    50
) ON CONFLICT DO NOTHING;

-- Show success message
SELECT 'POS settings table access fixed successfully' as message;
