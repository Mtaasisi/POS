-- =====================================================
-- PURCHASE ORDER PAYMENT VALIDATION & TESTING
-- =====================================================

-- =====================================================
-- SECTION 1: CHECK PAYMENT FUNCTIONS EXIST
-- =====================================================

SELECT 
    routine_name,
    'EXISTS ✅' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'process_purchase_order_payment',
    'get_purchase_order_payment_summary',
    'get_purchase_order_payment_history'
)
ORDER BY routine_name;

-- Expected: All 3 functions should exist
-- If missing, they need to be created


-- =====================================================
-- SECTION 2: VALIDATE PAYMENT TABLE STRUCTURE
-- =====================================================

-- Check purchase_order_payments table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'purchase_order_payments'
OR table_name = 'purchase_order_payments'
ORDER BY ordinal_position;

-- Check if we're using the correct table name
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_order_payments') 
        THEN 'purchase_order_payments'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_order_payments') 
        THEN 'purchase_order_payments'
        ELSE 'NO PAYMENT TABLE FOUND ❌'
    END as payment_table_name;


-- =====================================================
-- SECTION 3: PAYMENT DATA INTEGRITY CHECKS
-- =====================================================

-- Check for payments with invalid purchase order references
WITH payment_table AS (
    SELECT 'purchase_order_payments' as tbl_name
    WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_order_payments')
    UNION ALL
    SELECT 'purchase_order_payments'
    WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_order_payments')
    LIMIT 1
)
SELECT 
    COUNT(*) as orphaned_payments,
    CASE 
        WHEN COUNT(*) = 0 THEN 'OK ✅'
        ELSE 'Orphaned payments found ⚠️'
    END as status
FROM purchase_order_payments pop
LEFT JOIN lats_purchase_orders po ON pop.purchase_order_id = po.id
WHERE po.id IS NULL;

-- Check for payments with invalid account references
SELECT 
    COUNT(*) as invalid_account_payments,
    CASE 
        WHEN COUNT(*) = 0 THEN 'OK ✅'
        ELSE 'Invalid account references ⚠️'
    END as status
FROM purchase_order_payments pop
LEFT JOIN finance_accounts fa ON pop.payment_account_id = fa.id
WHERE fa.id IS NULL;


-- =====================================================
-- SECTION 4: PAYMENT SUMMARY BY STATUS
-- =====================================================

SELECT 
    status,
    COUNT(*) as payment_count,
    SUM(amount) as total_amount,
    COUNT(DISTINCT purchase_order_id) as unique_purchase_orders,
    MIN(payment_date) as earliest_payment,
    MAX(payment_date) as latest_payment
FROM purchase_order_payments
GROUP BY status
ORDER BY status;


-- =====================================================
-- SECTION 5: PURCHASE ORDER PAYMENT RECONCILIATION
-- =====================================================

-- Compare PO totals with payments received
SELECT 
    po.id,
    po.order_number,
    po.status,
    po.total_amount as po_total,
    COALESCE(SUM(pop.amount), 0) as total_paid,
    po.total_amount - COALESCE(SUM(pop.amount), 0) as remaining,
    ROUND((COALESCE(SUM(pop.amount), 0) / NULLIF(po.total_amount, 0)) * 100, 2) as payment_percentage,
    COUNT(pop.id) as payment_count,
    CASE 
        WHEN COALESCE(SUM(pop.amount), 0) >= po.total_amount THEN 'Fully Paid ✅'
        WHEN COALESCE(SUM(pop.amount), 0) > 0 THEN 'Partially Paid ⏳'
        ELSE 'Unpaid ⚠️'
    END as payment_status
FROM lats_purchase_orders po
LEFT JOIN purchase_order_payments pop ON po.id = pop.purchase_order_id 
    AND pop.status = 'completed'
WHERE po.status NOT IN ('draft', 'cancelled')
GROUP BY po.id, po.order_number, po.status, po.total_amount
ORDER BY po.created_at DESC
LIMIT 20;


