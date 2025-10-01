-- =====================================================
-- VERIFY PO PAYMENT FIXES
-- =====================================================
-- Run this script to verify the fixes have been applied correctly

-- Step 1: Check if the PO exists
SELECT 
    'PO Status Check:' as message,
    CASE 
        WHEN COUNT(*) > 0 THEN 'PO Found'
        ELSE 'PO Not Found'
    END as status,
    COUNT(*) as count
FROM lats_purchase_orders 
WHERE id = '1759046163.717814-COPY-1759078416295-COPY-1759078903939'
OR order_number LIKE '%1759046163%';

-- Step 2: Show PO details
SELECT 
    'PO Details:' as message,
    id,
    order_number,
    total_amount,
    currency,
    exchange_rate,
    total_amount_base_currency,
    total_paid,
    payment_status,
    status as po_status,
    created_at,
    updated_at
FROM lats_purchase_orders 
WHERE id = '1759046163.717814-COPY-1759078416295-COPY-1759078903939'
OR order_number LIKE '%1759046163%';

-- Step 3: Show payment details
SELECT 
    'Payment Details:' as message,
    id,
    purchase_order_id,
    amount,
    currency,
    payment_method,
    status,
    payment_date,
    reference,
    notes,
    created_at,
    updated_at
FROM purchase_order_payments 
WHERE purchase_order_id = '1759046163.717814-COPY-1759078416295-COPY-1759078903939'
OR purchase_order_id IN (
    SELECT id FROM lats_purchase_orders 
    WHERE order_number LIKE '%1759046163%'
);

-- Step 4: Show audit trail
SELECT 
    'Audit Trail:' as message,
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

-- Step 5: Check for any remaining issues
SELECT 
    'Issue Check:' as message,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM purchase_order_payments 
            WHERE (purchase_order_id = '1759046163.717814-COPY-1759078416295-COPY-1759078903939'
            OR purchase_order_id IN (
                SELECT id FROM lats_purchase_orders 
                WHERE order_number LIKE '%1759046163%'
            ))
            AND currency = 'USD'
        ) THEN 'Currency still in USD - needs conversion'
        WHEN EXISTS (
            SELECT 1 FROM purchase_order_payments 
            WHERE (purchase_order_id = '1759046163.717814-COPY-1759078416295-COPY-1759078903939'
            OR purchase_order_id IN (
                SELECT id FROM lats_purchase_orders 
                WHERE order_number LIKE '%1759046163%'
            ))
            AND payment_date > NOW()
        ) THEN 'Future timestamp detected - needs correction'
        WHEN EXISTS (
            SELECT 1 FROM purchase_order_payments 
            WHERE (purchase_order_id = '1759046163.717814-COPY-1759078416295-COPY-1759078903939'
            OR purchase_order_id IN (
                SELECT id FROM lats_purchase_orders 
                WHERE order_number LIKE '%1759046163%'
            ))
            AND (reference IS NULL OR reference = '')
        ) THEN 'Missing payment reference'
        ELSE 'No issues detected'
    END as status;
