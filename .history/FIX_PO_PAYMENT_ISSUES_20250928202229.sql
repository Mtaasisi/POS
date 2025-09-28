-- =====================================================
-- FIX PURCHASE ORDER PAYMENT ISSUES
-- =====================================================
-- This script fixes the payment issues identified in PO-1759046163.717814-COPY-1759078416295-COPY-1759078903939

-- Step 1: Check current payment data
SELECT 
    'Current Payment Data:' as message,
    id,
    purchase_order_id,
    amount,
    currency,
    payment_method,
    status,
    payment_date,
    created_at
FROM purchase_order_payments 
WHERE purchase_order_id = '1759046163.717814-COPY-1759078416295-COPY-1759078903939'
ORDER BY created_at DESC;

-- Step 2: Check the purchase order details
SELECT 
    'Purchase Order Details:' as message,
    id,
    order_number,
    total_amount,
    currency,
    status,
    created_at
FROM lats_purchase_orders 
WHERE id = '1759046163.717814-COPY-1759078416295-COPY-1759078903939';

-- Step 3: Fix the payment currency and amount
-- First, let's get the current exchange rate (assuming 1 USD = 2500 TZS as example)
-- You should replace this with the actual exchange rate from your system
UPDATE purchase_order_payments 
SET 
    currency = 'TZS',
    amount = amount * 2500, -- Convert USD to TZS (replace 2500 with actual exchange rate)
    payment_date = NOW(), -- Fix the future timestamp
    updated_at = NOW()
WHERE purchase_order_id = '1759046163.717814-COPY-1759078416295-COPY-1759078903939'
AND currency = 'USD';

-- Step 4: Add missing payment details
UPDATE purchase_order_payments 
SET 
    payment_method = 'Cash',
    payment_method_id = (SELECT id FROM payment_methods WHERE name = 'Cash' LIMIT 1),
    payment_account_id = (SELECT id FROM finance_accounts WHERE name = 'Cash Account' LIMIT 1),
    reference = 'PAY-' || EXTRACT(EPOCH FROM NOW())::BIGINT,
    notes = 'Payment converted from USD to TZS',
    updated_at = NOW()
WHERE purchase_order_id = '1759046163.717814-COPY-1759078416295-COPY-1759078903939';

-- Step 5: Update the purchase order with exchange rate information
UPDATE lats_purchase_orders 
SET 
    exchange_rate = 2500, -- Replace with actual exchange rate
    exchange_rate_source = 'manual',
    exchange_rate_date = NOW(),
    total_amount_base_currency = total_amount * 2500, -- Convert to TZS
    updated_at = NOW()
WHERE id = '1759046163.717814-COPY-1759078416295-COPY-1759078903939'
AND currency = 'USD';

-- Step 6: Update payment status to match PO total
-- First, let's check if the payment amount matches the PO total
WITH po_total AS (
    SELECT total_amount FROM lats_purchase_orders 
    WHERE id = '1759046163.717814-COPY-1759078416295-COPY-1759078903939'
),
payment_total AS (
    SELECT COALESCE(SUM(amount), 0) as total_paid 
    FROM purchase_order_payments 
    WHERE purchase_order_id = '1759046163.717814-COPY-1759078416295-COPY-1759078903939'
    AND status = 'completed'
)
UPDATE lats_purchase_orders 
SET 
    total_paid = (SELECT total_paid FROM payment_total),
    payment_status = CASE 
        WHEN (SELECT total_paid FROM payment_total) = 0 THEN 'unpaid'
        WHEN (SELECT total_paid FROM payment_total) < (SELECT total_amount FROM po_total) THEN 'partial'
        WHEN (SELECT total_paid FROM payment_total) = (SELECT total_amount FROM po_total) THEN 'paid'
        ELSE 'overpaid'
    END,
    updated_at = NOW()
WHERE id = '1759046163.717814-COPY-1759078416295-COPY-1759078903939';

-- Step 7: Create audit trail for the payment fix
INSERT INTO purchase_order_audit (
    purchase_order_id,
    action,
    "user",
    details,
    timestamp
) VALUES (
    '1759046163.717814-COPY-1759078416295-COPY-1759078903939',
    'payment_fixed',
    'system',
    'Fixed payment currency from USD to TZS, updated exchange rate, and corrected payment details',
    NOW()
);

-- Step 8: Verify the fixes
SELECT 
    'Fixed Payment Data:' as message,
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
ORDER BY created_at DESC;

-- Step 9: Verify purchase order updates
SELECT 
    'Updated Purchase Order:' as message,
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
WHERE id = '1759046163.717814-COPY-1759078416295-COPY-1759078903939';

-- Step 10: Show audit trail
SELECT 
    'Audit Trail:' as message,
    action,
    "user",
    details,
    timestamp
FROM purchase_order_audit 
WHERE purchase_order_id = '1759046163.717814-COPY-1759078416295-COPY-1759078903939'
ORDER BY timestamp DESC;
