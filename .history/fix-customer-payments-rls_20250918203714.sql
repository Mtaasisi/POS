-- Fix RLS policies for customer_payments table
-- This ensures authenticated users can access the table

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON customer_payments;

-- Create a more permissive policy for authenticated users
CREATE POLICY "Enable all access for authenticated users" ON customer_payments
    FOR ALL USING (auth.role() = 'authenticated');

-- Also create a policy for anonymous users to read data (if needed)
CREATE POLICY "Enable read access for anonymous users" ON customer_payments
    FOR SELECT USING (true);

-- Grant necessary permissions
GRANT ALL ON customer_payments TO authenticated;
GRANT SELECT ON customer_payments TO anon;

-- Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'customer_payments' 
AND schemaname = 'public';
