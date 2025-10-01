-- =====================================================
-- CHECK THE OTHER PURCHASE ORDER
-- =====================================================
-- From your earlier logs, you had this PO ID:
-- 6f47abb9-3c42-4ff6-abeb-08776d0411e8

-- COMPLETE SUMMARY FOR THIS PO
WITH po AS (
    SELECT 
        order_number, 
        status, 
        payment_status,
        total_amount,
        created_at
    FROM lats_purchase_orders 
    WHERE id = '6f47abb9-3c42-4ff6-abeb-08776d0411e8'
),
qc AS (
    SELECT 
        COUNT(*) as checks,
        MAX(overall_result) as last_result
    FROM purchase_order_quality_checks 
    WHERE purchase_order_id = '6f47abb9-3c42-4ff6-abeb-08776d0411e8'
),
inv AS (
    SELECT 
        COUNT(*) as adjustments,
        SUM(quantity) as total_received
    FROM lats_inventory_adjustments 
    WHERE purchase_order_id = '6f47abb9-3c42-4ff6-abeb-08776d0411e8'
    AND adjustment_type = 'receive'
),
audit AS (
    SELECT COUNT(*) as logs
    FROM purchase_order_audit 
    WHERE purchase_order_id = '6f47abb9-3c42-4ff6-abeb-08776d0411e8'
)
SELECT 
    po.order_number,
    po.status,
    po.payment_status,
    po.total_amount,
    po.created_at,
    qc.checks as quality_checks,
    qc.last_result,
    inv.adjustments as inventory_records,
    inv.total_received as items_added,
    audit.logs as audit_entries
FROM po
CROSS JOIN qc
CROSS JOIN inv
CROSS JOIN audit;

-- If this shows data, then the items were added to THIS PO, not the newer one!

-- Also check inventory adjustments detail
SELECT 
    ia.id,
    ia.quantity as qty_added,
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
WHERE ia.purchase_order_id = '6f47abb9-3c42-4ff6-abeb-08776d0411e8'
AND ia.adjustment_type = 'receive'
ORDER BY ia.created_at DESC
LIMIT 10;