-- =====================================================
-- SECTION 6: OVERPAYMENT DETECTION
-- =====================================================

-- Check for purchase orders where payments exceed total amount
SELECT 
    po.id,
    po.order_number,
    po.total_amount,
    SUM(pop.amount) as total_paid,
    SUM(pop.amount) - po.total_amount as overpayment_amount,
    'OVERPAYMENT DETECTED ⚠️' as alert
FROM lats_purchase_orders po
JOIN purchase_order_payments pop ON po.id = pop.purchase_order_id
WHERE pop.status = 'completed'
GROUP BY po.id, po.order_number, po.total_amount
HAVING SUM(pop.amount) > po.total_amount;

-- Expected: Should return 0 rows (no overpayments)


-- =====================================================
-- SECTION 7: FINANCE ACCOUNT BALANCE CHECK
-- =====================================================

-- Verify finance account balances are consistent with payments
SELECT 
    fa.id,
    fa.account_name,
    fa.account_type,
    fa.currency,
    fa.balance as current_balance,
    COALESCE(SUM(pop.amount), 0) as total_payments_made,
    'Account used for PO payments' as note
FROM finance_accounts fa
LEFT JOIN purchase_order_payments pop ON fa.id = pop.payment_account_id
    AND pop.status = 'completed'
GROUP BY fa.id, fa.account_name, fa.account_type, fa.currency, fa.balance
HAVING COUNT(pop.id) > 0
ORDER BY fa.account_name;


-- =====================================================
-- SECTION 8: CURRENCY CONSISTENCY CHECK
-- =====================================================

-- Check for currency mismatches between PO and payments
SELECT 
    po.id,
    po.order_number,
    po.currency as po_currency,
    pop.currency as payment_currency,
    pop.amount,
    pop.notes,
    'Currency mismatch - check for conversion' as alert
FROM lats_purchase_orders po
JOIN purchase_order_payments pop ON po.id = pop.purchase_order_id
WHERE po.currency != pop.currency
AND pop.status = 'completed'
ORDER BY pop.created_at DESC;

-- Expected: If there are currency mismatches, notes should explain conversion


-- =====================================================
-- SECTION 9: RECENT PAYMENT ACTIVITY
-- =====================================================

SELECT 
    pop.id,
    pop.payment_date,
    po.order_number,
    pop.amount,
    pop.currency,
    pop.payment_method,
    pop.status,
    fa.account_name,
    pop.reference,
    NOW() - pop.payment_date as time_ago
FROM purchase_order_payments pop
JOIN lats_purchase_orders po ON pop.purchase_order_id = po.id
LEFT JOIN finance_accounts fa ON pop.payment_account_id = fa.id
WHERE pop.payment_date > NOW() - INTERVAL '30 days'
ORDER BY pop.payment_date DESC
LIMIT 50;


-- =====================================================
-- SECTION 10: PAYMENT METHOD DISTRIBUTION
-- =====================================================

SELECT 
    payment_method,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount,
    MIN(amount) as min_amount,
    MAX(amount) as max_amount,
    COUNT(DISTINCT purchase_order_id) as unique_pos
FROM purchase_order_payments
WHERE status = 'completed'
GROUP BY payment_method
ORDER BY total_amount DESC;


-- =====================================================
-- SECTION 11: TEST SPECIFIC PURCHASE ORDER
-- =====================================================

-- Replace with your actual purchase order ID
DO $$
DECLARE
    test_po_id UUID := '3c6510dc-c025-4a87-9a63-f4083b5b871b';
BEGIN
    RAISE NOTICE '=== Testing Purchase Order: % ===', test_po_id;
    
    -- Get PO details
    RAISE NOTICE 'Purchase Order Details:';
    PERFORM * FROM lats_purchase_orders WHERE id = test_po_id;
    
    -- Get payment summary
    RAISE NOTICE 'Payment Summary:';
    PERFORM * FROM purchase_order_payments WHERE purchase_order_id = test_po_id;
END $$;

-- Manual query for the test PO
SELECT 
    'Purchase Order' as type,
    po.order_number as reference,
    po.total_amount as amount,
    po.currency,
    po.status
