-- Customer Name Cleanup Script
-- This script cleans customer names by removing unwanted patterns like "w 255754254049"
-- Based on analysis showing 8 customers with "w" prefix + number pattern

-- First, let's see what we're working with
SELECT 
    id,
    name as original_name,
    phone,
    CASE 
        WHEN name ~ '^(.+?)\s+w\s+\d+$' THEN regexp_replace(name, '^(.+?)\s+w\s+\d+$', '\1')
        WHEN name ~ '^(.+?)\s+w$' THEN regexp_replace(name, '^(.+?)\s+w$', '\1')
        WHEN name ~ '^(.+?)\s+\d{10,15}$' THEN regexp_replace(name, '^(.+?)\s+\d{10,15}$', '\1')
        ELSE name
    END as cleaned_name
FROM customers 
WHERE name ~ '^(.+?)\s+w\s+\d+$' 
   OR name ~ '^(.+?)\s+w$'
   OR name ~ '^(.+?)\s+\d{10,15}$'
ORDER BY name;

-- Update customers with "w" prefix + number pattern (like "Andrew w 255754254049")
UPDATE customers 
SET 
    name = regexp_replace(name, '^(.+?)\s+w\s+\d+$', '\1'),
    updated_at = NOW()
WHERE name ~ '^(.+?)\s+w\s+\d+$';

-- Update customers with "w" prefix only
UPDATE customers 
SET 
    name = regexp_replace(name, '^(.+?)\s+w$', '\1'),
    updated_at = NOW()
WHERE name ~ '^(.+?)\s+w$';

-- Update customers with mobile number suffix (10-15 digits)
UPDATE customers 
SET 
    name = regexp_replace(name, '^(.+?)\s+\d{10,15}$', '\1'),
    updated_at = NOW()
WHERE name ~ '^(.+?)\s+\d{10,15}$';

-- Clean up any remaining multiple spaces
UPDATE customers 
SET 
    name = regexp_replace(name, '\s{2,}', ' ', 'g'),
    updated_at = NOW()
WHERE name ~ '\s{2,}';

-- Trim whitespace from all names
UPDATE customers 
SET 
    name = trim(name),
    updated_at = NOW()
WHERE name != trim(name);

-- Show the results after cleanup
SELECT 
    COUNT(*) as total_customers,
    COUNT(CASE WHEN name ~ '^(.+?)\s+w\s+\d+$' THEN 1 END) as remaining_w_prefix_number,
    COUNT(CASE WHEN name ~ '^(.+?)\s+w$' THEN 1 END) as remaining_w_prefix_only,
    COUNT(CASE WHEN name ~ '^(.+?)\s+\d{10,15}$' THEN 1 END) as remaining_mobile_suffix,
    COUNT(CASE WHEN name ~ '\s{2,}' THEN 1 END) as remaining_multiple_spaces
FROM customers;
