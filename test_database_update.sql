-- Test database update functionality
-- Run this in your Supabase SQL Editor to test if updates work

-- First, let's see the current data
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

-- Test a simple update
UPDATE finance_accounts 
SET 
    name = 'Mobile Money Account (Test)',
    payment_icon = 'smartphone',
    payment_color = '#DC2626',
    payment_description = 'Mobile money payments (test)'
WHERE id = '4984a987-59d7-4c57-8260-bd401811a18f';

-- Check if the update worked
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

-- Revert the test change
UPDATE finance_accounts 
SET 
    name = 'Mobile Money Account',
    payment_icon = 'smartphone',
    payment_color = '#DC2626',
    payment_description = 'Mobile money payments'
WHERE id = '4984a987-59d7-4c57-8260-bd401811a18f'; 