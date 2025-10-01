-- Test the process_purchase_order_payment RPC function
-- This script tests the function with the same parameters from the logs

-- First, let's check if we have the required data
SELECT 
    'Purchase Order Check' as test_type,
    id,
    order_number,
    status,
    payment_status,
    total_amount,
    total_paid,
    currency
FROM lats_purchase_orders 
WHERE id = 'c6292820-c3aa-4a33-bbfb-5abcc5b0b038';

SELECT 
    'Payment Account Check' as test_type,
    id,
    name,
    balance,
    currency
FROM finance_accounts 
WHERE id = 'deb92580-95dd-4018-9f6a-134b2157716c';

-- Test the RPC function with the exact parameters from the logs
-- Note: This will create a test payment, so use with caution
/*
SELECT process_purchase_order_payment(
    'c6292820-c3aa-4a33-bbfb-5abcc5b0b038'::UUID,  -- purchase_order_id
    'deb92580-95dd-4018-9f6a-134b2157716c'::UUID,  -- payment_account_id
    3.00,                                            -- amount
    'USD',                                          -- currency
    'Cash',                                         -- payment_method
    NULL,                                           -- payment_method_id
    NULL,                                           -- user_id
    NULL,                                           -- reference
    'Test RPC function fix'                         -- notes
);
*/

-- Check recent payments to see if the function is working
SELECT 
    'Recent Payments' as test_type,
    id,
    purchase_order_id,
    amount,
    currency,
    payment_method,
    status,
    created_at
FROM purchase_order_payments 
ORDER BY created_at DESC 
LIMIT 5;

-- Check purchase order status
SELECT 
    'Updated PO Status' as test_type,
    id,
    order_number,
    status,
    payment_status,
    total_paid,
    total_amount,
    currency
FROM lats_purchase_orders 
WHERE id = 'c6292820-c3aa-4a33-bbfb-5abcc5b0b038';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🧪 RPC Payment Function Test Script Ready';
    RAISE NOTICE '📋 To test the function:';
    RAISE NOTICE '   1. Uncomment the SELECT process_purchase_order_payment(...) line';
    RAISE NOTICE '   2. Run the script';
    RAISE NOTICE '   3. Check the results above';
    RAISE NOTICE '⚠️  This will create a test payment - use with caution';
END $$;
