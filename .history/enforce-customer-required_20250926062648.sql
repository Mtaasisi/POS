-- Enforce Customer Required for Sales
-- This script ensures that customer_id is required for all sales

-- 1. Check current customer_id constraint
SELECT 
    'Current customer_id constraints:' as info,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'lats_sales' 
  AND (tc.constraint_name LIKE '%customer%' OR cc.check_clause LIKE '%customer_id%');

-- 2. Check if customer_id column is nullable
SELECT 
    'Customer ID column info:' as info,
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lats_sales' 
  AND column_name = 'customer_id';

-- 3. Make customer_id NOT NULL (if not already)
ALTER TABLE lats_sales ALTER COLUMN customer_id SET NOT NULL;

-- 4. Add a check constraint to ensure customer_id is never NULL
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        WHERE tc.table_name = 'lats_sales' 
        AND tc.constraint_name = 'chk_customer_id_required'
    ) THEN
        ALTER TABLE lats_sales ADD CONSTRAINT chk_customer_id_required CHECK (customer_id IS NOT NULL);
        RAISE NOTICE 'Added customer_id required constraint';
    ELSE
        RAISE NOTICE 'Customer_id required constraint already exists';
    END IF;
END $$;

-- 5. Update any existing sales with NULL customer_id (if any exist)
-- First check if there are any NULL customer_ids
SELECT 
    'Sales with NULL customer_id (should be 0):' as info,
    COUNT(*) as count
FROM lats_sales 
WHERE customer_id IS NULL;

-- If there are any NULL customer_ids, update them to the walk-in customer
DO $$
DECLARE
    walk_in_customer_id UUID;
    null_count INTEGER;
BEGIN
    -- Count NULL customer_ids
    SELECT COUNT(*) INTO null_count FROM lats_sales WHERE customer_id IS NULL;
    
    IF null_count > 0 THEN
        -- Get or create walk-in customer
        SELECT id INTO walk_in_customer_id 
        FROM customers 
        WHERE name = 'Walk-in Customer' AND phone = '+255000000000'
        LIMIT 1;
        
        IF walk_in_customer_id IS NULL THEN
            -- Create walk-in customer
            INSERT INTO customers (
                name, 
                phone, 
                email,
                color_tag,
                gender,
                loyalty_level,
                created_by
            ) VALUES (
                'Walk-in Customer', 
                '+255000000000', 
                'walkin@lats.com',
                'new',
                'other',
                'bronze',
                'System'
            ) RETURNING id INTO walk_in_customer_id;
        END IF;
        
        -- Update NULL customer_ids
        UPDATE lats_sales 
        SET customer_id = walk_in_customer_id 
        WHERE customer_id IS NULL;
        
        RAISE NOTICE 'Updated % sales with NULL customer_id to walk-in customer', null_count;
    ELSE
        RAISE NOTICE 'No sales with NULL customer_id found';
    END IF;
END $$;

-- 6. Verify the constraint is working
SELECT 
    'Final customer_id constraints:' as info,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'lats_sales' 
  AND tc.constraint_name = 'chk_customer_id_required';

-- 7. Test that NULL customer_id is rejected
DO $$
BEGIN
    -- Try to insert with NULL customer_id (should fail)
    BEGIN
        INSERT INTO lats_sales (
            sale_number,
            customer_id,
            total_amount,
            payment_method,
            status,
            created_by
        ) VALUES (
            'TEST-NULL-' || EXTRACT(EPOCH FROM NOW())::TEXT,
            NULL, -- This should fail
            100.00,
            '{"type": "cash", "amount": 100.00}',
            'completed',
            'System Test'
        );
        
        RAISE NOTICE '❌ ERROR: NULL customer_id was allowed - constraint not working!';
        
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE '✅ SUCCESS: NULL customer_id correctly rejected by constraint';
    WHEN OTHERS THEN
        RAISE NOTICE '✅ SUCCESS: NULL customer_id rejected (error: %)', SQLERRM;
    END;
END $$;

-- 8. Final status
SELECT '🎉 Customer requirement enforcement completed!' as status;
SELECT 'All sales now require a customer to be selected' as note;
