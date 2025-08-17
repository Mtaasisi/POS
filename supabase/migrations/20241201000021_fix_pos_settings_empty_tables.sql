-- Fix POS Settings Empty Tables Migration
-- This migration creates default settings and fixes RLS policies for empty tables

-- =====================================================
-- DROP EXISTING RESTRICTIVE POLICIES
-- =====================================================

-- Drop all existing policies that might be causing issues
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

-- Drop generic policies too
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
-- CREATE PERMISSIVE POLICIES FOR EMPTY TABLES
-- =====================================================

-- General Settings - Allow all authenticated users to access
CREATE POLICY "Enable all access for authenticated users" ON lats_pos_general_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- Receipt Settings - Allow all authenticated users to access
CREATE POLICY "Enable all access for authenticated users" ON lats_pos_receipt_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- Delivery Settings - Allow all authenticated users to access
CREATE POLICY "Enable all access for authenticated users" ON lats_pos_delivery_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- Advanced Settings - Allow all authenticated users to access
CREATE POLICY "Enable all access for authenticated users" ON lats_pos_advanced_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- CREATE DEFAULT SETTINGS FOR EXISTING USERS
-- =====================================================

-- Insert default general settings for all existing users
INSERT INTO lats_pos_general_settings (user_id, business_id, theme, language, currency, timezone, date_format, time_format, show_product_images, show_stock_levels, show_prices, show_barcodes, products_per_page, auto_complete_search, confirm_delete, show_confirmations, enable_sound_effects, enable_animations, enable_caching, cache_duration, enable_lazy_loading, max_search_results)
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

-- Insert default receipt settings for all existing users
INSERT INTO lats_pos_receipt_settings (user_id, business_id, receipt_template, receipt_width, receipt_font_size, show_business_logo, show_business_name, show_business_address, show_business_phone, show_business_email, show_business_website, show_transaction_id, show_date_time, show_cashier_name, show_customer_name, show_customer_phone, show_product_names, show_product_skus, show_product_barcodes, show_quantities, show_unit_prices, show_discounts, show_subtotal, show_tax, show_discount_total, show_grand_total, print_mode, auto_print, print_copies, paper_size, receipt_prefix, receipt_numbering, start_number, reset_daily, keep_history, history_days, auto_backup, backup_location)
SELECT 
    id as user_id,
    NULL as business_id,
    'standard' as receipt_template,
    80 as receipt_width,
    12 as receipt_font_size,
    true as show_business_logo,
    true as show_business_name,
    true as show_business_address,
    true as show_business_phone,
    false as show_business_email,
    false as show_business_website,
    true as show_transaction_id,
    true as show_date_time,
    true as show_cashier_name,
    true as show_customer_name,
    false as show_customer_phone,
    true as show_product_names,
    false as show_product_skus,
    false as show_product_barcodes,
    true as show_quantities,
    true as show_unit_prices,
    true as show_discounts,
    true as show_subtotal,
    true as show_tax,
    true as show_discount_total,
    true as show_grand_total,
    'thermal' as print_mode,
    false as auto_print,
    1 as print_copies,
    '80mm' as paper_size,
    'RCP' as receipt_prefix,
    true as receipt_numbering,
    1 as start_number,
    false as reset_daily,
    true as keep_history,
    30 as history_days,
    false as auto_backup,
    'local' as backup_location
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM lats_pos_receipt_settings WHERE user_id IS NOT NULL);

