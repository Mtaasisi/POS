-- Fix Walk-in Customer Creation
-- This script creates a walk-in customer without using non-existent columns

-- 1. Check current customers table structure
SELECT 
    'Current customers table columns:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;

-- 2. Create walk-in customer with only existing columns
DO $$
DECLARE
    walk_in_customer_id UUID;
BEGIN
    -- Check if walk-in customer already exists
    SELECT id INTO walk_in_customer_id 
    FROM customers 
    WHERE name = 'Walk-in Customer' AND phone = '+255000000000'
    LIMIT 1;
    
    IF walk_in_customer_id IS NULL THEN
        -- Create walk-in customer with minimal required fields
        INSERT INTO customers (
            name, 
            phone, 
            email, 
            created_by
        ) VALUES (
            'Walk-in Customer', 
            '+255000000000', 
            'walkin@lats.com', 
            'System'
        ) RETURNING id INTO walk_in_customer_id;
        
        RAISE NOTICE '✅ Created walk-in customer with ID: %', walk_in_customer_id;
    ELSE
        RAISE NOTICE '✅ Walk-in customer already exists with ID: %', walk_in_customer_id;
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Error creating walk-in customer: %', SQLERRM;
    
    -- Try with even more minimal fields if the above fails
    BEGIN
        INSERT INTO customers (
            name, 
            phone
        ) VALUES (
            'Walk-in Customer', 
            '+255000000000'
        ) RETURNING id INTO walk_in_customer_id;
        
        RAISE NOTICE '✅ Created walk-in customer (minimal) with ID: %', walk_in_customer_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Failed to create walk-in customer even with minimal fields: %', SQLERRM;
    END;
END $$;

-- 3. Verify the walk-in customer was created
SELECT 
    'Walk-in customer verification:' as info,
    id,
    name,
    phone,
    email,
    created_by,
    created_at
FROM customers 
WHERE name = 'Walk-in Customer' AND phone = '+255000000000';

-- 4. Test sale insertion with the walk-in customer
DO $$
DECLARE
    test_sale_id UUID;
    walk_in_customer_id UUID;
BEGIN
    -- Get walk-in customer ID
    SELECT id INTO walk_in_customer_id 
    FROM customers 
    WHERE name = 'Walk-in Customer' AND phone = '+255000000000'
    LIMIT 1;
    
    IF walk_in_customer_id IS NOT NULL THEN
        -- Test sale insertion
        INSERT INTO lats_sales (
            sale_number,
            customer_id,
            total_amount,
            payment_method,
            status,
            created_by
        ) VALUES (
            'TEST-' || EXTRACT(EPOCH FROM NOW())::TEXT,
            walk_in_customer_id,
            100.00,
            '{"type": "cash", "amount": 100.00}',
            'completed',
            'System Test'
        ) RETURNING id INTO test_sale_id;
        
        RAISE NOTICE '✅ Test sale created successfully with ID: %', test_sale_id;
        
        -- Clean up test sale
        DELETE FROM lats_sales WHERE id = test_sale_id;
        RAISE NOTICE '✅ Test sale cleaned up';
        
    ELSE
        RAISE NOTICE '❌ No walk-in customer found - cannot test sale insertion';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Test sale failed: %', SQLERRM;
END $$;

-- 5. Final status
SELECT '🎉 Walk-in customer fix completed!' as status;
