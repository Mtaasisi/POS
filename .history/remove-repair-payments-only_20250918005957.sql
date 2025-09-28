-- =====================================================
-- REMOVE PAYMENT FUNCTIONALITY ONLY FOR REPAIRS
-- =====================================================
-- This script removes only repair-related payment functionality
-- while preserving other payment systems (POS, purchase orders, etc.)

-- =====================================================
-- 1. REMOVE REPAIR-RELATED PAYMENT TABLES
-- =====================================================

-- Drop only repair-related payment tables
DROP TABLE IF EXISTS customer_payments CASCADE;

-- =====================================================
-- 2. REMOVE REPAIR-RELATED COLUMNS FROM DEVICES TABLE
-- =====================================================

-- Remove only repair payment-related columns from devices table
ALTER TABLE devices DROP COLUMN IF EXISTS repair_price;
ALTER TABLE devices DROP COLUMN IF EXISTS repair_cost;
ALTER TABLE devices DROP COLUMN IF EXISTS deposit_amount;
ALTER TABLE devices DROP COLUMN IF EXISTS total_paid;
ALTER TABLE devices DROP COLUMN IF EXISTS payment_status;
ALTER TABLE devices DROP COLUMN IF EXISTS outstanding_amount;

-- =====================================================
-- 3. REMOVE REPAIR-RELATED COLUMNS FROM CUSTOMERS TABLE
-- =====================================================

-- Remove only repair payment-related columns from customers table
-- (Keep other payment columns that might be used for POS, etc.)
ALTER TABLE customers DROP COLUMN IF EXISTS total_paid;
ALTER TABLE customers DROP COLUMN IF EXISTS outstanding_balance;
ALTER TABLE customers DROP COLUMN IF EXISTS payment_status;

-- =====================================================
-- 4. DROP REPAIR-RELATED PAYMENT FUNCTIONS
-- =====================================================

-- Drop only repair-related payment functions
DROP FUNCTION IF EXISTS safe_update_customer_payment(UUID, JSONB);
DROP FUNCTION IF EXISTS safe_update_customer_payment_v2(UUID, JSONB);
DROP FUNCTION IF EXISTS create_repair_payment(UUID, UUID, DECIMAL, VARCHAR, UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS update_payment_status(UUID, VARCHAR);

-- =====================================================
-- 5. DROP REPAIR-RELATED PAYMENT VIEWS
-- =====================================================

-- Drop only repair-related payment views
DROP VIEW IF EXISTS repair_payments_view;
DROP VIEW IF EXISTS customer_payment_summary;

-- =====================================================
-- 6. REMOVE REPAIR-RELATED TRIGGERS
-- =====================================================

-- Drop only repair-related payment triggers
DROP TRIGGER IF EXISTS update_customer_payments_updated_at ON customer_payments;

-- =====================================================
-- 7. VERIFICATION QUERIES
-- =====================================================

-- Check if repair payment tables still exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('customer_payments');

-- Check if repair payment columns still exist in devices table
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'devices' 
AND table_schema = 'public'
AND (column_name LIKE '%repair_price%' OR column_name LIKE '%repair_cost%' OR column_name LIKE '%deposit%' OR column_name LIKE '%payment_status%');

-- Check if other payment systems are still intact
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('payment_transactions', 'purchase_order_payments', 'payment_methods', 'finance_accounts');

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Repair payment functionality has been removed!';
    RAISE NOTICE 'Other payment systems (POS, purchase orders) remain intact.';
    RAISE NOTICE 'The repair system now works without payment processing.';
END $$;
