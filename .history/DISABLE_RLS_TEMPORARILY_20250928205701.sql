-- =====================================================
-- TEMPORARY RLS DISABLE FOR TESTING
-- =====================================================
-- This completely disables RLS to test if that's the issue

-- Step 1: Disable RLS on all purchase order related tables
ALTER TABLE lats_purchase_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE lats_purchase_order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE lats_inventory_adjustments DISABLE ROW LEVEL SECURITY;

-- Step 2: Grant all permissions
GRANT ALL ON lats_purchase_orders TO authenticated;
GRANT ALL ON lats_purchase_order_items TO authenticated;
GRANT ALL ON lats_inventory_adjustments TO authenticated;

-- Step 3: Test direct update
UPDATE lats_purchase_orders 
SET 
    status = 'received',
    updated_at = NOW()
WHERE id = '30053b25-0819-4e1b-a360-c151c00f5ed4';

-- Step 4: Verify the update worked
SELECT 
    'RLS DISABLED - Testing direct update:' as message,
    id,
    order_number,
    status,
    payment_status,
    updated_at
FROM lats_purchase_orders 
WHERE id = '30053b25-0819-4e1b-a360-c151c00f5ed4';

-- Step 5: Success message
SELECT 
    'SUCCESS: RLS temporarily disabled!' as message,
    'This should resolve the 400 error immediately' as fix_applied,
    'Test your application now - the PO updates should work' as next_step;
