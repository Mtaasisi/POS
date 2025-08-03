-- Undo RLS policy fixes for loyalty_customers table
-- This script reverts the RLS policies back to their original state

-- Drop the policies we created
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."loyalty_customers";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."loyalty_customers";
DROP POLICY IF EXISTS "Enable update for users based on customer_id" ON "public"."loyalty_customers";
DROP POLICY IF EXISTS "Enable delete for users based on customer_id" ON "public"."loyalty_customers";

-- Drop the policies we created for customer_notes
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."customer_notes";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."customer_notes";
DROP POLICY IF EXISTS "Enable update for users based on customer_id" ON "public"."customer_notes";
DROP POLICY IF EXISTS "Enable delete for users based on customer_id" ON "public"."customer_notes";

-- Revoke the permissions we granted
REVOKE ALL ON "public"."loyalty_customers" FROM "authenticated";
REVOKE ALL ON "public"."loyalty_customers" FROM "service_role";

REVOKE ALL ON "public"."customer_notes" FROM "authenticated";
REVOKE ALL ON "public"."customer_notes" FROM "service_role";

-- If you want to completely disable RLS on these tables (not recommended for production)
-- ALTER TABLE "public"."loyalty_customers" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "public"."customer_notes" DISABLE ROW LEVEL SECURITY;

-- Or if you want to re-enable RLS without any policies (will block all access)
-- ALTER TABLE "public"."loyalty_customers" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "public"."customer_notes" ENABLE ROW LEVEL SECURITY;

-- Note: After running this script, you may need to create appropriate RLS policies
-- or use service_role key for database operations that need to bypass RLS 