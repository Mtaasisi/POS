-- =====================================================
-- VERIFICATION QUERIES FOR DATA FLOW
-- =====================================================
-- Run these queries to verify data is being saved and fetched correctly

-- 1. Check if quality check was created
SELECT 
    qc.id,
    qc.purchase_order_id,
    qc.status,
    qc.overall_result,
    t.name as template_name,
    COUNT(qci.id) as total_items,
    COUNT(qci.id) FILTER (WHERE qci.result = 'pass') as passed_items,
    COUNT(qci.id) FILTER (WHERE qci.result = 'fail') as failed_items
FROM purchase_order_quality_checks qc
LEFT JOIN quality_check_templates t ON qc.template_id = t.id
LEFT JOIN purchase_order_quality_check_items qci ON qci.quality_check_id = qc.id
WHERE qc.purchase_order_id = 'YOUR_PO_ID_HERE'  -- Replace with actual PO ID
GROUP BY qc.id, qc.purchase_order_id, qc.status, qc.overall_result, t.name
ORDER BY qc.created_at DESC;

-- 2. Check inventory adjustments created
SELECT 
    ia.id,
    ia.purchase_order_id,
    ia.adjustment_type,
    ia.quantity,
    ia.cost_price,
    ia.reason,
    p.name as product_name,
    pv.name as variant_name,
    pv.price as current_selling_price,
    pv.quantity as current_stock,
    ia.created_at
FROM lats_inventory_adjustments ia
LEFT JOIN lats_products p ON ia.product_id = p.id
LEFT JOIN lats_product_variants pv ON ia.variant_id = pv.id
WHERE ia.purchase_order_id = 'YOUR_PO_ID_HERE'  -- Replace with actual PO ID
AND ia.adjustment_type = 'receive'
ORDER BY ia.created_at DESC;

-- 3. Check product variants updated with selling prices
SELECT 
    pv.id,
    pv.name as variant_name,
    p.name as product_name,
    pv.price as selling_price,
    pv.cost_price,
    pv.quantity as stock_quantity,
    CASE 
        WHEN pv.cost_price > 0 THEN ROUND(((pv.price - pv.cost_price) / pv.cost_price * 100), 2)
        ELSE 0
    END as profit_margin_percentage,
    pv.updated_at
FROM lats_product_variants pv
LEFT JOIN lats_products p ON pv.product_id = p.id
WHERE pv.id IN (
    SELECT variant_id 
    FROM lats_purchase_order_items 
    WHERE purchase_order_id = 'YOUR_PO_ID_HERE'  -- Replace with actual PO ID
)
ORDER BY pv.updated_at DESC;

-- 4. Check purchase order status
SELECT 
    id,
    order_number,
    status,
    payment_status,
    total_amount,
    created_at,
    updated_at
FROM lats_purchase_orders
WHERE id = 'YOUR_PO_ID_HERE';  -- Replace with actual PO ID

-- 5. Check audit log
SELECT 
    id,
    action,
    details,
    timestamp
FROM purchase_order_audit
WHERE purchase_order_id = 'YOUR_PO_ID_HERE'  -- Replace with actual PO ID
ORDER BY timestamp DESC
LIMIT 10;

-- 6. Verify complete data flow (all in one query)
WITH po_data AS (
    SELECT id, order_number, status FROM lats_purchase_orders WHERE id = 'YOUR_PO_ID_HERE'
),
qc_data AS (
    SELECT COUNT(*) as quality_checks FROM purchase_order_quality_checks WHERE purchase_order_id = 'YOUR_PO_ID_HERE'
),
inv_data AS (
    SELECT COUNT(*) as inventory_adjustments, SUM(quantity) as total_received 
    FROM lats_inventory_adjustments 
    WHERE purchase_order_id = 'YOUR_PO_ID_HERE' AND adjustment_type = 'receive'
),
audit_data AS (
    SELECT COUNT(*) as audit_entries FROM purchase_order_audit WHERE purchase_order_id = 'YOUR_PO_ID_HERE'
)
SELECT 
    po.order_number,
    po.status,
    qc.quality_checks,
    inv.inventory_adjustments,
    inv.total_received as total_items_received,
    audit.audit_entries
FROM po_data po
CROSS JOIN qc_data qc
CROSS JOIN inv_data inv
CROSS JOIN audit_data audit;

-- Expected Results:
-- quality_checks: 1 or more
-- inventory_adjustments: Should match items added
-- total_items_received: Should match quality check passed items
-- audit_entries: Should include 'Added to inventory' action
-- status: Should be 'completed' after adding to inventory

