-- Fix POS Settings RLS Policies
-- This migration ensures proper RLS policies are in place for POS settings tables

-- =====================================================
-- DROP EXISTING POLICIES (if they exist)
-- =====================================================

-- Drop existing policies for barcode scanner settings
DROP POLICY IF EXISTS "Users can view their own barcode scanner settings" ON lats_pos_barcode_scanner_settings;
DROP POLICY IF EXISTS "Users can insert their own barcode scanner settings" ON lats_pos_barcode_scanner_settings;
DROP POLICY IF EXISTS "Users can update their own barcode scanner settings" ON lats_pos_barcode_scanner_settings;
DROP POLICY IF EXISTS "Users can delete their own barcode scanner settings" ON lats_pos_barcode_scanner_settings;

-- Drop existing policies for search filter settings
DROP POLICY IF EXISTS "Users can view their own search filter settings" ON lats_pos_search_filter_settings;
DROP POLICY IF EXISTS "Users can insert their own search filter settings" ON lats_pos_search_filter_settings;
DROP POLICY IF EXISTS "Users can update their own search filter settings" ON lats_pos_search_filter_settings;
DROP POLICY IF EXISTS "Users can delete their own search filter settings" ON lats_pos_search_filter_settings;

-- Drop existing policies for user permissions settings
DROP POLICY IF EXISTS "Users can view their own user permissions settings" ON lats_pos_user_permissions_settings;
DROP POLICY IF EXISTS "Users can insert their own user permissions settings" ON lats_pos_user_permissions_settings;
DROP POLICY IF EXISTS "Users can update their own user permissions settings" ON lats_pos_user_permissions_settings;
DROP POLICY IF EXISTS "Users can delete their own user permissions settings" ON lats_pos_user_permissions_settings;

-- Drop existing policies for loyalty customer settings
DROP POLICY IF EXISTS "Users can view their own loyalty customer settings" ON lats_pos_loyalty_customer_settings;
DROP POLICY IF EXISTS "Users can insert their own loyalty customer settings" ON lats_pos_loyalty_customer_settings;
DROP POLICY IF EXISTS "Users can update their own loyalty customer settings" ON lats_pos_loyalty_customer_settings;
DROP POLICY IF EXISTS "Users can delete their own loyalty customer settings" ON lats_pos_loyalty_customer_settings;

-- Drop existing policies for analytics reporting settings
DROP POLICY IF EXISTS "Users can view their own analytics reporting settings" ON lats_pos_analytics_reporting_settings;
DROP POLICY IF EXISTS "Users can insert their own analytics reporting settings" ON lats_pos_analytics_reporting_settings;
DROP POLICY IF EXISTS "Users can update their own analytics reporting settings" ON lats_pos_analytics_reporting_settings;
DROP POLICY IF EXISTS "Users can delete their own analytics reporting settings" ON lats_pos_analytics_reporting_settings;

-- Drop existing policies for notification settings
DROP POLICY IF EXISTS "Users can view their own notification settings" ON lats_pos_notification_settings;
DROP POLICY IF EXISTS "Users can insert their own notification settings" ON lats_pos_notification_settings;
DROP POLICY IF EXISTS "Users can update their own notification settings" ON lats_pos_notification_settings;
DROP POLICY IF EXISTS "Users can delete their own notification settings" ON lats_pos_notification_settings;

-- =====================================================
-- CREATE NEW RLS POLICIES
-- =====================================================

-- Barcode Scanner Settings Policies
CREATE POLICY "Users can view their own barcode scanner settings" ON lats_pos_barcode_scanner_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own barcode scanner settings" ON lats_pos_barcode_scanner_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own barcode scanner settings" ON lats_pos_barcode_scanner_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own barcode scanner settings" ON lats_pos_barcode_scanner_settings FOR DELETE USING (auth.uid() = user_id);

-- Search Filter Settings Policies
CREATE POLICY "Users can view their own search filter settings" ON lats_pos_search_filter_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own search filter settings" ON lats_pos_search_filter_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own search filter settings" ON lats_pos_search_filter_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own search filter settings" ON lats_pos_search_filter_settings FOR DELETE USING (auth.uid() = user_id);

