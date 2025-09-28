-- Test the get_received_items_for_po RPC function
-- Using the purchase order ID from the error logs: a5b9479b-482e-4c64-ae52-51345bcab362

-- Test 1: Check if function exists and is callable
SELECT 
    routine_name,
    routine_type,
    data_type as return_type,
    security_type,
    is_deterministic
FROM information_schema.routines 
WHERE routine_name = 'get_received_items_for_po'
AND routine_schema = 'public';

-- Test 2: Test the function with the specific PO ID from the logs
SELECT * FROM get_received_items_for_po('a5b9479b-482e-4c64-ae52-51345bcab362'::UUID);

-- Test 3: Check if there are any inventory items for this PO
SELECT 
    'inventory_items' as source,
    ii.id,
    ii.product_id,
    ii.serial_number,
    ii.metadata->>'purchase_order_id' as po_id_in_metadata,
    p.name as product_name
FROM inventory_items ii
LEFT JOIN lats_products p ON ii.product_id = p.id
WHERE ii.metadata->>'purchase_order_id' = 'a5b9479b-482e-4c64-ae52-51345bcab362';

-- Test 4: Check if there are any inventory adjustments for this PO
SELECT 
    'inventory_adjustments' as source,
    lia.id,
    lia.product_id,
    lia.quantity,
    lia.adjustment_type,
    lia.purchase_order_id,
    p.name as product_name
FROM lats_inventory_adjustments lia
LEFT JOIN lats_products p ON lia.product_id = p.id
WHERE lia.purchase_order_id = 'a5b9479b-482e-4c64-ae52-51345bcab362'::UUID
AND lia.adjustment_type = 'receive';

-- Test 5: Verify the purchase order exists
SELECT 
    id,
    order_number,
    status,
    payment_status,
    total_amount,
    total_paid
FROM lats_purchase_orders 
WHERE id = 'a5b9479b-482e-4c64-ae52-51345bcab362'::UUID;
