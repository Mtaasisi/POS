-- =====================================================
-- QUICK DATABASE VERIFICATION
-- =====================================================
-- Run this in Supabase SQL Editor to verify your data

-- Your recent Purchase Order ID: 3c6510dc-c025-4a87-9a63-f4083b5b871b
-- Replace with your actual PO ID if different

-- 1. CHECK PURCHASE ORDER STATUS
SELECT 
    order_number,
    status,
    payment_status,
    total_amount,
    created_at,
    updated_at
FROM lats_purchase_orders
WHERE id = '3c6510dc-c025-4a87-9a63-f4083b5b871b';
-- Expected: status = 'completed'

-- 2. CHECK INVENTORY ADJUSTMENTS CREATED
SELECT 
    ia.id,
    ia.quantity as qty_added,
    ia.cost_price,
    ia.reason,
    p.name as product_name,
    pv.name as variant_name,
    ia.created_at
FROM lats_inventory_adjustments ia
LEFT JOIN lats_products p ON ia.product_id = p.id
LEFT JOIN lats_product_variants pv ON ia.variant_id = pv.id
WHERE ia.purchase_order_id = '3c6510dc-c025-4a87-9a63-f4083b5b871b'
AND ia.adjustment_type = 'receive'
ORDER BY ia.created_at DESC;
-- Expected: 1 row with qty_added = 1

-- 3. CHECK PRODUCT VARIANT UPDATED (Selling Price & Stock)
SELECT 
    pv.id,
    p.name as product_name,
    pv.name as variant_name,
    pv.cost_price,
    pv.price as selling_price,
    pv.quantity as stock,
    CASE 
        WHEN pv.cost_price > 0 THEN 
            ROUND(((pv.price - pv.cost_price) / pv.cost_price * 100), 2)
        ELSE 0
    END as profit_margin_percent,
    pv.updated_at
FROM lats_product_variants pv
LEFT JOIN lats_products p ON pv.product_id = p.id
WHERE pv.id IN (
    SELECT variant_id 
    FROM lats_purchase_order_items 
    WHERE purchase_order_id = '3c6510dc-c025-4a87-9a63-f4083b5b871b'
);
-- Expected: 
-- - selling_price > cost_price
-- - profit_margin_percent around 30%
-- - stock increased by 1

-- 4. CHECK QUALITY CHECK CREATED
SELECT 
    qc.id,
    qc.status,
    qc.overall_result,
    t.name as template_name,
    COUNT(qci.id) as total_check_items,
    COUNT(qci.id) FILTER (WHERE qci.result = 'pass') as passed,
    COUNT(qci.id) FILTER (WHERE qci.result = 'fail') as failed,
    qc.created_at
FROM purchase_order_quality_checks qc
LEFT JOIN quality_check_templates t ON qc.template_id = t.id
LEFT JOIN purchase_order_quality_check_items qci ON qci.quality_check_id = qc.id
WHERE qc.purchase_order_id = '3c6510dc-c025-4a87-9a63-f4083b5b871b'
GROUP BY qc.id, qc.status, qc.overall_result, t.name, qc.created_at
ORDER BY qc.created_at DESC;
-- Expected: 1 quality check with overall_result = 'pass'

-- 5. CHECK AUDIT LOG
SELECT 
    action,
    details::text as details_text,
    timestamp
FROM purchase_order_audit
WHERE purchase_order_id = '3c6510dc-c025-4a87-9a63-f4083b5b871b'
ORDER BY timestamp DESC;
-- Expected: Should see 'Added to inventory' action

-- 6. COMPLETE SUMMARY (All in one)
WITH po AS (
    SELECT 
        order_number, 
        status, 
        payment_status,
        total_amount
    FROM lats_purchase_orders 
    WHERE id = '3c6510dc-c025-4a87-9a63-f4083b5b871b'
),
qc AS (
    SELECT COUNT(*) as checks
    FROM purchase_order_quality_checks 
    WHERE purchase_order_id = '3c6510dc-c025-4a87-9a63-f4083b5b871b'
),
inv AS (
    SELECT 
        COUNT(*) as adjustments,
        SUM(quantity) as total_received
    FROM lats_inventory_adjustments 
    WHERE purchase_order_id = '3c6510dc-c025-4a87-9a63-f4083b5b871b'
    AND adjustment_type = 'receive'
),
audit AS (
    SELECT COUNT(*) as logs
    FROM purchase_order_audit 
    WHERE purchase_order_id = '3c6510dc-c025-4a87-9a63-f4083b5b871b'
)
SELECT 
    po.order_number,
    po.status,
    po.payment_status,
    po.total_amount,
    qc.checks as quality_checks,
    inv.adjustments as inventory_records,
    inv.total_received as items_added,
    audit.logs as audit_entries
FROM po
CROSS JOIN qc
CROSS JOIN inv
CROSS JOIN audit;

-- Expected Results:
-- status: 'completed'
-- quality_checks: 1 or more
-- inventory_records: 1
-- items_added: 1
-- audit_entries: Multiple (should include 'Added to inventory')

