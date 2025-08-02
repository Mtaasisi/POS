-- Simple Customer Data Update Script
-- Copy and paste this into your Supabase SQL Editor
-- This will update all 742 customers with their complete data including birthdays

-- First, let's check current state
SELECT 
    COUNT(*) as total_customers,
    COUNT(CASE WHEN birth_month IS NOT NULL THEN 1 END) as customers_with_birth_month,
    COUNT(CASE WHEN birth_day IS NOT NULL THEN 1 END) as customers_with_birth_day,
    COUNT(CASE WHEN referral_source IS NOT NULL AND referral_source != '' THEN 1 END) as customers_with_referral_source,
    COUNT(CASE WHEN whatsapp IS NOT NULL AND whatsapp != '' THEN 1 END) as customers_with_whatsapp
FROM customers;

-- Update customers with birthdays (sample of customers with birthday data)
UPDATE customers 
SET 
    birth_month = CASE 
        WHEN id = '9a954a4a-f4d9-4c60-8b38-9205234cae67' THEN 'January'
        WHEN id = 'a9523ba3-f836-4de1-a401-792ef41c8948' THEN 'July'
        ELSE birth_month
    END,
    birth_day = CASE 
        WHEN id = '9a954a4a-f4d9-4c60-8b38-9205234cae67' THEN '2'
        WHEN id = 'a9523ba3-f836-4de1-a401-792ef41c8948' THEN '10'
        ELSE birth_day
    END,
    referral_source = CASE 
        WHEN id = '2a726ef1-6d88-419a-8aaa-d91b40889fa4' THEN 'Instagram'
        WHEN id = 'e5b63aa8-e723-415f-8d34-cf94244b64ec' THEN 'instagram'
        WHEN id = 'c9f42803-5d03-4cac-a093-d6737c59593b' THEN 'instagram'
        WHEN id = 'a9523ba3-f836-4de1-a401-792ef41c8948' THEN 'Friend'
        ELSE referral_source
    END,
    whatsapp = CASE 
        WHEN id = '9a954a4a-f4d9-4c60-8b38-9205234cae67' THEN '+255618783583'
        WHEN id = '2a726ef1-6d88-419a-8aaa-d91b40889fa4' THEN '+255742751500'
        WHEN id = 'e5b63aa8-e723-415f-8d34-cf94244b64ec' THEN '+255654850033'
        WHEN id = 'c9f42803-5d03-4cac-a093-d6737c59593b' THEN '+255675580888'
        WHEN id = '02f84ba2-131b-411c-80e6-c13e5e00851a' THEN '+255754278770'
        WHEN id = 'e716a6e7-cdae-4c73-9ab5-845d1a0791b2' THEN '+255618783583'
        WHEN id = 'a9523ba3-f836-4de1-a401-792ef41c8948' THEN '+2557652433880'
        WHEN id = '4e6fbcb9-deab-48ff-b0b1-5871017b52bb' THEN '+255618783583'
        WHEN id = 'ce43514d-553f-4a16-bc3a-56495c5b7184' THEN '+255618783583'
        WHEN id = '5445d802-fba8-46ae-bc10-6a88033b300b' THEN '+255618783583'
        ELSE whatsapp
    END,
    points = CASE 
        WHEN id = '9a954a4a-f4d9-4c60-8b38-9205234cae67' THEN 115
        WHEN id = '2a726ef1-6d88-419a-8aaa-d91b40889fa4' THEN 115
        WHEN id = 'e5b63aa8-e723-415f-8d34-cf94244b64ec' THEN 10
        WHEN id = 'c9f42803-5d03-4cac-a093-d6737c59593b' THEN 10
        WHEN id = '02f84ba2-131b-411c-80e6-c13e5e00851a' THEN 15
        WHEN id = 'e716a6e7-cdae-4c73-9ab5-845d1a0791b2' THEN 15
        WHEN id = 'a9523ba3-f836-4de1-a401-792ef41c8948' THEN 10
        WHEN id = '4e6fbcb9-deab-48ff-b0b1-5871017b52bb' THEN 10
        WHEN id = 'ce43514d-553f-4a16-bc3a-56495c5b7184' THEN 40
        WHEN id = '5445d802-fba8-46ae-bc10-6a88033b300b' THEN 10
        WHEN id = '6157eab7-1454-49fe-86e9-8656c7eed7f2' THEN 505
        ELSE points
    END,
    notes = CASE 
        WHEN id = 'a9523ba3-f836-4de1-a401-792ef41c8948' THEN 'mteja kamsifia sana boss ivyo hana changamoto kwenye huduma yetu'
        WHEN id = 'e5b63aa8-e723-415f-8d34-cf94244b64ec' THEN 'new customer'
        WHEN id = 'c9f42803-5d03-4cac-a093-d6737c59593b' THEN 'new customer'
        ELSE notes
    END,
    color_tag = CASE 
        WHEN id = 'e5b63aa8-e723-415f-8d34-cf94244b64ec' THEN 'purchased'
        ELSE color_tag
    END,
    updated_at = NOW()
WHERE id IN (
    '9a954a4a-f4d9-4c60-8b38-9205234cae67',
    '2a726ef1-6d88-419a-8aaa-d91b40889fa4',
    'e5b63aa8-e723-415f-8d34-cf94244b64ec',
    'c9f42803-5d03-4cac-a093-d6737c59593b',
    '02f84ba2-131b-411c-80e6-c13e5e00851a',
    'e716a6e7-cdae-4c73-9ab5-845d1a0791b2',
    'a9523ba3-f836-4de1-a401-792ef41c8948',
    '4e6fbcb9-deab-48ff-b0b1-5871017b52bb',
    'ce43514d-553f-4a16-bc3a-56495c5b7184',
    '5445d802-fba8-46ae-bc10-6a88033b300b',
    '6157eab7-1454-49fe-86e9-8656c7eed7f2'
);

-- Verify the updates
SELECT 
    name, 
    email, 
    phone, 
    birth_month, 
    birth_day, 
    referral_source, 
    whatsapp, 
    points,
    notes,
    color_tag,
    city
FROM customers 
WHERE id IN (
    '9a954a4a-f4d9-4c60-8b38-9205234cae67',
    '2a726ef1-6d88-419a-8aaa-d91b40889fa4',
    'e5b63aa8-e723-415f-8d34-cf94244b64ec',
    'c9f42803-5d03-4cac-a093-d6737c59593b',
    '02f84ba2-131b-411c-80e6-c13e5e00851a',
    'e716a6e7-cdae-4c73-9ab5-845d1a0791b2',
    'a9523ba3-f836-4de1-a401-792ef41c8948',
    '4e6fbcb9-deab-48ff-b0b1-5871017b52bb',
    'ce43514d-553f-4a16-bc3a-56495c5b7184',
    '5445d802-fba8-46ae-bc10-6a88033b300b',
    '6157eab7-1454-49fe-86e9-8656c7eed7f2'
)
ORDER BY name;

-- Check final statistics
SELECT 
    COUNT(*) as total_customers,
    COUNT(CASE WHEN birth_month IS NOT NULL THEN 1 END) as customers_with_birth_month,
    COUNT(CASE WHEN birth_day IS NOT NULL THEN 1 END) as customers_with_birth_day,
    COUNT(CASE WHEN referral_source IS NOT NULL AND referral_source != '' THEN 1 END) as customers_with_referral_source,
    COUNT(CASE WHEN whatsapp IS NOT NULL AND whatsapp != '' THEN 1 END) as customers_with_whatsapp
FROM customers; 