-- Complete Database Export Script
-- Exports all data from all tables in the Supabase database
-- Generated: 2025-01-27

-- Set output format for better readability
\pset format aligned
\pset tuples_only off

-- Create backup directory (if using psql)
-- \! mkdir -p database_backup_$(date +%Y%m%d_%H%M%S)

-- Export all tables with data
-- Each table export includes:
-- 1. Table structure (if needed)
-- 2. All data in INSERT format
-- 3. Row count verification

-- ========================================
-- AUTH USERS TABLE
-- ========================================
\echo 'Exporting auth_users table...'
SELECT 'auth_users' as table_name, COUNT(*) as record_count FROM auth_users;
\copy (SELECT * FROM auth_users ORDER BY created_at DESC) TO 'auth_users.csv' WITH CSV HEADER;

-- ========================================
-- CUSTOMERS TABLE
-- ========================================
\echo 'Exporting customers table...'
SELECT 'customers' as table_name, COUNT(*) as record_count FROM customers;
\copy (SELECT * FROM customers ORDER BY created_at DESC) TO 'customers.csv' WITH CSV HEADER;

-- ========================================
-- DEVICES TABLE
-- ========================================
\echo 'Exporting devices table...'
SELECT 'devices' as table_name, COUNT(*) as record_count FROM devices;
\copy (SELECT * FROM devices ORDER BY created_at DESC) TO 'devices.csv' WITH CSV HEADER;

-- ========================================
-- DEVICE PRICE HISTORY TABLE
-- ========================================
\echo 'Exporting device_price_history table...'
SELECT 'device_price_history' as table_name, COUNT(*) as record_count FROM device_price_history;
\copy (SELECT * FROM device_price_history ORDER BY updated_at DESC) TO 'device_price_history.csv' WITH CSV HEADER;

-- ========================================
-- DEVICE CHECKLISTS TABLE
-- ========================================
\echo 'Exporting device_checklists table...'
SELECT 'device_checklists' as table_name, COUNT(*) as record_count FROM device_checklists;
\copy (SELECT * FROM device_checklists ORDER BY created_at DESC) TO 'device_checklists.csv' WITH CSV HEADER;

-- ========================================
-- DEVICE ATTACHMENTS TABLE
-- ========================================
\echo 'Exporting device_attachments table...'
SELECT 'device_attachments' as table_name, COUNT(*) as record_count FROM device_attachments;
\copy (SELECT * FROM device_attachments ORDER BY uploaded_at DESC) TO 'device_attachments.csv' WITH CSV HEADER;

-- ========================================
-- DEVICE REMARKS TABLE
-- ========================================
\echo 'Exporting device_remarks table...'
SELECT 'device_remarks' as table_name, COUNT(*) as record_count FROM device_remarks;
\copy (SELECT * FROM device_remarks ORDER BY created_at DESC) TO 'device_remarks.csv' WITH CSV HEADER;

-- ========================================
-- DEVICE TRANSITIONS TABLE
-- ========================================
\echo 'Exporting device_transitions table...'
SELECT 'device_transitions' as table_name, COUNT(*) as record_count FROM device_transitions;
\copy (SELECT * FROM device_transitions ORDER BY created_at DESC) TO 'device_transitions.csv' WITH CSV HEADER;

-- ========================================
-- DEVICE RATINGS TABLE
-- ========================================
\echo 'Exporting device_ratings table...'
SELECT 'device_ratings' as table_name, COUNT(*) as record_count FROM device_ratings;
\copy (SELECT * FROM device_ratings ORDER BY created_at DESC) TO 'device_ratings.csv' WITH CSV HEADER;

-- ========================================
-- CUSTOMER NOTES TABLE
-- ========================================
\echo 'Exporting customer_notes table...'
SELECT 'customer_notes' as table_name, COUNT(*) as record_count FROM customer_notes;
\copy (SELECT * FROM customer_notes ORDER BY created_at DESC) TO 'customer_notes.csv' WITH CSV HEADER;

