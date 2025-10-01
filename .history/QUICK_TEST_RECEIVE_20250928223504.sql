-- Quick test for the receive function
-- Run this after applying the main fix

-- Test with your specific purchase order
SELECT complete_purchase_order_receive(
    'e5fe9845-0c0f-4b44-b29a-98c54559a5ca'::UUID,  -- Your PO ID
    auth.uid(),  -- Current user ID
    'Test receive after fix'
) as receive_result;
