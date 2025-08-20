-- =====================================================
-- FIX POS SETTINGS RLS POLICIES
-- =====================================================
-- This migration fixes conflicting RLS policies that are causing 406 errors
-- by dropping all existing policies and creating consistent permissive policies

-- =====================================================
-- DROP ALL EXISTING POLICIES
-- =====================================================

-- Drop restrictive policies from lats_pos_search_filter_settings
DROP POLICY IF EXISTS "Users can view their own settings" ON lats_pos_search_filter_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON lats_pos_search_filter_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON lats_pos_search_filter_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON lats_pos_search_filter_settings;

-- Drop restrictive policies from lats_pos_loyalty_customer_settings
DROP POLICY IF EXISTS "Users can view their own settings" ON lats_pos_loyalty_customer_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON lats_pos_loyalty_customer_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON lats_pos_loyalty_customer_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON lats_pos_loyalty_customer_settings;

-- Drop restrictive policies from lats_pos_analytics_reporting_settings
DROP POLICY IF EXISTS "Users can view their own settings" ON lats_pos_analytics_reporting_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON lats_pos_analytics_reporting_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON lats_pos_analytics_reporting_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON lats_pos_analytics_reporting_settings;

-- Drop restrictive policies from lats_pos_user_permissions_settings
DROP POLICY IF EXISTS "Users can view their own settings" ON lats_pos_user_permissions_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON lats_pos_user_permissions_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON lats_pos_user_permissions_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON lats_pos_user_permissions_settings;

-- Drop restrictive policies from lats_pos_barcode_scanner_settings
DROP POLICY IF EXISTS "Users can view their own settings" ON lats_pos_barcode_scanner_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON lats_pos_barcode_scanner_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON lats_pos_barcode_scanner_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON lats_pos_barcode_scanner_settings;

-- Drop restrictive policies from lats_pos_notification_settings
DROP POLICY IF EXISTS "Users can view their own settings" ON lats_pos_notification_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON lats_pos_notification_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON lats_pos_notification_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON lats_pos_notification_settings;

-- Drop restrictive policies from lats_pos_delivery_settings
DROP POLICY IF EXISTS "Users can view their own settings" ON lats_pos_delivery_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON lats_pos_delivery_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON lats_pos_delivery_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON lats_pos_delivery_settings;

-- Drop restrictive policies from lats_pos_general_settings
DROP POLICY IF EXISTS "Users can view their own settings" ON lats_pos_general_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON lats_pos_general_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON lats_pos_general_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON lats_pos_general_settings;

-- Drop restrictive policies from lats_pos_dynamic_pricing_settings
DROP POLICY IF EXISTS "Users can view their own settings" ON lats_pos_dynamic_pricing_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON lats_pos_dynamic_pricing_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON lats_pos_dynamic_pricing_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON lats_pos_dynamic_pricing_settings;

-- Drop restrictive policies from lats_pos_receipt_settings
DROP POLICY IF EXISTS "Users can view their own settings" ON lats_pos_receipt_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON lats_pos_receipt_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON lats_pos_receipt_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON lats_pos_receipt_settings;

-- Drop restrictive policies from lats_pos_advanced_settings
DROP POLICY IF EXISTS "Users can view their own settings" ON lats_pos_advanced_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON lats_pos_advanced_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON lats_pos_advanced_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON lats_pos_advanced_settings;

-- =====================================================
-- CREATE CONSISTENT PERMISSIVE POLICIES
-- =====================================================

-- Create permissive policies for all POS settings tables
CREATE POLICY "Enable all access for authenticated users" ON lats_pos_search_filter_settings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON lats_pos_loyalty_customer_settings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON lats_pos_analytics_reporting_settings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON lats_pos_user_permissions_settings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON lats_pos_barcode_scanner_settings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON lats_pos_notification_settings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON lats_pos_delivery_settings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON lats_pos_general_settings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON lats_pos_dynamic_pricing_settings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON lats_pos_receipt_settings
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON lats_pos_advanced_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant all permissions to authenticated users for all POS settings tables
GRANT ALL ON lats_pos_search_filter_settings TO authenticated;
GRANT ALL ON lats_pos_loyalty_customer_settings TO authenticated;
GRANT ALL ON lats_pos_analytics_reporting_settings TO authenticated;
GRANT ALL ON lats_pos_user_permissions_settings TO authenticated;
GRANT ALL ON lats_pos_barcode_scanner_settings TO authenticated;
GRANT ALL ON lats_pos_notification_settings TO authenticated;
GRANT ALL ON lats_pos_delivery_settings TO authenticated;
GRANT ALL ON lats_pos_general_settings TO authenticated;
GRANT ALL ON lats_pos_dynamic_pricing_settings TO authenticated;
GRANT ALL ON lats_pos_receipt_settings TO authenticated;
GRANT ALL ON lats_pos_advanced_settings TO authenticated;

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pos_search_filter_user_id ON lats_pos_search_filter_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_loyalty_customer_user_id ON lats_pos_loyalty_customer_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_analytics_reporting_user_id ON lats_pos_analytics_reporting_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_user_permissions_user_id ON lats_pos_user_permissions_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_barcode_scanner_user_id ON lats_pos_barcode_scanner_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_notification_user_id ON lats_pos_notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_delivery_user_id ON lats_pos_delivery_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_general_user_id ON lats_pos_general_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_dynamic_pricing_user_id ON lats_pos_dynamic_pricing_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_receipt_user_id ON lats_pos_receipt_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pos_advanced_user_id ON lats_pos_advanced_settings(user_id);

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- This query can be run to verify that all policies are correctly set
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename LIKE 'lats_pos_%' 
-- ORDER BY tablename, policyname;