-- ========================================
-- PROMO MESSAGES TABLE
-- ========================================
\echo 'Exporting promo_messages table...'
SELECT 'promo_messages' as table_name, COUNT(*) as record_count FROM promo_messages;
\copy (SELECT * FROM promo_messages ORDER BY sent_at DESC) TO 'promo_messages.csv' WITH CSV HEADER;

-- ========================================
-- CUSTOMER PAYMENTS TABLE
-- ========================================
\echo 'Exporting customer_payments table...'
SELECT 'customer_payments' as table_name, COUNT(*) as record_count FROM customer_payments;
\copy (SELECT * FROM customer_payments ORDER BY created_at DESC) TO 'customer_payments.csv' WITH CSV HEADER;

-- ========================================
-- FINANCE ACCOUNTS TABLE
-- ========================================
\echo 'Exporting finance_accounts table...'
SELECT 'finance_accounts' as table_name, COUNT(*) as record_count FROM finance_accounts;
\copy (SELECT * FROM finance_accounts ORDER BY created_at DESC) TO 'finance_accounts.csv' WITH CSV HEADER;

-- ========================================
-- SMS CAMPAIGNS TABLE
-- ========================================
\echo 'Exporting sms_campaigns table...'
SELECT 'sms_campaigns' as table_name, COUNT(*) as record_count FROM sms_campaigns;
\copy (SELECT * FROM sms_campaigns ORDER BY created_at DESC) TO 'sms_campaigns.csv' WITH CSV HEADER;

-- ========================================
-- SMS TRIGGERS TABLE
-- ========================================
\echo 'Exporting sms_triggers table...'
SELECT 'sms_triggers' as table_name, COUNT(*) as record_count FROM sms_triggers;
\copy (SELECT * FROM sms_triggers ORDER BY created_at DESC) TO 'sms_triggers.csv' WITH CSV HEADER;

-- ========================================
-- SMS TRIGGER LOGS TABLE
-- ========================================
\echo 'Exporting sms_trigger_logs table...'
SELECT 'sms_trigger_logs' as table_name, COUNT(*) as record_count FROM sms_trigger_logs;
\copy (SELECT * FROM sms_trigger_logs ORDER BY created_at DESC) TO 'sms_trigger_logs.csv' WITH CSV HEADER;

-- ========================================
-- SMS TEMPLATES TABLE
-- ========================================
\echo 'Exporting sms_templates table...'
SELECT 'sms_templates' as table_name, COUNT(*) as record_count FROM sms_templates;
\copy (SELECT * FROM sms_templates ORDER BY created_at DESC) TO 'sms_templates.csv' WITH CSV HEADER;

-- ========================================
-- SMS LOGS TABLE
-- ========================================
\echo 'Exporting sms_logs table...'
SELECT 'sms_logs' as table_name, COUNT(*) as record_count FROM sms_logs;
\copy (SELECT * FROM sms_logs ORDER BY created_at DESC) TO 'sms_logs.csv' WITH CSV HEADER;

-- ========================================
-- COMMUNICATION TEMPLATES TABLE
-- ========================================
\echo 'Exporting communication_templates table...'
SELECT 'communication_templates' as table_name, COUNT(*) as record_count FROM communication_templates;
\copy (SELECT * FROM communication_templates ORDER BY created_at DESC) TO 'communication_templates.csv' WITH CSV HEADER;

-- ========================================
-- DIAGNOSTIC REQUESTS TABLE
-- ========================================
\echo 'Exporting diagnostic_requests table...'
SELECT 'diagnostic_requests' as table_name, COUNT(*) as record_count FROM diagnostic_requests;
\copy (SELECT * FROM diagnostic_requests ORDER BY created_at DESC) TO 'diagnostic_requests.csv' WITH CSV HEADER;

-- ========================================
-- DIAGNOSTIC DEVICES TABLE
-- ========================================
\echo 'Exporting diagnostic_devices table...'
SELECT 'diagnostic_devices' as table_name, COUNT(*) as record_count FROM diagnostic_devices;
\copy (SELECT * FROM diagnostic_devices ORDER BY created_at DESC) TO 'diagnostic_devices.csv' WITH CSV HEADER;

