-- Fix column sizes for payment icons
-- Run this in your Supabase SQL Editor

-- Fix the payment_icon column size to handle longer URLs
ALTER TABLE finance_accounts 
ALTER COLUMN payment_icon TYPE VARCHAR(500);

-- Also increase payment_description if needed
ALTER TABLE finance_accounts 
ALTER COLUMN payment_description TYPE VARCHAR(1000);

-- Verify the changes
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'finance_accounts' 
AND column_name IN ('payment_icon', 'payment_description')
ORDER BY column_name;

-- Test with a long URL
UPDATE finance_accounts 
SET payment_icon = 'https://www.axian-telecom.com/cirdowee/2024/11/Axian-Telecom_Landing-_Landing-Page_602x412.png'
WHERE id = '4984a987-59d7-4c57-8260-bd401811a18f';

-- Check if it worked
SELECT 
    id,
    name,
    payment_icon
FROM finance_accounts 
WHERE id = '4984a987-59d7-4c57-8260-bd401811a18f'; 