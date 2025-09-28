-- Fix Customer ID Constraint Issue
-- This script addresses the customer_id NOT NULL constraint that might be causing issues

-- 1. Check the current constraint
SELECT 
    'Current constraints on lats_sales:' as info,
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE table_name = 'lats_sales' 
  AND constraint_name LIKE '%customer_id%';

-- 2. Remove the NOT NULL constraint on customer_id if it exists
-- (This allows for walk-in customers without a customer record)
DO $$
BEGIN
    -- Check if the constraint exists
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_lats_sales_customer_id_not_null'
    ) THEN
        -- Drop the constraint
        ALTER TABLE lats_sales DROP CONSTRAINT check_lats_sales_customer_id_not_null;
        RAISE NOTICE 'Removed customer_id NOT NULL constraint';
    ELSE
        RAISE NOTICE 'Customer_id NOT NULL constraint does not exist';
    END IF;
    
    -- Also check if there's a NOT NULL constraint on the column itself
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
          AND column_name = 'customer_id' 
          AND is_nullable = 'NO'
    ) THEN
        -- Make the column nullable
        ALTER TABLE lats_sales ALTER COLUMN customer_id DROP NOT NULL;
        RAISE NOTICE 'Made customer_id column nullable';
    ELSE
        RAISE NOTICE 'Customer_id column is already nullable';
    END IF;
END $$;

-- 3. Ensure we have a default walk-in customer
DO $$
DECLARE
    walk_in_customer_id UUID;
BEGIN
    -- Check if walk-in customer exists
    SELECT id INTO walk_in_customer_id 
    FROM customers 
    WHERE name = 'Walk-in Customer' AND phone = '+255000000000'
    LIMIT 1;
    
    IF walk_in_customer_id IS NULL THEN
        -- Create walk-in customer
        INSERT INTO customers (name, phone, email, address, created_by)
        VALUES ('Walk-in Customer', '+255000000000', 'walkin@lats.com', 'Store Location', 'System')
        RETURNING id INTO walk_in_customer_id;
        RAISE NOTICE 'Created walk-in customer with ID: %', walk_in_customer_id;
    ELSE
        RAISE NOTICE 'Walk-in customer already exists with ID: %', walk_in_customer_id;
    END IF;
END $$;

-- 4. Test sale insertion with NULL customer_id
DO $$
DECLARE
    test_sale_id UUID;
BEGIN
    -- Try inserting with NULL customer_id
    INSERT INTO lats_sales (
        sale_number,
        customer_id,
        total_amount,
        payment_method,
        status,
        created_by
    ) VALUES (
        'TEST-NULL-' || EXTRACT(EPOCH FROM NOW())::TEXT,
        NULL, -- This should now work
        100.00,
        '{"type": "cash", "amount": 100.00}',
        'completed',
        'System Test'
    ) RETURNING id INTO test_sale_id;
    
    RAISE NOTICE '✅ Sale with NULL customer_id created successfully with ID: %', test_sale_id;
    
    -- Clean up
    DELETE FROM lats_sales WHERE id = test_sale_id;
    RAISE NOTICE '✅ Test sale cleaned up';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Sale with NULL customer_id failed: %', SQLERRM;
END $$;

-- 5. Show final status
SELECT 'Customer ID constraint fix completed' as status;
SELECT 'Sales should now work with or without customer_id' as note;