-- ========================================
-- DIAGNOSTIC CHECKS TABLE
-- ========================================
\echo 'Exporting diagnostic_checks table...'
SELECT 'diagnostic_checks' as table_name, COUNT(*) as record_count FROM diagnostic_checks;
\copy (SELECT * FROM diagnostic_checks ORDER BY created_at DESC) TO 'diagnostic_checks.csv' WITH CSV HEADER;

-- ========================================
-- DIAGNOSTIC TEMPLATES TABLE
-- ========================================
\echo 'Exporting diagnostic_templates table...'
SELECT 'diagnostic_templates' as table_name, COUNT(*) as record_count FROM diagnostic_templates;
\copy (SELECT * FROM diagnostic_templates ORDER BY created_at DESC) TO 'diagnostic_templates.csv' WITH CSV HEADER;

-- ========================================
-- DIAGNOSTIC IMAGES TABLE
-- ========================================
\echo 'Exporting diagnostic-images table...'
SELECT 'diagnostic-images' as table_name, COUNT(*) as record_count FROM "diagnostic-images";
\copy (SELECT * FROM "diagnostic-images" ORDER BY created_at DESC) TO 'diagnostic_images.csv' WITH CSV HEADER;

-- ========================================
-- RETURNS TABLE
-- ========================================
\echo 'Exporting returns table...'
SELECT 'returns' as table_name, COUNT(*) as record_count FROM returns;
\copy (SELECT * FROM returns ORDER BY created_at DESC) TO 'returns.csv' WITH CSV HEADER;

-- ========================================
-- RETURN REMARKS TABLE
-- ========================================
\echo 'Exporting return_remarks table...'
SELECT 'return_remarks' as table_name, COUNT(*) as record_count FROM return_remarks;
\copy (SELECT * FROM return_remarks ORDER BY created_at DESC) TO 'return_remarks.csv' WITH CSV HEADER;

-- ========================================
-- AUDIT LOGS TABLE
-- ========================================
\echo 'Exporting audit_logs table...'
SELECT 'audit_logs' as table_name, COUNT(*) as record_count FROM audit_logs;
\copy (SELECT * FROM audit_logs ORDER BY timestamp DESC) TO 'audit_logs.csv' WITH CSV HEADER;

-- ========================================
-- POINTS TRANSACTIONS TABLE
-- ========================================
\echo 'Exporting points_transactions table...'
SELECT 'points_transactions' as table_name, COUNT(*) as record_count FROM points_transactions;
\copy (SELECT * FROM points_transactions ORDER BY created_at DESC) TO 'points_transactions.csv' WITH CSV HEADER;

-- ========================================
-- REDEMPTION REWARDS TABLE
-- ========================================
\echo 'Exporting redemption_rewards table...'
SELECT 'redemption_rewards' as table_name, COUNT(*) as record_count FROM redemption_rewards;
\copy (SELECT * FROM redemption_rewards ORDER BY created_at DESC) TO 'redemption_rewards.csv' WITH CSV HEADER;

-- ========================================
-- REDEMPTION TRANSACTIONS TABLE
-- ========================================
\echo 'Exporting redemption_transactions table...'
SELECT 'redemption_transactions' as table_name, COUNT(*) as record_count FROM redemption_transactions;
\copy (SELECT * FROM redemption_transactions ORDER BY redeemed_at DESC) TO 'redemption_transactions.csv' WITH CSV HEADER;

-- ========================================
-- SPARE PARTS TABLE
-- ========================================
\echo 'Exporting spare_parts table...'
SELECT 'spare_parts' as table_name, COUNT(*) as record_count FROM spare_parts;
\copy (SELECT * FROM spare_parts ORDER BY created_at DESC) TO 'spare_parts.csv' WITH CSV HEADER;

-- ========================================
-- SPARE PARTS USAGE TABLE
-- ========================================
\echo 'Exporting spare_parts_usage table...'
SELECT 'spare_parts_usage' as table_name, COUNT(*) as record_count FROM spare_parts_usage;
\copy (SELECT * FROM spare_parts_usage ORDER BY used_at DESC) TO 'spare_parts_usage.csv' WITH CSV HEADER;