-- User Permissions Settings Policies
CREATE POLICY "Users can view their own user permissions settings" ON lats_pos_user_permissions_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own user permissions settings" ON lats_pos_user_permissions_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own user permissions settings" ON lats_pos_user_permissions_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own user permissions settings" ON lats_pos_user_permissions_settings FOR DELETE USING (auth.uid() = user_id);

-- Loyalty Customer Settings Policies
CREATE POLICY "Users can view their own loyalty customer settings" ON lats_pos_loyalty_customer_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own loyalty customer settings" ON lats_pos_loyalty_customer_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own loyalty customer settings" ON lats_pos_loyalty_customer_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own loyalty customer settings" ON lats_pos_loyalty_customer_settings FOR DELETE USING (auth.uid() = user_id);

-- Analytics Reporting Settings Policies
CREATE POLICY "Users can view their own analytics reporting settings" ON lats_pos_analytics_reporting_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own analytics reporting settings" ON lats_pos_analytics_reporting_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own analytics reporting settings" ON lats_pos_analytics_reporting_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own analytics reporting settings" ON lats_pos_analytics_reporting_settings FOR DELETE USING (auth.uid() = user_id);

-- Notification Settings Policies
CREATE POLICY "Users can view their own notification settings" ON lats_pos_notification_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notification settings" ON lats_pos_notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notification settings" ON lats_pos_notification_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notification settings" ON lats_pos_notification_settings FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- CREATE DEFAULT RECORDS FOR EXISTING USERS
-- =====================================================

