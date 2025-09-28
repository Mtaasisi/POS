-- =====================================================
-- REMOVE PAYMENT TABLES - SIMPLE VERSION
-- =====================================================
-- Run this directly in Supabase SQL Editor

-- Drop all payment-related tables
DROP TABLE IF EXISTS payment_webhooks CASCADE;
DROP TABLE IF EXISTS payment_analytics CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS customer_payments CASCADE;
DROP TABLE IF EXISTS purchase_order_payments CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS payment_providers CASCADE;

-- Remove payment columns from devices table
ALTER TABLE devices DROP COLUMN IF EXISTS repair_price;
ALTER TABLE devices DROP COLUMN IF EXISTS repair_cost;
ALTER TABLE devices DROP COLUMN IF EXISTS deposit_amount;
ALTER TABLE devices DROP COLUMN IF EXISTS total_paid;
ALTER TABLE devices DROP COLUMN IF EXISTS payment_status;
ALTER TABLE devices DROP COLUMN IF EXISTS outstanding_amount;

-- Remove payment columns from purchase orders
ALTER TABLE lats_purchase_orders DROP COLUMN IF EXISTS total_paid;
ALTER TABLE lats_purchase_orders DROP COLUMN IF EXISTS payment_status;

-- Remove payment columns from customers
ALTER TABLE customers DROP COLUMN IF EXISTS total_paid;
ALTER TABLE customers DROP COLUMN IF EXISTS outstanding_balance;
ALTER TABLE customers DROP COLUMN IF EXISTS payment_status;

-- Drop payment functions
DROP FUNCTION IF EXISTS process_purchase_order_payment(UUID, UUID, DECIMAL, VARCHAR, VARCHAR, TEXT, TEXT);
DROP FUNCTION IF EXISTS safe_update_customer_payment(UUID, JSONB);
DROP FUNCTION IF EXISTS safe_update_customer_payment_v2(UUID, JSONB);
DROP FUNCTION IF EXISTS create_repair_payment(UUID, UUID, DECIMAL, VARCHAR, UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS update_payment_status(UUID, VARCHAR);

-- Drop payment views
DROP VIEW IF EXISTS repair_payments_view;
DROP VIEW IF EXISTS payment_summary_view;
DROP VIEW IF EXISTS customer_payment_summary;

-- Optional: Drop finance_accounts if not needed elsewhere
-- DROP TABLE IF EXISTS finance_accounts CASCADE;