-- ========================================
-- INVENTORY CATEGORIES TABLE
-- ========================================
\echo 'Exporting inventory_categories table...'
SELECT 'inventory_categories' as table_name, COUNT(*) as record_count FROM inventory_categories;
\copy (SELECT * FROM inventory_categories ORDER BY created_at DESC) TO 'inventory_categories.csv' WITH CSV HEADER;

-- ========================================
-- INVENTORY PRODUCTS TABLE
-- ========================================
\echo 'Exporting inventory_products table...'
SELECT 'inventory_products' as table_name, COUNT(*) as record_count FROM inventory_products;
\copy (SELECT * FROM inventory_products ORDER BY created_at DESC) TO 'inventory_products.csv' WITH CSV HEADER;

-- ========================================
-- INVENTORY TRANSACTIONS TABLE
-- ========================================
\echo 'Exporting inventory_transactions table...'
SELECT 'inventory_transactions' as table_name, COUNT(*) as record_count FROM inventory_transactions;
\copy (SELECT * FROM inventory_transactions ORDER BY created_at DESC) TO 'inventory_transactions.csv' WITH CSV HEADER;

-- ========================================
-- LATS SALES TABLE
-- ========================================
\echo 'Exporting lats_sales table...'
SELECT 'lats_sales' as table_name, COUNT(*) as record_count FROM lats_sales;
\copy (SELECT * FROM lats_sales ORDER BY created_at DESC) TO 'lats_sales.csv' WITH CSV HEADER;

-- ========================================
-- LATS SALE ITEMS TABLE
-- ========================================
\echo 'Exporting lats_sale_items table...'
SELECT 'lats_sale_items' as table_name, COUNT(*) as record_count FROM lats_sale_items;
\copy (SELECT * FROM lats_sale_items ORDER BY created_at DESC) TO 'lats_sale_items.csv' WITH CSV HEADER;

-- ========================================
-- LATS PRODUCTS TABLE
-- ========================================
\echo 'Exporting lats_products table...'
SELECT 'lats_products' as table_name, COUNT(*) as record_count FROM lats_products;
\copy (SELECT * FROM lats_products ORDER BY created_at DESC) TO 'lats_products.csv' WITH CSV HEADER;

-- ========================================
-- LATS PRODUCT VARIANTS TABLE
-- ========================================
\echo 'Exporting lats_product_variants table...'
SELECT 'lats_product_variants' as table_name, COUNT(*) as record_count FROM lats_product_variants;
\copy (SELECT * FROM lats_product_variants ORDER BY created_at DESC) TO 'lats_product_variants.csv' WITH CSV HEADER;

-- ========================================
-- LATS RECEIPTS TABLE
-- ========================================
\echo 'Exporting lats_receipts table...'
SELECT 'lats_receipts' as table_name, COUNT(*) as record_count FROM lats_receipts;
\copy (SELECT * FROM lats_receipts ORDER BY created_at DESC) TO 'lats_receipts.csv' WITH CSV HEADER;

-- ========================================
-- LATS STOCK MOVEMENTS TABLE
-- ========================================
\echo 'Exporting lats_stock_movements table...'
SELECT 'lats_stock_movements' as table_name, COUNT(*) as record_count FROM lats_stock_movements;
\copy (SELECT * FROM lats_stock_movements ORDER BY created_at DESC) TO 'lats_stock_movements.csv' WITH CSV HEADER;

-- ========================================
-- EXPORT SUMMARY
-- ========================================
\echo 'Generating export summary...'

