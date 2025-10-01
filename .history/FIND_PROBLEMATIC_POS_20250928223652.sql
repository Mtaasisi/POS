-- Find purchase orders that might be causing the 400 error
-- These are orders that are NOT in "received" status but might be trying to be received

-- =====================================================
-- FIND ORDERS IN NON-RECEIVABLE STATUS
-- =====================================================

SELECT 
    'Orders in Non-Receivable Status' as issue_type,
    po.id,
    po.order_number,
    po.status,
    po.created_at,
    po.updated_at,
    COUNT(poi.id) as total_items,
    SUM(poi.quantity) as total_quantity,
    SUM(COALESCE(poi.received_quantity, 0)) as received_quantity
FROM lats_purchase_orders po
LEFT JOIN lats_purchase_order_items poi ON po.id = poi.purchase_order_id
WHERE po.status NOT IN ('sent', 'confirmed', 'shipped', 'partial_received', 'received', 'completed')
GROUP BY po.id, po.order_number, po.status, po.created_at, po.updated_at
ORDER BY po.updated_at DESC;

-- =====================================================
-- FIND ORDERS WITH PARTIAL RECEIVES
-- =====================================================

SELECT 
    'Orders with Partial Receives' as issue_type,
    po.id,
    po.order_number,
    po.status,
    po.created_at,
    po.updated_at,
    COUNT(poi.id) as total_items,
    SUM(poi.quantity) as total_quantity,
    SUM(COALESCE(poi.received_quantity, 0)) as received_quantity,
    SUM(poi.quantity - COALESCE(poi.received_quantity, 0)) as pending_quantity
FROM lats_purchase_orders po
LEFT JOIN lats_purchase_order_items poi ON po.id = poi.purchase_order_id
WHERE po.status = 'partial_received'
GROUP BY po.id, po.order_number, po.status, po.created_at, po.updated_at
ORDER BY po.updated_at DESC;

-- =====================================================
-- FIND RECENTLY CREATED ORDERS
-- =====================================================

SELECT 
    'Recently Created Orders (Last 24 hours)' as issue_type,
    po.id,
    po.order_number,
    po.status,
    po.created_at,
    po.updated_at,
    COUNT(poi.id) as total_items
FROM lats_purchase_orders po
LEFT JOIN lats_purchase_order_items poi ON po.id = poi.purchase_order_id
WHERE po.created_at > NOW() - INTERVAL '24 hours'
GROUP BY po.id, po.order_number, po.status, po.created_at, po.updated_at
ORDER BY po.created_at DESC;
