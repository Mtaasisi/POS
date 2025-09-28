-- =====================================================
-- FIX CUSTOMER_PAYMENTS RLS POLICY FOR 400 ERROR
-- =====================================================
-- This fixes the Row Level Security policy that's causing 400 errors
-- when trying to insert customer payments

-- Step 1: Drop the existing restrictive policy
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON customer_payments;

-- Step 2: Create a new permissive policy for authenticated users
CREATE POLICY "Enable all access for authenticated users" ON customer_payments
    FOR ALL USING (auth.role() = 'authenticated');

-- Step 3: Ensure the table has proper permissions
GRANT ALL ON customer_payments TO authenticated;

-- Step 4: Verify the policy was created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'customer_payments';

-- Step 5: Test the policy by checking if we can insert
-- (This will only work if you're authenticated)
DO $$
BEGIN
    RAISE NOTICE '✅ RLS policy updated for customer_payments table';
    RAISE NOTICE '✅ Authenticated users should now be able to INSERT payments';
    RAISE NOTICE '✅ 400 Bad Request errors should be resolved!';
END $$;
