-- Fix RLS policies for loyalty_customers table
-- This script enables proper access to loyalty_customers table

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."loyalty_customers";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."loyalty_customers";
DROP POLICY IF EXISTS "Enable update for users based on customer_id" ON "public"."loyalty_customers";
DROP POLICY IF EXISTS "Enable delete for users based on customer_id" ON "public"."loyalty_customers";

-- Create new policies
CREATE POLICY "Enable read access for all users" ON "public"."loyalty_customers"
FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."loyalty_customers"
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on customer_id" ON "public"."loyalty_customers"
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for users based on customer_id" ON "public"."loyalty_customers"
FOR DELETE USING (auth.role() = 'authenticated');

-- Alternative: Disable RLS temporarily for bulk operations
-- ALTER TABLE "public"."loyalty_customers" DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS after bulk operations
-- ALTER TABLE "public"."loyalty_customers" ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON "public"."loyalty_customers" TO "authenticated";
GRANT ALL ON "public"."loyalty_customers" TO "service_role";

-- Also fix customer_notes table RLS for adding notes
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."customer_notes";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."customer_notes";
DROP POLICY IF EXISTS "Enable update for users based on customer_id" ON "public"."customer_notes";
DROP POLICY IF EXISTS "Enable delete for users based on customer_id" ON "public"."customer_notes";

CREATE POLICY "Enable read access for all users" ON "public"."customer_notes"
FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."customer_notes"
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on customer_id" ON "public"."customer_notes"
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for users based on customer_id" ON "public"."customer_notes"
FOR DELETE USING (auth.role() = 'authenticated');

GRANT ALL ON "public"."customer_notes" TO "authenticated";
GRANT ALL ON "public"."customer_notes" TO "service_role"; 