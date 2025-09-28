-- Verify permissions for the get_received_items_for_po function
-- This helps diagnose any permission-related issues

-- Check function permissions
SELECT 
    p.proname as function_name,
    p.proacl as access_privileges,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_received_items_for_po'
AND n.nspname = 'public';

-- Check table permissions for authenticated role
SELECT 
    schemaname,
    tablename,
    has_table_privilege('authenticated', schemaname||'.'||tablename, 'SELECT') as can_select,
    has_table_privilege('authenticated', schemaname||'.'||tablename, 'INSERT') as can_insert,
    has_table_privilege('authenticated', schemaname||'.'||tablename, 'UPDATE') as can_update,
    has_table_privilege('authenticated', schemaname||'.'||tablename, 'DELETE') as can_delete
FROM pg_tables 
WHERE tablename IN ('inventory_items', 'lats_products', 'lats_product_variants', 'lats_inventory_adjustments')
AND schemaname = 'public';

-- Check if RLS is enabled on relevant tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    relforcerowsecurity as rls_forced
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname IN ('inventory_items', 'lats_products', 'lats_product_variants', 'lats_inventory_adjustments')
AND n.nspname = 'public';

-- Grant explicit permissions if needed (run these if permissions are missing)
-- GRANT EXECUTE ON FUNCTION get_received_items_for_po(UUID) TO authenticated;
-- GRANT SELECT ON inventory_items TO authenticated;
-- GRANT SELECT ON lats_products TO authenticated;
-- GRANT SELECT ON lats_product_variants TO authenticated;
-- GRANT SELECT ON lats_inventory_adjustments TO authenticated;
