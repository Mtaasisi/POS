-- Fix missing user ID that's causing 406 errors
-- Migration: 20250131000030_fix_missing_user_id.sql

-- Insert the missing user ID that the application is trying to query
INSERT INTO auth_users (id, email, username, name, role, is_active, points) VALUES
    ('a15a9139-3be9-4028-b944-240caae9eeb2', 'user@latschance.com', 'main_user', 'Main User', 'technician', true, 0)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    points = EXCLUDED.points;

-- Insert default goals for this user
INSERT INTO user_daily_goals (user_id, goal_type, goal_value, is_active) VALUES
    ('a15a9139-3be9-4028-b944-240caae9eeb2', 'new_customers', 5, true),
    ('a15a9139-3be9-4028-b944-240caae9eeb2', 'devices_processed', 8, true),
    ('a15a9139-3be9-4028-b944-240caae9eeb2', 'checkins', 10, true),
    ('a15a9139-3be9-4028-b944-240caae9eeb2', 'repairs_completed', 3, true)
ON CONFLICT (user_id, goal_type) DO UPDATE SET
    goal_value = EXCLUDED.goal_value,
    is_active = EXCLUDED.is_active;

-- Insert default POS general settings for this user
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
    'a15a9139-3be9-4028-b944-240caae9eeb2',
    NULL,
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
) ON CONFLICT (user_id, business_id) DO UPDATE SET
    theme = EXCLUDED.theme,
    language = EXCLUDED.language,
    currency = EXCLUDED.currency,
    timezone = EXCLUDED.timezone,
    date_format = EXCLUDED.date_format,
    time_format = EXCLUDED.time_format,
    show_product_images = EXCLUDED.show_product_images,
    show_stock_levels = EXCLUDED.show_stock_levels,
    show_prices = EXCLUDED.show_prices,
    show_barcodes = EXCLUDED.show_barcodes,
    products_per_page = EXCLUDED.products_per_page,
    auto_complete_search = EXCLUDED.auto_complete_search,
    confirm_delete = EXCLUDED.confirm_delete,
    show_confirmations = EXCLUDED.show_confirmations,
    enable_sound_effects = EXCLUDED.enable_sound_effects,
    enable_animations = EXCLUDED.enable_animations,
    enable_caching = EXCLUDED.enable_caching,
    cache_duration = EXCLUDED.cache_duration,
    enable_lazy_loading = EXCLUDED.enable_lazy_loading,
    max_search_results = EXCLUDED.max_search_results;

-- Insert default POS receipt settings for this user
INSERT INTO lats_pos_receipt_settings (
    user_id,
    business_id,
    business_name,
    business_address,
    business_phone,
    business_email,
    show_business_info,
    show_customer_info,
    show_item_details,
    show_tax_breakdown,
    show_payment_method,
    show_change_amount,
    footer_message,
    show_date_time,
    show_cashier_name,
    show_receipt_number,
    paper_width,
    font_size,
    line_spacing
) VALUES (
    'a15a9139-3be9-4028-b944-240caae9eeb2',
    NULL,
    'LATS CHANCE',
    'Dar es Salaam, Tanzania',
    '+255 XXX XXX XXX',
    'info@latschance.com',
    true,
    true,
    true,
    true,
    true,
    true,
    'Thank you for your business!',
    true,
    true,
    true,
    80,
    12,
    1
) ON CONFLICT (user_id, business_id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    business_address = EXCLUDED.business_address,
    business_phone = EXCLUDED.business_phone,
    business_email = EXCLUDED.business_email,
    show_business_info = EXCLUDED.show_business_info,
    show_customer_info = EXCLUDED.show_customer_info,
    show_item_details = EXCLUDED.show_item_details,
    show_tax_breakdown = EXCLUDED.show_tax_breakdown,
    show_payment_method = EXCLUDED.show_payment_method,
    show_change_amount = EXCLUDED.show_change_amount,
    footer_message = EXCLUDED.footer_message,
    show_date_time = EXCLUDED.show_date_time,
    show_cashier_name = EXCLUDED.show_cashier_name,
    show_receipt_number = EXCLUDED.show_receipt_number,
    paper_width = EXCLUDED.paper_width,
    font_size = EXCLUDED.font_size,
    line_spacing = EXCLUDED.line_spacing;

-- Verify the fix
DO $$
BEGIN
  -- Check if the user exists
  IF EXISTS (SELECT 1 FROM auth_users WHERE id = 'a15a9139-3be9-4028-b944-240caae9eeb2') THEN
    RAISE NOTICE '✅ User a15a9139-3be9-4028-b944-240caae9eeb2 has been added successfully';
  ELSE
    RAISE NOTICE '❌ Failed to add user a15a9139-3be9-4028-b944-240caae9eeb2';
  END IF;
  
  -- Check if goals exist for this user
  IF EXISTS (SELECT 1 FROM user_daily_goals WHERE user_id = 'a15a9139-3be9-4028-b944-240caae9eeb2') THEN
    RAISE NOTICE '✅ User daily goals have been created for user a15a9139-3be9-4028-b944-240caae9eeb2';
  ELSE
    RAISE NOTICE '❌ Failed to create user daily goals for user a15a9139-3be9-4028-b944-240caae9eeb2';
  END IF;
  
  -- Check if POS settings exist for this user
  IF EXISTS (SELECT 1 FROM lats_pos_general_settings WHERE user_id = 'a15a9139-3be9-4028-b944-240caae9eeb2') THEN
    RAISE NOTICE '✅ POS general settings have been created for user a15a9139-3be9-4028-b944-240caae9eeb2';
  ELSE
    RAISE NOTICE '❌ Failed to create POS general settings for user a15a9139-3be9-4028-b944-240caae9eeb2';
  END IF;
  
  IF EXISTS (SELECT 1 FROM lats_pos_receipt_settings WHERE user_id = 'a15a9139-3be9-4028-b944-240caae9eeb2') THEN
    RAISE NOTICE '✅ POS receipt settings have been created for user a15a9139-3be9-4028-b944-240caae9eeb2';
  ELSE
    RAISE NOTICE '❌ Failed to create POS receipt settings for user a15a9139-3be9-4028-b944-240caae9eeb2';
  END IF;
END $$;
