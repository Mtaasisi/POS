-- =====================================================
-- REMOVE ALL PAYMENT FUNCTIONALITY FROM DATABASE
-- =====================================================
-- This script removes all payment-related tables, columns, and data
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. DROP PAYMENT-RELATED TABLES
-- =====================================================

-- Drop payment-related tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS payment_webhooks CASCADE;
DROP TABLE IF EXISTS payment_analytics CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS customer_payments CASCADE;
DROP TABLE IF EXISTS purchase_order_payments CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS payment_providers CASCADE;

-- =====================================================
-- 2. REMOVE PAYMENT-RELATED COLUMNS FROM DEVICES TABLE
-- =====================================================

-- Remove payment-related columns from devices table
ALTER TABLE devices DROP COLUMN IF EXISTS repair_price;
ALTER TABLE devices DROP COLUMN IF EXISTS repair_cost;
ALTER TABLE devices DROP COLUMN IF EXISTS deposit_amount;
ALTER TABLE devices DROP COLUMN IF EXISTS total_paid;
ALTER TABLE devices DROP COLUMN IF EXISTS payment_status;
ALTER TABLE devices DROP COLUMN IF EXISTS outstanding_amount;

-- =====================================================
-- 3. REMOVE PAYMENT-RELATED COLUMNS FROM PURCHASE ORDERS
-- =====================================================

-- Remove payment-related columns from purchase orders
ALTER TABLE lats_purchase_orders DROP COLUMN IF EXISTS total_paid;
ALTER TABLE lats_purchase_orders DROP COLUMN IF EXISTS payment_status;

-- =====================================================
-- 4. REMOVE PAYMENT-RELATED COLUMNS FROM CUSTOMERS TABLE
-- =====================================================

-- Remove payment-related columns from customers table
ALTER TABLE customers DROP COLUMN IF EXISTS total_paid;
ALTER TABLE customers DROP COLUMN IF EXISTS outstanding_balance;
ALTER TABLE customers DROP COLUMN IF EXISTS payment_status;

-- =====================================================
-- 5. DROP PAYMENT-RELATED FUNCTIONS
-- =====================================================

-- Drop payment-related functions
DROP FUNCTION IF EXISTS process_purchase_order_payment(UUID, UUID, DECIMAL, VARCHAR, VARCHAR, TEXT, TEXT);
DROP FUNCTION IF EXISTS safe_update_customer_payment(UUID, JSONB);
DROP FUNCTION IF EXISTS safe_update_customer_payment_v2(UUID, JSONB);
DROP FUNCTION IF EXISTS create_repair_payment(UUID, UUID, DECIMAL, VARCHAR, UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS update_payment_status(UUID, VARCHAR);

-- =====================================================
-- 6. DROP PAYMENT-RELATED TRIGGERS
-- =====================================================

-- Drop payment-related triggers
DROP TRIGGER IF EXISTS update_customer_payments_updated_at ON customer_payments;
DROP TRIGGER IF EXISTS update_purchase_order_payments_updated_at ON purchase_order_payments;
DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON payment_transactions;

-- =====================================================
-- 7. DROP PAYMENT-RELATED VIEWS
-- =====================================================

-- Drop payment-related views
DROP VIEW IF EXISTS repair_payments_view;
DROP VIEW IF EXISTS payment_summary_view;
DROP VIEW IF EXISTS customer_payment_summary;

-- =====================================================
-- 8. CLEAN UP FINANCE_ACCOUNTS TABLE (OPTIONAL)
-- =====================================================

-- If you want to keep finance_accounts for other purposes, skip this section
-- Otherwise, uncomment the lines below to remove finance accounts as well

-- DROP TABLE IF EXISTS finance_accounts CASCADE;

-- =====================================================
-- 9. REMOVE PAYMENT-RELATED POLICIES
-- =====================================================

-- Note: Policies are automatically dropped when tables are dropped
-- This section is for reference only

-- =====================================================
-- 10. VERIFICATION QUERIES
-- =====================================================

-- Check if payment tables still exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%payment%';

-- Check if payment-related columns still exist in devices table
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'devices' 
AND table_schema = 'public'
AND (column_name LIKE '%payment%' OR column_name LIKE '%repair_price%' OR column_name LIKE '%repair_cost%' OR column_name LIKE '%deposit%');

-- Check if payment-related columns still exist in purchase orders table
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'lats_purchase_orders' 
AND table_schema = 'public'
AND (column_name LIKE '%payment%' OR column_name LIKE '%paid%');

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Payment functionality has been completely removed from the database!';
    RAISE NOTICE 'All payment-related tables, columns, functions, and triggers have been dropped.';
    RAISE NOTICE 'The repair system now works without any payment processing.';
END $$;
