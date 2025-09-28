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

-- Insert default goals for this user (only if they don't exist)
INSERT INTO user_daily_goals (user_id, goal_type, goal_value, is_active) 
SELECT 'a15a9139-3be9-4028-b944-240caae9eeb2', 'new_customers', 5, true
WHERE NOT EXISTS (SELECT 1 FROM user_daily_goals WHERE user_id = 'a15a9139-3be9-4028-b944-240caae9eeb2' AND goal_type = 'new_customers');

INSERT INTO user_daily_goals (user_id, goal_type, goal_value, is_active) 
SELECT 'a15a9139-3be9-4028-b944-240caae9eeb2', 'devices_processed', 8, true
WHERE NOT EXISTS (SELECT 1 FROM user_daily_goals WHERE user_id = 'a15a9139-3be9-4028-b944-240caae9eeb2' AND goal_type = 'devices_processed');

INSERT INTO user_daily_goals (user_id, goal_type, goal_value, is_active) 
SELECT 'a15a9139-3be9-4028-b944-240caae9eeb2', 'checkins', 10, true
WHERE NOT EXISTS (SELECT 1 FROM user_daily_goals WHERE user_id = 'a15a9139-3be9-4028-b944-240caae9eeb2' AND goal_type = 'checkins');

INSERT INTO user_daily_goals (user_id, goal_type, goal_value, is_active) 
SELECT 'a15a9139-3be9-4028-b944-240caae9eeb2', 'repairs_completed', 3, true
WHERE NOT EXISTS (SELECT 1 FROM user_daily_goals WHERE user_id = 'a15a9139-3be9-4028-b944-240caae9eeb2' AND goal_type = 'repairs_completed');

-- Insert default POS general settings for this user (only if they don't exist)
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
WHERE NOT EXISTS (
    SELECT 1 FROM lats_pos_general_settings 
    WHERE user_id = 'a15a9139-3be9-4028-b944-240caae9eeb2' 
    AND business_id IS NULL
);

-- Insert default POS receipt settings for this user (only if they don't exist)
INSERT INTO lats_pos_receipt_settings (
    user_id,
    business_id,
    receipt_template,
    receipt_width,
    receipt_font_size,
    show_business_logo,
    show_business_name,
    show_business_address,
    show_business_phone,
    show_business_email,
    show_business_website,
    show_transaction_id,
    show_date_time,
    show_cashier_name,
    show_receipt_number,
    show_payment_method,
    show_change_amount,
    show_tax_breakdown,
    show_item_details,
    show_customer_info,
    footer_message
) 
SELECT 
    'a15a9139-3be9-4028-b944-240caae9eeb2',
    NULL,
    'standard',
    80,
    12,
    true,
    true,
    true,
    true,
    false,
    false,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    'Thank you for your business!'
WHERE NOT EXISTS (
    SELECT 1 FROM lats_pos_receipt_settings 
    WHERE user_id = 'a15a9139-3be9-4028-b944-240caae9eeb2' 
    AND business_id IS NULL
);

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
