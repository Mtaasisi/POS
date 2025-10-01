-- Check the status of your specific purchase orders
-- Run this to see what status your purchase orders are in

SELECT 
    po.id,
    po.order_number,
    po.status,
    po.created_at,
    po.updated_at,
    COUNT(poi.id) as total_items,
    COUNT(CASE WHEN poi.received_quantity = poi.quantity THEN 1 END) as fully_received_items,
    COUNT(CASE WHEN poi.received_quantity > 0 AND poi.received_quantity < poi.quantity THEN 1 END) as partially_received_items,
    COUNT(CASE WHEN poi.received_quantity = 0 THEN 1 END) as pending_items
FROM lats_purchase_orders po
LEFT JOIN lats_purchase_order_items poi ON po.id = poi.purchase_order_id
WHERE po.id IN (
    'e5fe9845-0c0f-4b44-b29a-98c54559a5ca',  -- From your data
    'a5b9479b-482e-4c64-ae52-51345bcab362'   -- From your data
)
GROUP BY po.id, po.order_number, po.status, po.created_at, po.updated_at
ORDER BY po.updated_at DESC;