-- Create summary table with all table counts
WITH table_counts AS (
  SELECT 'auth_users' as table_name, COUNT(*) as record_count FROM auth_users
  UNION ALL
  SELECT 'customers', COUNT(*) FROM customers
  UNION ALL
  SELECT 'devices', COUNT(*) FROM devices
  UNION ALL
  SELECT 'device_price_history', COUNT(*) FROM device_price_history
  UNION ALL
  SELECT 'device_checklists', COUNT(*) FROM device_checklists
  UNION ALL
  SELECT 'device_attachments', COUNT(*) FROM device_attachments
  UNION ALL
  SELECT 'device_remarks', COUNT(*) FROM device_remarks
  UNION ALL
  SELECT 'device_transitions', COUNT(*) FROM device_transitions
  UNION ALL
  SELECT 'device_ratings', COUNT(*) FROM device_ratings
  UNION ALL
  SELECT 'customer_notes', COUNT(*) FROM customer_notes
  UNION ALL
  SELECT 'promo_messages', COUNT(*) FROM promo_messages
  UNION ALL
  SELECT 'customer_payments', COUNT(*) FROM customer_payments
  UNION ALL
  SELECT 'finance_accounts', COUNT(*) FROM finance_accounts
  UNION ALL
  SELECT 'sms_campaigns', COUNT(*) FROM sms_campaigns
  UNION ALL
  SELECT 'sms_triggers', COUNT(*) FROM sms_triggers
  UNION ALL
  SELECT 'sms_trigger_logs', COUNT(*) FROM sms_trigger_logs
  UNION ALL
  SELECT 'sms_templates', COUNT(*) FROM sms_templates
  UNION ALL
  SELECT 'sms_logs', COUNT(*) FROM sms_logs
  UNION ALL
  SELECT 'communication_templates', COUNT(*) FROM communication_templates
  UNION ALL
  SELECT 'diagnostic_requests', COUNT(*) FROM diagnostic_requests
  UNION ALL
  SELECT 'diagnostic_devices', COUNT(*) FROM diagnostic_devices
  UNION ALL
  SELECT 'diagnostic_checks', COUNT(*) FROM diagnostic_checks
  UNION ALL
  SELECT 'diagnostic_templates', COUNT(*) FROM diagnostic_templates
  UNION ALL
  SELECT 'diagnostic-images', COUNT(*) FROM "diagnostic-images"
  UNION ALL
  SELECT 'returns', COUNT(*) FROM returns
  UNION ALL
  SELECT 'return_remarks', COUNT(*) FROM return_remarks
  UNION ALL
  SELECT 'audit_logs', COUNT(*) FROM audit_logs
  UNION ALL
  SELECT 'points_transactions', COUNT(*) FROM points_transactions
  UNION ALL
  SELECT 'redemption_rewards', COUNT(*) FROM redemption_rewards
  UNION ALL
  SELECT 'redemption_transactions', COUNT(*) FROM redemption_transactions
  UNION ALL
  SELECT 'spare_parts', COUNT(*) FROM spare_parts
  UNION ALL
  SELECT 'spare_parts_usage', COUNT(*) FROM spare_parts_usage
  UNION ALL
  SELECT 'inventory_categories', COUNT(*) FROM inventory_categories
  UNION ALL
  SELECT 'inventory_products', COUNT(*) FROM inventory_products
  UNION ALL
  SELECT 'inventory_transactions', COUNT(*) FROM inventory_transactions
  UNION ALL
  SELECT 'lats_sales', COUNT(*) FROM lats_sales
  UNION ALL
  SELECT 'lats_sale_items', COUNT(*) FROM lats_sale_items
  UNION ALL
  SELECT 'lats_products', COUNT(*) FROM lats_products
  UNION ALL
  SELECT 'lats_product_variants', COUNT(*) FROM lats_product_variants
  UNION ALL
  SELECT 'lats_receipts', COUNT(*) FROM lats_receipts
  UNION ALL
  SELECT 'lats_stock_movements', COUNT(*) FROM lats_stock_movements
)
SELECT 
  table_name,
  record_count,
  CASE 
    WHEN record_count = 0 THEN 'EMPTY'
    WHEN record_count < 100 THEN 'SMALL'
    WHEN record_count < 1000 THEN 'MEDIUM'
    ELSE 'LARGE'
  END as size_category
FROM table_counts 
ORDER BY record_count DESC;

