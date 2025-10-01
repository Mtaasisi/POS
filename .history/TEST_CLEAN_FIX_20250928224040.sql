-- Test the clean fix
-- Run this after running CLEAN_RECEIVE_FIX.sql

-- Test with a "sent" order (should work)
SELECT complete_purchase_order_receive(
    '8956fb48-1f2f-43f8-82f9-a526d8485fbd'::UUID,
    auth.uid(),
    'Test receive'
);