FROM lats_purchase_orders po
WHERE po.id = '3c6510dc-c025-4a87-9a63-f4083b5b871b'

UNION ALL

SELECT 
    'Payment' as type,
    pop.reference as reference,
    pop.amount,
    pop.currency,
    pop.status
FROM purchase_order_payments pop
WHERE pop.purchase_order_id = '3c6510dc-c025-4a87-9a63-f4083b5b871b'
ORDER BY type DESC;


-- =====================================================
-- SECTION 12: CREATE MISSING PAYMENT FUNCTIONS (IF NEEDED)
-- =====================================================

-- If functions don't exist, uncomment and run these:

/*
-- Function to process payment with balance update
CREATE OR REPLACE FUNCTION process_purchase_order_payment(
    purchase_order_id_param UUID,
    payment_account_id_param UUID,
    amount_param DECIMAL,
    currency_param VARCHAR(3),
    payment_method_param VARCHAR(50),
    payment_method_id_param UUID,
    user_id_param UUID,
    reference_param TEXT DEFAULT NULL,
    notes_param TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    account_balance DECIMAL;
BEGIN
    -- Get account balance
    SELECT balance INTO account_balance
    FROM finance_accounts
    WHERE id = payment_account_id_param;
    
    -- Check sufficient balance
    IF account_balance < amount_param THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;
    
    -- Create payment record
    INSERT INTO purchase_order_payments (
        purchase_order_id,
        payment_account_id,
        amount,
        currency,
        payment_method,
        payment_method_id,
        reference,
        notes,
        status,
        payment_date,
        created_by
    ) VALUES (
        purchase_order_id_param,
        payment_account_id_param,
        amount_param,
        currency_param,
        payment_method_param,
        payment_method_id_param,
        reference_param,
        notes_param,
        'completed',
        NOW(),
        user_id_param
    );
    
    -- Update account balance
    UPDATE finance_accounts
    SET balance = balance - amount_param,
        updated_at = NOW()
    WHERE id = payment_account_id_param;
    
    -- Update PO paid amount
    UPDATE lats_purchase_orders
    SET paid_amount = COALESCE(paid_amount, 0) + amount_param,
        updated_at = NOW()
    WHERE id = purchase_order_id_param;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get payment summary
CREATE OR REPLACE FUNCTION get_purchase_order_payment_summary(
    purchase_order_id_param UUID
) RETURNS TABLE (
    total_paid DECIMAL,
    payment_count INTEGER,
    last_payment_date TIMESTAMPTZ,
    remaining_amount DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(pop.amount), 0) as total_paid,
        COUNT(pop.id)::INTEGER as payment_count,
        MAX(pop.payment_date) as last_payment_date,
        po.total_amount - COALESCE(SUM(pop.amount), 0) as remaining_amount
    FROM lats_purchase_orders po
    LEFT JOIN purchase_order_payments pop ON po.id = pop.purchase_order_id
        AND pop.status = 'completed'
    WHERE po.id = purchase_order_id_param
    GROUP BY po.total_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION process_purchase_order_payment TO authenticated;
GRANT EXECUTE ON FUNCTION get_purchase_order_payment_summary TO authenticated;
*/


-- =====================================================
-- SUMMARY REPORT
-- =====================================================

SELECT 
    (SELECT COUNT(*) FROM purchase_order_payments) as total_payments,
    (SELECT COUNT(DISTINCT purchase_order_id) FROM purchase_order_payments) as pos_with_payments,
    (SELECT SUM(amount) FROM purchase_order_payments WHERE status = 'completed') as total_amount_paid,
    (SELECT COUNT(*) FROM purchase_order_payments WHERE status = 'pending') as pending_payments,
    (SELECT COUNT(*) FROM purchase_order_payments WHERE status = 'failed') as failed_payments,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'process_purchase_order_payment')
        THEN 'Payment system operational ✅'
        ELSE 'Payment functions missing ⚠️'
    END as system_status;