-- Export summary to CSV
\copy (
  WITH table_counts AS (
    SELECT 'auth_users' as table_name, COUNT(*) as record_count FROM auth_users
    UNION ALL
    SELECT 'customers', COUNT(*) FROM customers
    UNION ALL
    SELECT 'devices', COUNT(*) FROM devices
    UNION ALL
    SELECT 'device_price_history', COUNT(*) FROM device_price_history
    UNION ALL
    SELECT 'device_checklists', COUNT(*) FROM device_checklists
    UNION ALL
    SELECT 'device_attachments', COUNT(*) FROM device_attachments
    UNION ALL
    SELECT 'device_remarks', COUNT(*) FROM device_remarks
    UNION ALL
    SELECT 'device_transitions', COUNT(*) FROM device_transitions
    UNION ALL
    SELECT 'device_ratings', COUNT(*) FROM device_ratings
    UNION ALL
    SELECT 'customer_notes', COUNT(*) FROM customer_notes
    UNION ALL
    SELECT 'promo_messages', COUNT(*) FROM promo_messages
    UNION ALL
    SELECT 'customer_payments', COUNT(*) FROM customer_payments
    UNION ALL
    SELECT 'finance_accounts', COUNT(*) FROM finance_accounts
    UNION ALL
    SELECT 'sms_campaigns', COUNT(*) FROM sms_campaigns
    UNION ALL
    SELECT 'sms_triggers', COUNT(*) FROM sms_triggers
    UNION ALL
    SELECT 'sms_trigger_logs', COUNT(*) FROM sms_trigger_logs
    UNION ALL
    SELECT 'sms_templates', COUNT(*) FROM sms_templates
    UNION ALL
    SELECT 'sms_logs', COUNT(*) FROM sms_logs
    UNION ALL
    SELECT 'communication_templates', COUNT(*) FROM communication_templates
    UNION ALL
    SELECT 'diagnostic_requests', COUNT(*) FROM diagnostic_requests
    UNION ALL
    SELECT 'diagnostic_devices', COUNT(*) FROM diagnostic_devices
    UNION ALL
    SELECT 'diagnostic_checks', COUNT(*) FROM diagnostic_checks
    UNION ALL
    SELECT 'diagnostic_templates', COUNT(*) FROM diagnostic_templates
    UNION ALL
    SELECT 'diagnostic-images', COUNT(*) FROM "diagnostic-images"
    UNION ALL
    SELECT 'returns', COUNT(*) FROM returns
    UNION ALL
    SELECT 'return_remarks', COUNT(*) FROM return_remarks
    UNION ALL
    SELECT 'audit_logs', COUNT(*) FROM audit_logs
    UNION ALL
    SELECT 'points_transactions', COUNT(*) FROM points_transactions
    UNION ALL
    SELECT 'redemption_rewards', COUNT(*) FROM redemption_rewards
    UNION ALL
    SELECT 'redemption_transactions', COUNT(*) FROM redemption_transactions
    UNION ALL
    SELECT 'spare_parts', COUNT(*) FROM spare_parts
    UNION ALL
    SELECT 'spare_parts_usage', COUNT(*) FROM spare_parts_usage
    UNION ALL
    SELECT 'inventory_categories', COUNT(*) FROM inventory_categories
    UNION ALL
    SELECT 'inventory_products', COUNT(*) FROM inventory_products
    UNION ALL
    SELECT 'inventory_transactions', COUNT(*) FROM inventory_transactions
    UNION ALL
    SELECT 'lats_sales', COUNT(*) FROM lats_sales
    UNION ALL
    SELECT 'lats_sale_items', COUNT(*) FROM lats_sale_items
    UNION ALL
    SELECT 'lats_products', COUNT(*) FROM lats_products
    UNION ALL
    SELECT 'lats_product_variants', COUNT(*) FROM lats_product_variants
    UNION ALL
    SELECT 'lats_receipts', COUNT(*) FROM lats_receipts
    UNION ALL
    SELECT 'lats_stock_movements', COUNT(*) FROM lats_stock_movements
  )
  SELECT 
    table_name,
    record_count,
    CASE 
      WHEN record_count = 0 THEN 'EMPTY'
      WHEN record_count < 100 THEN 'SMALL'
      WHEN record_count < 1000 THEN 'MEDIUM'
      ELSE 'LARGE'
    END as size_category
  FROM table_counts 
  ORDER BY record_count DESC
) TO 'export_summary.csv' WITH CSV HEADER;

\echo 'Database export completed successfully!'
\echo 'All CSV files have been generated in the current directory.'
\echo 'Check export_summary.csv for a complete overview of all tables and record counts.'
