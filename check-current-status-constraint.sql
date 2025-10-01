-- Check the current status constraint on lats_purchase_orders table
-- Run this to see what constraint is currently active

-- Method 1: Check constraint definition
SELECT 
    constraint_name, 
    check_clause,
    constraint_schema
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%purchase_order%status%'
   OR constraint_name LIKE '%lats_purchase_orders%'
ORDER BY constraint_name;

-- Method 2: Get all constraints on the table
SELECT
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
INNER JOIN pg_class rel ON rel.oid = con.conrelid
INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'lats_purchase_orders'
  AND con.contype = 'c'  -- 'c' = check constraint
ORDER BY con.conname;

-- Method 3: Current status values in use
SELECT 
    status, 
    COUNT(*) as count,
    CASE 
        WHEN status IN ('draft', 'sent', 'received', 'cancelled') THEN 'In old constraint'
        WHEN status IN ('draft', 'pending_approval', 'approved', 'sent', 'confirmed', 'shipped', 'partial_received', 'received', 'quality_checked', 'completed', 'cancelled') THEN 'In new constraint'
        ELSE 'NOT in any constraint'
    END as constraint_status
FROM lats_purchase_orders
GROUP BY status
ORDER BY count DESC;

