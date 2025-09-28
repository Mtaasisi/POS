-- =====================================================
-- REMOVE REMAINING REPAIR PAYMENT COLUMNS
-- =====================================================
-- This script removes any remaining repair payment columns
-- that might still exist in the database

-- Remove repair payment columns from devices table (if they still exist)
ALTER TABLE devices DROP COLUMN IF EXISTS repair_price;
ALTER TABLE devices DROP COLUMN IF EXISTS repair_cost;
ALTER TABLE devices DROP COLUMN IF EXISTS deposit_amount;
ALTER TABLE devices DROP COLUMN IF EXISTS total_paid;
ALTER TABLE devices DROP COLUMN IF EXISTS payment_status;
ALTER TABLE devices DROP COLUMN IF EXISTS outstanding_amount;
ALTER TABLE devices DROP COLUMN IF EXISTS repair_price_quoted;
ALTER TABLE devices DROP COLUMN IF EXISTS repair_cost_actual;
ALTER TABLE devices DROP COLUMN IF EXISTS deposit_required;
ALTER TABLE devices DROP COLUMN IF EXISTS deposit_collected;

-- Remove repair payment columns from customers table (if they still exist)
ALTER TABLE customers DROP COLUMN IF EXISTS total_paid;
ALTER TABLE customers DROP COLUMN IF EXISTS outstanding_balance;
ALTER TABLE customers DROP COLUMN IF EXISTS payment_status;
ALTER TABLE customers DROP COLUMN IF EXISTS repair_payments_total;
ALTER TABLE customers DROP COLUMN IF EXISTS repair_outstanding;

-- Drop any remaining repair payment functions (if they still exist)
DROP FUNCTION IF EXISTS safe_update_customer_payment(UUID, JSONB);
DROP FUNCTION IF EXISTS safe_update_customer_payment_v2(UUID, JSONB);
DROP FUNCTION IF EXISTS create_repair_payment(UUID, UUID, DECIMAL, VARCHAR, UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS update_payment_status(UUID, VARCHAR);
DROP FUNCTION IF EXISTS process_repair_payment(UUID, UUID, DECIMAL, VARCHAR);
DROP FUNCTION IF EXISTS calculate_repair_total(UUID);

-- Drop any remaining repair payment views (if they still exist)
DROP VIEW IF EXISTS repair_payments_view;
DROP VIEW IF EXISTS customer_payment_summary;
DROP VIEW IF EXISTS repair_payment_summary;
DROP VIEW IF EXISTS device_payment_summary;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Remaining repair payment columns and functions have been removed!';
    RAISE NOTICE 'Repair system is now completely free of payment functionality.';
END $$;
