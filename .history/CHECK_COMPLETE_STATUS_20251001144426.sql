-- Check complete status of PO: 6f47abb9-3c42-4ff6-abeb-08776d0411e8

SELECT 
    order_number,
    status,
    payment_status,
    total_amount,
    created_at,
    updated_at
FROM lats_purchase_orders
WHERE id = '6f47abb9-3c42-4ff6-abeb-08776d0411e8';

-- Expected: status should be 'completed' after adding to inventory

