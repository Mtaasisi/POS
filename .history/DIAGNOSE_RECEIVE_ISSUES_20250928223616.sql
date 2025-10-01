-- Comprehensive diagnostic script for receive functionality issues
-- This will help identify the exact cause of the 400 error

-- =====================================================
-- STEP 1: CHECK ALL PURCHASE ORDER STATUSES
-- =====================================================

SELECT 
    'All Purchase Orders Status Summary' as section,
    status,
    COUNT(*) as count,
    MAX(updated_at) as latest_update
FROM lats_purchase_orders 
GROUP BY status
ORDER BY status;

-- =====================================================
-- STEP 2: FIND PURCHASE ORDERS THAT CAN BE RECEIVED
-- =====================================================

SELECT 
    'Purchase Orders Ready for Receiving' as section,
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
WHERE po.status IN ('sent', 'confirmed', 'shipped', 'partial_received')
GROUP BY po.id, po.order_number, po.status, po.created_at, po.updated_at
ORDER BY po.updated_at DESC;

-- =====================================================
-- STEP 3: CHECK RECENT AUDIT ENTRIES
-- =====================================================

SELECT 
    'Recent Audit Entries' as section,
    id,
    purchase_order_id,
    action,
    details,
    user_id,
    created_at
FROM lats_purchase_order_audit
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- STEP 4: CHECK FUNCTION EXISTS AND PERMISSIONS
-- =====================================================

SELECT 
    'Function Check' as section,
    routine_name,
    routine_type,
    data_type as return_type,
    routine_definition IS NOT NULL as has_definition
FROM information_schema.routines 
WHERE routine_name = 'complete_purchase_order_receive'
AND routine_schema = 'public';

-- =====================================================
-- STEP 5: CHECK TABLE STRUCTURES
-- =====================================================

SELECT 
    'Table Structure Check' as section,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('lats_purchase_orders', 'lats_purchase_order_items', 'lats_purchase_order_audit')
ORDER BY table_name, ordinal_position;
