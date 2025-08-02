-- Comprehensive Customer Data Update Script
-- This script updates all customer information including birthdays, referral sources, and other details

-- First, let's create a temporary table to hold all the backup data
CREATE TEMP TABLE temp_customers_backup (
    id UUID PRIMARY KEY,
    name TEXT,
    email TEXT,
    phone TEXT,
    gender TEXT,
    city TEXT,
    joined_date TIMESTAMP WITH TIME ZONE,
    loyalty_level TEXT,
    color_tag TEXT,
    referred_by UUID,
    total_spent DECIMAL(10,2),
    points INTEGER,
    last_visit TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN,
    whatsapp TEXT,
    referral_source TEXT,
    birth_month TEXT,
    birth_day TEXT,
    customer_tag TEXT,
    notes TEXT,
    total_returns INTEGER,
    profile_image TEXT,
    initial_notes TEXT,
    location_description TEXT,
    national_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Insert all customer data from backup
INSERT INTO temp_customers_backup VALUES
-- Customer 1: Erick
('9a954a4a-f4d9-4c60-8b38-9205234cae67', 'erick', 'erick@gmail.com', '+255 0653808032', 'male', 'Dar es Salaam', '2025-07-18T14:58:17.659+00:00', 'bronze', 'normal', NULL, 0, 115, '2025-07-18T14:58:17.659+00:00', true, '+255618783583', '', 'January', '2', 'normal', '', 0, NULL, NULL, NULL, NULL, '2025-07-24T09:41:09.416+00:00', '2025-07-27T17:52:39.841877+00:00'),

-- Customer 2: Imani rwemanyira
('2a726ef1-6d88-419a-8aaa-d91b40889fa4', 'Imani rwemanyira', 'rwemanyiraemmananuel@gmail.com', '+255742751500', 'male', 'Dar es Salaam', '2025-07-24T08:39:00.872+00:00', 'bronze', 'normal', NULL, 0, 115, '2025-07-24T08:39:00.872+00:00', true, '+255742751500', 'Instagram', NULL, NULL, 'normal', NULL, 0, NULL, NULL, NULL, NULL, '2025-07-24T08:39:02.239841+00:00', '2025-07-27T17:52:39.841877+00:00'),

-- Customer 3: Mbembela
('e5b63aa8-e723-415f-8d34-cf94244b64ec', 'Mbembela', NULL, '+255654850033', 'female', 'Dar es Salaam', '2025-07-28T09:32:08.869+00:00', 'bronze', 'purchased', NULL, 0, 10, '2025-07-28T09:32:08.869+00:00', true, '+255654850033', 'instagram', NULL, NULL, 'normal', NULL, 0, NULL, 'new customer', NULL, NULL, '2025-07-28T09:32:08.869+00:00', '2025-07-28T09:32:08.869+00:00'),

-- Customer 4: Maquiz
('c9f42803-5d03-4cac-a093-d6737c59593b', 'Maquiz', NULL, '+255675580888', 'male', 'Dar es Salaam', '2025-07-28T09:32:08.869+00:00', 'bronze', 'normal', NULL, 0, 10, '2025-07-28T09:32:08.869+00:00', true, '+255675580888', 'instagram', NULL, NULL, 'normal', NULL, 0, NULL, 'new customer', NULL, NULL, '2025-07-28T09:32:08.869+00:00', '2025-07-28T09:32:08.869+00:00'),

-- Customer 5: Mama jab
('02f84ba2-131b-411c-80e6-c13e5e00851a', 'Mama jab', 'mamajab@gmail.com', '+255754278770', 'female', 'Dar es Salaam', '2025-07-17T10:48:40.181+00:00', 'bronze', 'normal', NULL, 0, 15, '2025-07-17T10:48:40.181+00:00', true, '+255754278770', '', NULL, NULL, 'normal', '', 0, NULL, NULL, NULL, NULL, '2025-07-17T10:48:40.865209+00:00', '2025-07-17T10:48:40.865209+00:00'),

-- Customer 6: Mussa
('e716a6e7-cdae-4c73-9ab5-845d1a0791b2', 'mussa', 'mussa12@gmail.com', '+255756710788', 'male', 'Dar es Salaam', '2025-07-18T07:57:44.01+00:00', 'bronze', 'normal', NULL, 0, 15, '2025-07-18T07:57:44.01+00:00', true, '+255618783583', '', NULL, NULL, 'normal', '', 0, NULL, NULL, NULL, NULL, '2025-07-18T07:57:46.306147+00:00', '2025-07-18T07:57:46.306147+00:00'),

-- Customer 7: FRANK
('a9523ba3-f836-4de1-a401-792ef41c8948', 'FRANK', 'frank.peter@spaceme.co.tz', '+255652433880', 'male', 'Dar es Salaam', '2025-07-21T09:26:19.236+00:00', 'bronze', 'normal', NULL, 0, 10, '2025-07-21T09:26:19.236+00:00', true, '+2557652433880', 'Friend', 'July', '10', 'normal', 'mteja kamsifia sana boss ivyo hana changamoto kwenye huduma yetu', 0, NULL, NULL, NULL, NULL, '2025-07-21T09:26:25.8902+00:00', '2025-07-21T09:28:47.462205+00:00'),

-- Customer 8: ABDUL
('4e6fbcb9-deab-48ff-b0b1-5871017b52bb', 'ABDUL', 'abdulrazak22@gmail.com', '+255756432876', 'male', 'Dar es Salaam', '2025-07-18T08:30:21.373+00:00', 'bronze', 'normal', NULL, 0, 10, '2025-07-18T08:30:21.373+00:00', true, '+255618783583', '', NULL, NULL, 'normal', '', 0, NULL, NULL, NULL, NULL, '2025-07-18T08:30:22.03966+00:00', '2025-07-18T08:30:22.03966+00:00'),

-- Customer 9: felix
('ce43514d-553f-4a16-bc3a-56495c5b7184', 'felix', 'felix18@gmail.com', '+255618783583', 'male', 'Dar es Salaam', '2025-07-17T13:31:59.559+00:00', 'bronze', 'normal', NULL, 0, 40, '2025-07-17T13:31:59.559+00:00', true, '+255618783583', '', NULL, NULL, 'normal', '', 0, NULL, NULL, NULL, NULL, '2025-07-17T13:31:59.903951+00:00', '2025-07-17T13:31:59.903951+00:00'),

-- Customer 10: geff
('5445d802-fba8-46ae-bc10-6a88033b300b', 'geff', 'geff34@gmail.com', '+255759945036', 'male', 'Dar es Salaam', '2025-07-18T12:18:01.638+00:00', 'bronze', 'normal', NULL, 0, 10, '2025-07-18T12:18:01.638+00:00', true, '+255618783583', '', NULL, NULL, 'normal', '', 0, NULL, NULL, NULL, NULL, '2025-07-18T12:18:03.317101+00:00', '2025-07-18T12:18:03.317101+00:00'),

-- Customer 11: inauzwa
('6157eab7-1454-49fe-86e9-8656c7eed7f2', 'inauzwa', 'inauzwacare@gmail.com', '+255769601663', 'male', '', '2025-07-17T12:46:08.483+00:00', 'bronze', 'normal', NULL, 0, 505, '2025-07-17T12:46:08.483+00:00', true, '', '', NULL, NULL, 'normal', '', 0, NULL, NULL, NULL, NULL, '2025-07-17T12:46:10.707174+00:00', '2025-07-21T15:35:09.526655+00:00');

-- Update existing customers with comprehensive data
UPDATE customers 
SET 
    name = temp.name,
    email = temp.email,
    phone = temp.phone,
    gender = temp.gender,
    city = temp.city,
    joined_date = temp.joined_date,
    loyalty_level = temp.loyalty_level,
    color_tag = temp.color_tag,
    referred_by = temp.referred_by,
    total_spent = temp.total_spent,
    points = temp.points,
    last_visit = temp.last_visit,
    is_active = temp.is_active,
    whatsapp = temp.whatsapp,
    referral_source = temp.referral_source,
    birth_month = temp.birth_month,
    birth_day = temp.birth_day,
    customer_tag = temp.customer_tag,
    notes = temp.notes,
    total_returns = temp.total_returns,
    profile_image = temp.profile_image,
    initial_notes = temp.initial_notes,
    location_description = temp.location_description,
    national_id = temp.national_id,
    updated_at = NOW()
FROM temp_customers_backup temp
WHERE customers.id = temp.id;

-- Insert new customers that don't exist
INSERT INTO customers (
    id, name, email, phone, gender, city, joined_date, loyalty_level,
    color_tag, referred_by, total_spent, points, last_visit, is_active,
    whatsapp, referral_source, birth_month, birth_day, customer_tag,
    notes, total_returns, profile_image, initial_notes, location_description,
    national_id, created_at, updated_at
)
SELECT 
    temp.id, temp.name, temp.email, temp.phone, temp.gender, temp.city,
    temp.joined_date, temp.loyalty_level, temp.color_tag, temp.referred_by,
    temp.total_spent, temp.points, temp.last_visit, temp.is_active,
    temp.whatsapp, temp.referral_source, temp.birth_month, temp.birth_day,
    temp.customer_tag, temp.notes, temp.total_returns, temp.profile_image,
    temp.initial_notes, temp.location_description, temp.national_id,
    temp.created_at, temp.updated_at
FROM temp_customers_backup temp
WHERE NOT EXISTS (
    SELECT 1 FROM customers WHERE customers.id = temp.id
);

-- Clean up
DROP TABLE temp_customers_backup;

-- Verify the update
SELECT 
    COUNT(*) as total_customers,
    COUNT(CASE WHEN birth_month IS NOT NULL THEN 1 END) as customers_with_birth_month,
    COUNT(CASE WHEN birth_day IS NOT NULL THEN 1 END) as customers_with_birth_day,
    COUNT(CASE WHEN referral_source IS NOT NULL AND referral_source != '' THEN 1 END) as customers_with_referral_source,
    COUNT(CASE WHEN whatsapp IS NOT NULL AND whatsapp != '' THEN 1 END) as customers_with_whatsapp
FROM customers;

-- Show sample updated customers
SELECT 
    name, 
    email, 
    phone, 
    birth_month, 
    birth_day, 
    referral_source, 
    whatsapp, 
    points,
    city
FROM customers 
WHERE birth_month IS NOT NULL OR referral_source IS NOT NULL
ORDER BY name
LIMIT 10; 