-- Function to create default POS settings for a user
CREATE OR REPLACE FUNCTION create_default_pos_settings_for_user(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    -- Create default barcode scanner settings
    INSERT INTO lats_pos_barcode_scanner_settings (
        user_id, business_id, enable_barcode_scanner, enable_camera_scanner, 
        enable_keyboard_input, enable_manual_entry, auto_add_to_cart, 
        scanner_sound_enabled, scanner_vibration_enabled, camera_resolution, 
        camera_facing, camera_flash_enabled, enable_ean13, enable_ean8, 
        enable_upc_a, enable_upc_e, enable_code128, enable_code39, 
        enable_qr_code, enable_data_matrix, scan_timeout, retry_attempts, auto_focus_enabled
    ) VALUES (
        user_uuid, NULL, true, true, true, true, true, true, true, '720p', 
        'back', false, true, true, true, true, true, true, true, true, 5000, 3, true
    ) ON CONFLICT (user_id, business_id) DO NOTHING;
    
    -- Create default search filter settings
    INSERT INTO lats_pos_search_filter_settings (
        user_id, business_id, enable_product_search, enable_customer_search, 
        enable_sales_search, search_by_name, search_by_barcode, search_by_sku, 
        search_by_category, search_by_brand, search_by_supplier, search_by_description, 
        search_by_tags, enable_fuzzy_search, enable_autocomplete, enable_search_history, 
        enable_recent_searches, enable_popular_searches, enable_search_suggestions, 
        min_search_length, max_search_results, search_timeout, max_search_history
    ) VALUES (
        user_uuid, NULL, true, true, true, true, true, true, true, true, true, 
        false, false, true, true, true, true, true, true, 2, 50, 3000, 20
    ) ON CONFLICT (user_id, business_id) DO NOTHING;
    
    -- Create default user permissions settings
    INSERT INTO lats_pos_user_permissions_settings (
        user_id, business_id, enable_pos_access, enable_sales_access, 
        enable_refunds_access, enable_void_access, enable_discount_access, 
        enable_tax_access, enable_inventory_access, enable_product_creation, 
        enable_product_editing, enable_product_deletion, enable_stock_adjustment, 
        enable_bulk_operations, enable_customer_access, enable_customer_creation, 
        enable_customer_editing, enable_customer_deletion, enable_customer_history, 
        enable_reports_access, enable_sales_reports, enable_inventory_reports, 
        enable_customer_reports, enable_financial_reports, enable_settings_access, 
        enable_user_management, enable_system_settings, enable_backup_restore, 
        enable_api_access, enable_export_data, enable_import_data, enable_bulk_import
    ) VALUES (
        user_uuid, NULL, true, true, false, false, true, true, true, true, true, 
        false, true, false, true, true, true, false, true, true, true, true, true, 
        false, false, false, false, false, false, true, false, false
    ) ON CONFLICT (user_id, business_id) DO NOTHING;
    
    -- Create default loyalty customer settings
    INSERT INTO lats_pos_loyalty_customer_settings (
        user_id, business_id, enable_loyalty_program, loyalty_program_name, 
        points_per_currency, currency_per_point, minimum_points_redemption, 
        maximum_points_redemption, enable_customer_tiers, bronze_threshold, 
        silver_threshold, gold_threshold, platinum_threshold, bronze_discount, 
        silver_discount, gold_discount, platinum_discount, enable_birthday_rewards, 
        birthday_points, birthday_discount, enable_loyalty_notifications, 
        notify_points_earned, notify_points_redeemed, notify_tier_upgrade, notify_birthday_rewards
    ) VALUES (
        user_uuid, NULL, true, 'Customer Rewards', 1.00, 0.01, 100, 10000, true, 
        0, 1000, 5000, 10000, 0.00, 2.00, 5.00, 10.00, true, 500, 10.00, true, 
        true, true, true, true
    ) ON CONFLICT (user_id, business_id) DO NOTHING;
    
    -- Create default analytics reporting settings
    INSERT INTO lats_pos_analytics_reporting_settings (
        user_id, business_id, enable_analytics, enable_sales_analytics, 
        enable_inventory_analytics, enable_customer_analytics, enable_financial_analytics, 
        enable_daily_reports, enable_weekly_reports, enable_monthly_reports, 
        enable_yearly_reports, data_retention_days, enable_data_export, 
        enable_data_backup, enable_sales_insights, enable_inventory_insights, 
        enable_customer_insights, enable_product_insights, enable_performance_tracking, 
        enable_error_tracking, enable_usage_analytics
    ) VALUES (
        user_uuid, NULL, true, true, true, true, true, true, true, true, true, 
        365, true, true, true, true, true, true, true, true, true
    ) ON CONFLICT (user_id, business_id) DO NOTHING;
    
    -- Create default notification settings
    INSERT INTO lats_pos_notification_settings (
        user_id, business_id, enable_notifications, enable_sound_notifications, 
        enable_visual_notifications, enable_push_notifications, notification_timeout, 
        notify_new_sale, notify_sale_completion, notify_refund_processed, 
        notify_void_transaction, notify_payment_received, notify_low_stock, 
        notify_out_of_stock, notify_stock_adjustment, notify_new_product_added, 
        notify_product_updated, notify_new_customer, notify_customer_birthday, 
        notify_loyalty_points_earned, notify_loyalty_points_redeemed, notify_tier_upgrade, 
        notify_system_errors, notify_backup_completion, notify_sync_issues, 
        notify_performance_alerts, notify_security_alerts, enable_email_notifications, 
        email_notification_address, notify_sales_summary_email, notify_inventory_alerts_email, 
        notify_system_alerts_email, enable_sms_notifications, sms_notification_number, 
        notify_critical_alerts_sms, notify_daily_summary_sms
    ) VALUES (
        user_uuid, NULL, true, true, true, false, 5000, true, true, true, true, true, 
        true, true, true, false, false, false, true, true, true, true, true, true, 
        true, false, true, false, NULL, false, false, false, false, NULL, false, false
    ) ON CONFLICT (user_id, business_id) DO NOTHING;
    
END;
$$ LANGUAGE plpgsql;

-- Create default settings for the specific user mentioned in the error logs
SELECT create_default_pos_settings_for_user('a7c9adb7-f525-4850-bd42-79a769f12953'::UUID);

-- Create default settings for all existing users (optional)
-- SELECT create_default_pos_settings_for_user(id) FROM auth.users WHERE id IS NOT NULL;
