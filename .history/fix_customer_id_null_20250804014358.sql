-- Fix customer_id to allow NULL values
-- Run this in your Supabase SQL Editor

-- Check current customer_id constraint
SELECT 
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sales_orders' 
AND column_name = 'customer_id';

-- Make customer_id nullable if it's not already
DO $$
BEGIN
    -- Check if customer_id is NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sales_orders' 
        AND column_name = 'customer_id' 
        AND is_nullable = 'NO'
    ) THEN
        -- Make it nullable
        ALTER TABLE sales_orders ALTER COLUMN customer_id DROP NOT NULL;
        RAISE NOTICE 'Made customer_id nullable';
    ELSE
        RAISE NOTICE 'customer_id is already nullable';
    END IF;
END $$;

-- Test insert with NULL customer_id
DO $$
DECLARE
    test_location_id UUID;
    test_order_id UUID;
BEGIN
    -- Get the first location
    SELECT id INTO test_location_id FROM locations LIMIT 1;
    
    -- Test insert with NULL customer_id
    INSERT INTO sales_orders (
        customer_id,
        total_amount,
        final_amount,
        payment_method,
        customer_type,
        location_id,
        created_by,
        status
    ) VALUES (
        NULL, -- NULL customer_id
        100.00,
        100.00,
        'card',
        'retail',
        test_location_id,
        gen_random_uuid(),
        'completed'
    ) RETURNING id INTO test_order_id;
    
    RAISE NOTICE '✅ Test insert with NULL customer_id successful! Order ID: %', test_order_id;
    
    -- Clean up test data
    DELETE FROM sales_orders WHERE id = test_order_id;
    
    RAISE NOTICE '✅ customer_id NULL test completed successfully!';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Error during test: %', SQLERRM;
END $$; 