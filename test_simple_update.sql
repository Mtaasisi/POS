-- Test simple update to isolate the problem
-- Run this in your Supabase SQL Editor

-- Check current data
SELECT 
    id,
    name,
    type,
    balance,
    is_payment_method,
    payment_icon,
    payment_color,
    payment_description
FROM finance_accounts 
WHERE id = '4984a987-59d7-4c57-8260-bd401811a18f';

-- Try updating just the name field
UPDATE finance_accounts 
SET name = 'Mobile Money Account (Simple Test)'
WHERE id = '4984a987-59d7-4c57-8260-bd401811a18f'
AND auth.uid() IS NOT NULL;

-- Check if it worked
SELECT 
    id,
    name
FROM finance_accounts 
WHERE id = '4984a987-59d7-4c57-8260-bd401811a18f';

-- Try updating just the payment_icon field
UPDATE finance_accounts 
SET payment_icon = 'smartphone-test'
WHERE id = '4984a987-59d7-4c57-8260-bd401811a18f'
AND auth.uid() IS NOT NULL;

-- Check if it worked
SELECT 
    id,
    name,
    payment_icon
FROM finance_accounts 
WHERE id = '4984a987-59d7-4c57-8260-bd401811a18f';

-- Revert the tests
UPDATE finance_accounts 
SET 
    name = 'Mobile Money Account',
    payment_icon = 'smartphone'
WHERE id = '4984a987-59d7-4c57-8260-bd401811a18f';

-- Final check
SELECT 
    id,
    name,
    payment_icon
FROM finance_accounts 
WHERE id = '4984a987-59d7-4c57-8260-bd401811a18f'; 