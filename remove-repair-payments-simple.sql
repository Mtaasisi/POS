-- =====================================================
-- REMOVE REPAIR PAYMENTS ONLY - SIMPLE VERSION
-- =====================================================
-- Run this directly in Supabase SQL Editor
-- This removes only repair-related payment functionality

-- Drop repair payment table
DROP TABLE IF EXISTS customer_payments CASCADE;

-- Remove repair payment columns from devices table
ALTER TABLE devices DROP COLUMN IF EXISTS repair_price;
ALTER TABLE devices DROP COLUMN IF EXISTS repair_cost;
ALTER TABLE devices DROP COLUMN IF EXISTS deposit_amount;
ALTER TABLE devices DROP COLUMN IF EXISTS total_paid;
ALTER TABLE devices DROP COLUMN IF EXISTS payment_status;
ALTER TABLE devices DROP COLUMN IF EXISTS outstanding_amount;

-- Remove repair payment columns from customers table
ALTER TABLE customers DROP COLUMN IF EXISTS total_paid;
ALTER TABLE customers DROP COLUMN IF EXISTS outstanding_balance;
ALTER TABLE customers DROP COLUMN IF EXISTS payment_status;

-- Drop repair payment functions
DROP FUNCTION IF EXISTS safe_update_customer_payment(UUID, JSONB);
DROP FUNCTION IF EXISTS safe_update_customer_payment_v2(UUID, JSONB);
DROP FUNCTION IF EXISTS create_repair_payment(UUID, UUID, DECIMAL, VARCHAR, UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS update_payment_status(UUID, VARCHAR);

-- Drop repair payment views
DROP VIEW IF EXISTS repair_payments_view;
DROP VIEW IF EXISTS customer_payment_summary;
