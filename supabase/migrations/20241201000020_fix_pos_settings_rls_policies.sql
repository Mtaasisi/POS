-- Fix POS Settings RLS Policies Migration
-- This migration fixes the RLS policies that are causing 406 errors

-- =====================================================
-- DROP EXISTING POLICIES
-- =====================================================

-- Drop existing policies for the problematic tables
DROP POLICY IF EXISTS "Users can view their own general settings" ON lats_pos_general_settings;
DROP POLICY IF EXISTS "Users can insert their own general settings" ON lats_pos_general_settings;
DROP POLICY IF EXISTS "Users can update their own general settings" ON lats_pos_general_settings;
DROP POLICY IF EXISTS "Users can delete their own general settings" ON lats_pos_general_settings;

DROP POLICY IF EXISTS "Users can view their own receipt settings" ON lats_pos_receipt_settings;
DROP POLICY IF EXISTS "Users can insert their own receipt settings" ON lats_pos_receipt_settings;
DROP POLICY IF EXISTS "Users can update their own receipt settings" ON lats_pos_receipt_settings;
DROP POLICY IF EXISTS "Users can delete their own receipt settings" ON lats_pos_receipt_settings;

DROP POLICY IF EXISTS "Users can view their own delivery settings" ON lats_pos_delivery_settings;
DROP POLICY IF EXISTS "Users can insert their own delivery settings" ON lats_pos_delivery_settings;
DROP POLICY IF EXISTS "Users can update their own delivery settings" ON lats_pos_delivery_settings;
DROP POLICY IF EXISTS "Users can delete their own delivery settings" ON lats_pos_delivery_settings;

DROP POLICY IF EXISTS "Users can view their own advanced settings" ON lats_pos_advanced_settings;
DROP POLICY IF EXISTS "Users can insert their own advanced settings" ON lats_pos_advanced_settings;
DROP POLICY IF EXISTS "Users can update their own advanced settings" ON lats_pos_advanced_settings;
DROP POLICY IF EXISTS "Users can delete their own advanced settings" ON lats_pos_advanced_settings;

-- Also drop any generic policies that might be causing conflicts
DROP POLICY IF EXISTS "Users can view their own settings" ON lats_pos_general_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON lats_pos_general_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON lats_pos_general_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON lats_pos_general_settings;

DROP POLICY IF EXISTS "Users can view their own settings" ON lats_pos_receipt_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON lats_pos_receipt_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON lats_pos_receipt_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON lats_pos_receipt_settings;

DROP POLICY IF EXISTS "Users can view their own settings" ON lats_pos_delivery_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON lats_pos_delivery_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON lats_pos_delivery_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON lats_pos_delivery_settings;

DROP POLICY IF EXISTS "Users can view their own settings" ON lats_pos_advanced_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON lats_pos_advanced_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON lats_pos_advanced_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON lats_pos_advanced_settings;

-- =====================================================
-- CREATE NEW, MORE PERMISSIVE POLICIES
-- =====================================================

-- General Settings - More permissive policies
CREATE POLICY "Enable read access for authenticated users" ON lats_pos_general_settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON lats_pos_general_settings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON lats_pos_general_settings
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON lats_pos_general_settings
    FOR DELETE USING (auth.role() = 'authenticated');

-- Receipt Settings - More permissive policies
CREATE POLICY "Enable read access for authenticated users" ON lats_pos_receipt_settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON lats_pos_receipt_settings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON lats_pos_receipt_settings
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON lats_pos_receipt_settings
    FOR DELETE USING (auth.role() = 'authenticated');

-- Delivery Settings - More permissive policies
CREATE POLICY "Enable read access for authenticated users" ON lats_pos_delivery_settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON lats_pos_delivery_settings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON lats_pos_delivery_settings
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON lats_pos_delivery_settings
    FOR DELETE USING (auth.role() = 'authenticated');

-- Advanced Settings - More permissive policies
CREATE POLICY "Enable read access for authenticated users" ON lats_pos_advanced_settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON lats_pos_advanced_settings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON lats_pos_advanced_settings
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON lats_pos_advanced_settings
    FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- ALTERNATIVE: TEMPORARILY DISABLE RLS FOR TESTING
-- =====================================================
-- Uncomment the lines below if you want to temporarily disable RLS for testing
-- ALTER TABLE lats_pos_general_settings DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE lats_pos_receipt_settings DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE lats_pos_delivery_settings DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE lats_pos_advanced_settings DISABLE ROW LEVEL SECURITY;
