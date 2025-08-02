-- SQL script to update customers from backup data
-- This script should be run with admin privileges to bypass RLS

-- First, let's create a temporary table to hold the backup data
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

-- Insert the backup data into the temporary table
-- You'll need to replace this with actual data from your backup file
INSERT INTO temp_customers_backup VALUES
-- Example data (replace with actual data from your backup)
('9a954a4a-f4d9-4c60-8b38-9205234cae67', 'erick', 'erick@gmail.com', '+255 0653808032', 'male', 'Dar es Salaam', '2025-07-18T14:58:17.659+00:00', 'bronze', 'normal', NULL, 0, 115, '2025-07-18T14:58:17.659+00:00', true, '+255618783583', '', 'January', '2', 'normal', '', 0, NULL, NULL, NULL, NULL, '2025-07-24T09:41:09.416+00:00', '2025-07-27T17:52:39.841877+00:00'),
('2a726ef1-6d88-419a-8aaa-d91b40889fa4', 'Imani rwemanyira', 'rwemanyiraemmananuel@gmail.com', '+255742751500', 'male', 'Dar es Salaam', '2025-07-24T08:39:00.872+00:00', 'bronze', 'normal', NULL, 0, 115, '2025-07-24T08:39:00.872+00:00', true, '+255742751500', 'Instagram', NULL, NULL, 'normal', NULL, 0, NULL, NULL, NULL, NULL, '2025-07-24T08:39:02.239841+00:00', '2025-07-27T17:52:39.841877+00:00'),
('e5b63aa8-e723-415f-8d34-cf94244b64ec', 'Mbembela', NULL, '+255654850033', 'female', 'Dar es Salaam', '2025-07-28T09:32:08.869+00:00', 'bronze', 'purchased', NULL, 0, 10, '2025-07-28T09:32:08.869+00:00', true, '+255654850033', 'instagram', NULL, NULL, 'normal', NULL, 0, NULL, 'new customer', NULL, NULL, '2025-07-28T09:32:08.869+00:00', '2025-07-28T09:32:08.869+00:00');

-- Update existing customers or insert new ones
INSERT INTO customers (
    id, name, email, phone, gender, city, joined_date, loyalty_level, 
    color_tag, referred_by, total_spent, points, last_visit, is_active,
    whatsapp, referral_source, birth_month, birth_day, customer_tag,
    notes, total_returns, profile_image, initial_notes, location_description,
    national_id, created_at, updated_at
)
SELECT 
    id, name, email, phone, gender, city, joined_date, loyalty_level,
    color_tag, referred_by, total_spent, points, last_visit, is_active,
    whatsapp, referral_source, birth_month, birth_day, customer_tag,
    notes, total_returns, profile_image, initial_notes, location_description,
    national_id, created_at, updated_at
FROM temp_customers_backup
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    gender = EXCLUDED.gender,
    city = EXCLUDED.city,
    joined_date = EXCLUDED.joined_date,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    referred_by = EXCLUDED.referred_by,
    total_spent = EXCLUDED.total_spent,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    is_active = EXCLUDED.is_active,
    whatsapp = EXCLUDED.whatsapp,
    referral_source = EXCLUDED.referral_source,
    birth_month = EXCLUDED.birth_month,
    birth_day = EXCLUDED.birth_day,
    customer_tag = EXCLUDED.customer_tag,
    notes = EXCLUDED.notes,
    total_returns = EXCLUDED.total_returns,
    profile_image = EXCLUDED.profile_image,
    initial_notes = EXCLUDED.initial_notes,
    location_description = EXCLUDED.location_description,
    national_id = EXCLUDED.national_id,
    updated_at = NOW();

-- Clean up
DROP TABLE temp_customers_backup;

-- Verify the update
SELECT COUNT(*) as total_customers FROM customers; 