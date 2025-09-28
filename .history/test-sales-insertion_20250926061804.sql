-- Test Sales Insertion
-- This script will help identify the exact issue with sales insertion

-- 1. Check current table structure
SELECT 
    'Current lats_sales columns:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lats_sales' 
ORDER BY ordinal_position;

-- 2. Check if customers table exists and has data
SELECT 
    'Customers table check:' as info,
    COUNT(*) as customer_count
FROM customers;

-- 3. Check if we have a walk-in customer
SELECT 
    'Walk-in customer check:' as info,
    id,
    name,
    phone
FROM customers 
WHERE name = 'Walk-in Customer' 
   OR phone = '+255000000000'
LIMIT 1;

-- 4. Test minimal sale insertion
DO $$
DECLARE
    test_sale_id UUID;
    walk_in_customer_id UUID;
BEGIN
    -- Get or create walk-in customer
    SELECT id INTO walk_in_customer_id 
    FROM customers 
    WHERE name = 'Walk-in Customer' AND phone = '+255000000000'
    LIMIT 1;
    
    IF walk_in_customer_id IS NULL THEN
        INSERT INTO customers (name, phone, email, address, created_by)
        VALUES ('Walk-in Customer', '+255000000000', 'walkin@lats.com', 'Store Location', 'System Test')
        RETURNING id INTO walk_in_customer_id;
        RAISE NOTICE 'Created walk-in customer with ID: %', walk_in_customer_id;
    ELSE
        RAISE NOTICE 'Found existing walk-in customer with ID: %', walk_in_customer_id;
    END IF;
    
    -- Try minimal sale insertion
    BEGIN
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
        
        RAISE NOTICE '✅ Minimal sale created successfully with ID: %', test_sale_id;
        
        -- Clean up
        DELETE FROM lats_sales WHERE id = test_sale_id;
        RAISE NOTICE '✅ Test sale cleaned up';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Minimal sale failed: %', SQLERRM;
    END;
    
    -- Try sale with additional columns
    BEGIN
        INSERT INTO lats_sales (
            sale_number,
            customer_id,
            total_amount,
            payment_method,
            status,
            created_by,
            subtotal,
            discount_amount,
            discount_type,
            discount_value,
            customer_name,
            customer_phone,
            tax,
            notes
        ) VALUES (
            'TEST-FULL-' || EXTRACT(EPOCH FROM NOW())::TEXT,
            walk_in_customer_id,
            90.00,
            '{"type": "cash", "amount": 90.00}',
            'completed',
            'System Test',
            100.00,
            10.00,
            'fixed',
            10.00,
            'Test Customer',
            '+255700000000',
            0.00,
            'Test sale with all fields'
        ) RETURNING id INTO test_sale_id;
        
        RAISE NOTICE '✅ Full sale created successfully with ID: %', test_sale_id;
        
        -- Clean up
        DELETE FROM lats_sales WHERE id = test_sale_id;
        RAISE NOTICE '✅ Full test sale cleaned up';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Full sale failed: %', SQLERRM;
    END;
    
END $$;

-- 5. Show final status
SELECT 'Test completed - check the NOTICE messages above for results' as status;
