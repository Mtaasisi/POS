-- =====================================================
-- FIX SPECIFIC PO PAYMENT ISSUES
-- =====================================================
-- Fix for PO-1759046163.717814-COPY-1759078416295-COPY-1759078903939

-- Step 1: Check if the PO exists and get its details
SELECT 
    'Checking PO Details:' as message,
    id,
    order_number,
    total_amount,
    currency,
    status,
    created_at
FROM lats_purchase_orders 
WHERE id = '1759046163.717814-COPY-1759078416295-COPY-1759078903939'
OR order_number LIKE '%1759046163%';

-- Step 2: Check current payment records
SELECT 
    'Current Payment Records:' as message,
    id,
    purchase_order_id,
    amount,
    currency,
    payment_method,
    status,
    payment_date,
    reference
FROM purchase_order_payments 
WHERE purchase_order_id = '1759046163.717814-COPY-1759078416295-COPY-1759078903939'
OR purchase_order_id IN (
    SELECT id FROM lats_purchase_orders 
    WHERE order_number LIKE '%1759046163%'
);

-- Step 3: Fix the payment if it exists
-- Update payment currency from USD to TZS with proper exchange rate
UPDATE purchase_order_payments 
SET 
    currency = 'TZS',
    amount = CASE 
        WHEN currency = 'USD' THEN amount * 2500 -- Replace 2500 with actual USD to TZS rate
        ELSE amount
    END,
    payment_date = NOW(), -- Fix future timestamp
    payment_method = COALESCE(payment_method, 'Cash'),
    reference = COALESCE(reference, 'PAY-' || EXTRACT(EPOCH FROM NOW())::BIGINT),
    notes = COALESCE(notes, 'Payment converted from USD to TZS'),
    updated_at = NOW()
WHERE purchase_order_id = '1759046163.717814-COPY-1759078416295-COPY-1759078903939'
OR purchase_order_id IN (
    SELECT id FROM lats_purchase_orders 
    WHERE order_number LIKE '%1759046163%'
);

-- Step 4: Update the purchase order with proper currency and exchange rate
UPDATE lats_purchase_orders 
SET 
    currency = 'TZS',
    exchange_rate = 2500, -- Replace with actual exchange rate
    exchange_rate_source = 'manual',
    exchange_rate_date = NOW(),
    total_amount_base_currency = total_amount * 2500, -- Convert to TZS
    updated_at = NOW()
WHERE id = '1759046163.717814-COPY-1759078416295-COPY-1759078903939'
OR order_number LIKE '%1759046163%';

-- Step 5: Update payment status
UPDATE lats_purchase_orders 
SET 
    total_paid = (
        SELECT COALESCE(SUM(amount), 0) 
        FROM purchase_order_payments 
        WHERE purchase_order_id = lats_purchase_orders.id
        AND status = 'completed'
    ),
    payment_status = CASE 
        WHEN total_paid = 0 THEN 'unpaid'
        WHEN total_paid < total_amount THEN 'partial'
        WHEN total_paid = total_amount THEN 'paid'
        ELSE 'overpaid'
    END,
    updated_at = NOW()
WHERE id = '1759046163.717814-COPY-1759078416295-COPY-1759078903939'
OR order_number LIKE '%1759046163%';

-- Step 6: Create audit record
INSERT INTO purchase_order_audit (
    purchase_order_id,
    action,
    "user",
    details,
    timestamp
) 
SELECT 
    id,
    'payment_currency_fixed',
    'system',
    'Fixed payment currency from USD to TZS, updated exchange rate to 2500, and corrected payment details',
    NOW()
FROM lats_purchase_orders 
WHERE id = '1759046163.717814-COPY-1759078416295-COPY-1759078903939'
OR order_number LIKE '%1759046163%';

-- Step 7: Verify the fixes
SELECT 
    'VERIFICATION - Updated PO:' as message,
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
WHERE id = '1759046163.717814-COPY-1759078416295-COPY-1759078903939'
OR order_number LIKE '%1759046163%';

SELECT 
    'VERIFICATION - Updated Payments:' as message,
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
WHERE purchase_order_id = '1759046163.717814-COPY-1759078416295-COPY-1759078903939'
OR purchase_order_id IN (
    SELECT id FROM lats_purchase_orders 
    WHERE order_number LIKE '%1759046163%'
);

-- Step 8: Show audit trail
SELECT 
    'VERIFICATION - Audit Trail:' as message,
    action,
    "user",
    details,
    timestamp
FROM purchase_order_audit 
WHERE purchase_order_id = '1759046163.717814-COPY-1759078416295-COPY-1759078903939'
OR purchase_order_id IN (
    SELECT id FROM lats_purchase_orders 
    WHERE order_number LIKE '%1759046163%'
)
ORDER BY timestamp DESC;
