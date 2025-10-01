-- =====================================================
-- PO PAYMENT FIX - CONSTRAINT SAFE VERSION
-- =====================================================
-- This version handles the payment_status constraint properly

-- Step 1: Check current PO status
SELECT 
    'STEP 1 - Current PO Status:' as message,
    id,
    order_number,
    total_amount,
    currency,
    status,
    payment_status,
    total_paid,
    created_at
FROM lats_purchase_orders 
WHERE order_number LIKE '%1759046163%'
LIMIT 5;

-- Step 2: Check current payments
SELECT 
    'STEP 2 - Current Payments:' as message,
    id,
    purchase_order_id,
    amount,
    currency,
    payment_method,
    status,
    payment_date
FROM purchase_order_payments 
WHERE purchase_order_id IN (
    SELECT id FROM lats_purchase_orders 
    WHERE order_number LIKE '%1759046163%'
)
LIMIT 5;

-- Step 3: Fix currency conversion (USD to TZS) - SAFE VERSION
UPDATE purchase_order_payments 
SET 
    currency = 'TZS',
    amount = CASE 
        WHEN currency = 'USD' THEN amount * 2500 -- Update 2500 with actual USD to TZS rate
        ELSE amount
    END,
    payment_date = NOW(),
    payment_method = COALESCE(payment_method, 'Cash'),
    reference = COALESCE(reference, 'PAY-' || EXTRACT(EPOCH FROM NOW())::BIGINT),
    notes = COALESCE(notes, 'Payment converted from USD to TZS'),
    updated_at = NOW()
WHERE purchase_order_id IN (
    SELECT id FROM lats_purchase_orders 
    WHERE order_number LIKE '%1759046163%'
)
AND currency = 'USD';

-- Step 4: Update purchase order with exchange rate
UPDATE lats_purchase_orders 
SET 
    currency = 'TZS',
    exchange_rate = 2500, -- Update with actual exchange rate
    exchange_rate_source = 'manual',
    exchange_rate_date = NOW(),
    total_amount_base_currency = total_amount * 2500,
    updated_at = NOW()
WHERE order_number LIKE '%1759046163%'
AND currency = 'USD';

-- Step 5: Update payment status - CONSTRAINT SAFE VERSION
-- First, update total_paid
UPDATE lats_purchase_orders 
SET 
    total_paid = (
        SELECT COALESCE(SUM(amount), 0) 
        FROM purchase_order_payments 
        WHERE purchase_order_id = lats_purchase_orders.id
        AND status = 'completed'
    ),
    updated_at = NOW()
WHERE order_number LIKE '%1759046163%';

-- Then, update payment_status with safe constraint values
UPDATE lats_purchase_orders 
SET 
    payment_status = CASE 
        WHEN total_paid = 0 THEN 'unpaid'
        WHEN total_paid < total_amount THEN 'partial'
        WHEN total_paid >= total_amount THEN 'paid'
        ELSE 'paid' -- Default to 'paid' instead of 'overpaid'
    END,
    updated_at = NOW()
WHERE order_number LIKE '%1759046163%';

-- Step 6: Create audit record
INSERT INTO purchase_order_audit (
    purchase_order_id,
    action,
    details,
    user_id,
    created_by,
    timestamp
) 
SELECT 
    id,
    'payment_currency_fixed',
    '{"message": "Fixed payment currency from USD to TZS, updated exchange rate to 2500"}'::jsonb,
    NULL, -- user_id (system action)
    NULL, -- created_by (system action)
    NOW()
FROM lats_purchase_orders 
WHERE order_number LIKE '%1759046163%';

-- Step 7: Final verification
SELECT 
    'FINAL VERIFICATION - Updated PO:' as message,
    id,
    order_number,
    total_amount,
    currency,
    exchange_rate,
    total_amount_base_currency,
    total_paid,
    payment_status,
    updated_at
FROM lats_purchase_orders 
WHERE order_number LIKE '%1759046163%';

SELECT 
    'FINAL VERIFICATION - Updated Payments:' as message,
    id,
    purchase_order_id,
    amount,
    currency,
    payment_method,
    status,
    payment_date,
    reference,
    notes
FROM purchase_order_payments 
WHERE purchase_order_id IN (
    SELECT id FROM lats_purchase_orders 
    WHERE order_number LIKE '%1759046163%'
);

-- Step 8: Show audit trail
SELECT 
    'AUDIT TRAIL:' as message,
    action,
    user_id,
    created_by,
    details,
    timestamp
FROM purchase_order_audit 
WHERE purchase_order_id IN (
    SELECT id FROM lats_purchase_orders 
    WHERE order_number LIKE '%1759046163%'
)
ORDER BY timestamp DESC;