-- Insert default delivery settings for all existing users
INSERT INTO lats_pos_delivery_settings (user_id, business_id, enable_delivery, default_delivery_fee, free_delivery_threshold, max_delivery_distance, enable_delivery_areas, delivery_areas, area_delivery_fees, area_delivery_times, enable_delivery_hours, delivery_start_time, delivery_end_time, enable_same_day_delivery, enable_next_day_delivery, delivery_time_slots, notify_customer_on_delivery, notify_driver_on_assignment, enable_sms_notifications, enable_email_notifications, enable_driver_assignment, driver_commission, require_signature, enable_driver_tracking, enable_scheduled_delivery, enable_partial_delivery, require_advance_payment, advance_payment_percent)
SELECT 
    id as user_id,
    NULL as business_id,
    true as enable_delivery,
    2000 as default_delivery_fee,
    50000 as free_delivery_threshold,
    20 as max_delivery_distance,
    true as enable_delivery_areas,
    '["City Center", "Suburbs", "Outskirts"]'::jsonb as delivery_areas,
    '{"City Center": 1500, "Suburbs": 2500, "Outskirts": 3500}'::jsonb as area_delivery_fees,
    '{"City Center": 30, "Suburbs": 60, "Outskirts": 90}'::jsonb as area_delivery_times,
    true as enable_delivery_hours,
    '08:00' as delivery_start_time,
    '20:00' as delivery_end_time,
    true as enable_same_day_delivery,
    true as enable_next_day_delivery,
    '["Morning", "Afternoon", "Evening"]'::jsonb as delivery_time_slots,
    true as notify_customer_on_delivery,
    true as notify_driver_on_assignment,
    true as enable_sms_notifications,
    false as enable_email_notifications,
    true as enable_driver_assignment,
    15.00 as driver_commission,
    true as require_signature,
    true as enable_driver_tracking,
    false as enable_scheduled_delivery,
    false as enable_partial_delivery,
    false as require_advance_payment,
    50 as advance_payment_percent
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM lats_pos_delivery_settings WHERE user_id IS NOT NULL);

-- Insert default advanced settings for all existing users
INSERT INTO lats_pos_advanced_settings (user_id, business_id, enable_performance_mode, enable_caching, cache_size, enable_lazy_loading, max_concurrent_requests, enable_database_optimization, enable_auto_backup, backup_frequency, enable_data_compression, enable_query_optimization, enable_two_factor_auth, enable_session_timeout, session_timeout_minutes, enable_audit_logging, enable_encryption, enable_api_access, enable_webhooks, enable_third_party_integrations, enable_data_sync, sync_interval, enable_debug_mode, enable_error_reporting, enable_performance_monitoring, enable_logging, log_level, enable_experimental_features, enable_beta_features, enable_auto_updates)
SELECT 
    id as user_id,
    NULL as business_id,
    false as enable_performance_mode,
    true as enable_caching,
    100 as cache_size,
    true as enable_lazy_loading,
    10 as max_concurrent_requests,
    true as enable_database_optimization,
    true as enable_auto_backup,
    'daily' as backup_frequency,
    true as enable_data_compression,
    true as enable_query_optimization,
    false as enable_two_factor_auth,
    true as enable_session_timeout,
    30 as session_timeout_minutes,
    true as enable_audit_logging,
    true as enable_encryption,
    false as enable_api_access,
    false as enable_webhooks,
    false as enable_third_party_integrations,
    false as enable_data_sync,
    60 as sync_interval,
    false as enable_debug_mode,
    true as enable_error_reporting,
    true as enable_performance_monitoring,
    true as enable_logging,
    'info' as log_level,
    false as enable_experimental_features,
    false as enable_beta_features,
    true as enable_auto_updates
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM lats_pos_advanced_settings WHERE user_id IS NOT NULL);

-- =====================================================
-- VERIFY THE FIX
-- =====================================================

-- Check row counts after the fix
SELECT 
  'lats_pos_general_settings' as table_name,
  COUNT(*) as row_count
FROM lats_pos_general_settings
UNION ALL
SELECT 
  'lats_pos_receipt_settings' as table_name,
  COUNT(*) as row_count
FROM lats_pos_receipt_settings
UNION ALL
SELECT 
  'lats_pos_delivery_settings' as table_name,
  COUNT(*) as row_count
FROM lats_pos_delivery_settings
UNION ALL
SELECT 
  'lats_pos_advanced_settings' as table_name,
  COUNT(*) as row_count
FROM lats_pos_advanced_settings;
