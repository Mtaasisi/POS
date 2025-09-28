-- Customer Database Updates from SMS Transaction Data
-- Generated automatically from transaction analysis


-- Ensure all required columns exist
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS color_tag TEXT DEFAULT 'new' CHECK (color_tag IN ('new', 'vip', 'complainer', 'purchased', 'normal'));

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS loyalty_level TEXT DEFAULT 'bronze' CHECK (loyalty_level IN ('bronze', 'silver', 'gold', 'platinum'));

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS total_spent NUMERIC(12,2) DEFAULT 0;

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS last_visit TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS total_purchases INTEGER DEFAULT 0;

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS referral_source TEXT;

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS customer_tag TEXT;


-- Check if customer exists: Customer 0001 (25564000001)
SELECT id FROM customers WHERE phone = '25564000001';


-- Insert new customer: Customer 0001 (25564000001)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'f568a423-b6c0-4f4d-a7e2-8954f0dfde73',
    'Customer 0001',
    '25564000001',
    NULL,
    '25564000001',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 307',
    True,
    'vip',
    'platinum',
    81085098,
    '2023-10-04T11:15:33Z',
    81085,
    'SMS Import',
    307,
    '2023-10-04T11:15:33Z',
    '2022-09-07T12:04:21Z',
    '2025-09-21T14:35:11.783735Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-07T12:04:21Z',
    'vip'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: Customer 0186 (25564000186)
SELECT id FROM customers WHERE phone = '25564000186';


-- Insert new customer: Customer 0186 (25564000186)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'db863d93-7aa4-4f11-a492-224002da4d79',
    'Customer 0186',
    '25564000186',
    NULL,
    '25564000186',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 129',
    True,
    'vip',
    'platinum',
    29396000,
    '2023-10-03T16:43:02Z',
    29396,
    'SMS Import',
    129,
    '2023-10-03T16:43:02Z',
    '2022-09-10T15:13:40Z',
    '2025-09-21T14:35:11.785352Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-10T15:13:40Z',
    'vip'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: Customer 0232 (25564000232)
SELECT id FROM customers WHERE phone = '25564000232';


-- Insert new customer: Customer 0232 (25564000232)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'fa12ac74-2648-460d-9ffa-5961ab468547',
    'Customer 0232',
    '25564000232',
    NULL,
    '25564000232',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 26',
    True,
    'vip',
    'platinum',
    5717729,
    '2023-08-30T16:51:10Z',
    5717,
    'SMS Import',
    26,
    '2023-08-30T16:51:10Z',
    '2022-09-08T18:56:31Z',
    '2025-09-21T14:35:11.784004Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-08T18:56:31Z',
    'vip'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: SIMU KITAA (25571184504)
SELECT id FROM customers WHERE phone = '25571184504';


-- Insert new customer: SIMU KITAA (25571184504)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '386dcd47-8ac9-496a-b95c-0bfb4bba29f1',
    'SIMU KITAA',
    '25571184504',
    NULL,
    '25571184504',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 2',
    True,
    'vip',
    'platinum',
    4930000,
    '2023-01-20T21:31:01Z',
    4930,
    'SMS Import',
    2,
    '2023-01-20T21:31:01Z',
    '2022-09-24T16:23:19Z',
    '2025-09-21T14:35:11.785806Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-24T16:23:19Z',
    'vip'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: INAUZWA ELECTRONICS (25571145721)
SELECT id FROM customers WHERE phone = '25571145721';


-- Insert new customer: INAUZWA ELECTRONICS (25571145721)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '21c6e928-733d-4517-ae7a-602cbdd8b511',
    'INAUZWA ELECTRONICS',
    '25571145721',
    NULL,
    '25571145721',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 22',
    True,
    'vip',
    'platinum',
    4363250,
    '2024-09-27T12:17:07Z',
    4363,
    'SMS Import',
    22,
    '2024-09-27T12:17:07Z',
    '2023-01-16T08:48:35Z',
    '2025-09-21T14:35:11.787675Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-01-16T08:48:35Z',
    'vip'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: RICKY (255657463697)
SELECT id FROM customers WHERE phone = '255657463697';


-- Insert new customer: RICKY (255657463697)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '0c438fa2-bee4-49df-9f2c-243a007ecc8b',
    'RICKY',
    '255657463697',
    NULL,
    '255657463697',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 4',
    True,
    'vip',
    'platinum',
    4105000,
    '2023-01-12T14:33:12Z',
    4105,
    'SMS Import',
    4,
    '2023-01-12T14:33:12Z',
    '2022-12-08T14:47:32Z',
    '2025-09-21T14:35:11.786912Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-12-08T14:47:32Z',
    'vip'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: ABDALLA (255774195002)
SELECT id FROM customers WHERE phone = '255774195002';


-- Insert new customer: ABDALLA (255774195002)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'fd88c103-f4b4-40ad-a3b0-92c98d1248b3',
    'ABDALLA',
    '255774195002',
    NULL,
    '255774195002',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 2',
    True,
    'vip',
    'platinum',
    3790000,
    '2023-02-12T20:07:18Z',
    3790,
    'SMS Import',
    2,
    '2023-02-12T20:07:18Z',
    '2022-09-20T13:23:13Z',
    '2025-09-21T14:35:11.785669Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-20T13:23:13Z',
    'vip'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: ELIGIUS (255679463945)
SELECT id FROM customers WHERE phone = '255679463945';


-- Insert new customer: ELIGIUS (255679463945)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '69a8973a-2ab4-44cc-848b-03a9490c28d0',
    'ELIGIUS',
    '255679463945',
    NULL,
    '255679463945',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 7',
    True,
    'vip',
    'platinum',
    2675000,
    '2023-02-02T12:34:56Z',
    2675,
    'SMS Import',
    7,
    '2023-02-02T12:34:56Z',
    '2022-09-14T13:42:36Z',
    '2025-09-21T14:35:11.785522Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-14T13:42:36Z',
    'vip'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: GLORIA (255659509345)
SELECT id FROM customers WHERE phone = '255659509345';


-- Insert new customer: GLORIA (255659509345)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '6ffa3b07-653e-418e-8679-cfba7970a73e',
    'GLORIA',
    '255659509345',
    NULL,
    '255659509345',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 2',
    True,
    'vip',
    'platinum',
    2500000,
    '2022-10-04T13:21:28Z',
    2500,
    'SMS Import',
    2,
    '2022-10-04T13:21:28Z',
    '2022-09-29T11:38:23Z',
    '2025-09-21T14:35:11.785877Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-29T11:38:23Z',
    'vip'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: HELLEN (255719796574)
SELECT id FROM customers WHERE phone = '255719796574';


-- Insert new customer: HELLEN (255719796574)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '586cce67-b837-45b8-903e-ff020bdfe234',
    'HELLEN',
    '255719796574',
    NULL,
    '255719796574',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 3',
    True,
    'vip',
    'platinum',
    2300000,
    '2023-02-03T09:54:01Z',
    2300,
    'SMS Import',
    3,
    '2023-02-03T09:54:01Z',
    '2023-01-29T17:34:09Z',
    '2025-09-21T14:35:11.787885Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-01-29T17:34:09Z',
    'vip'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: NTIMI (255677949296)
SELECT id FROM customers WHERE phone = '255677949296';


-- Insert new customer: NTIMI (255677949296)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '2483a2f5-b770-4558-aa67-764048b98986',
    'NTIMI',
    '255677949296',
    NULL,
    '255677949296',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'vip',
    'platinum',
    2200000,
    '2022-11-03T16:46:53Z',
    2200,
    'SMS Import',
    1,
    '2022-11-03T16:46:53Z',
    '2022-11-03T16:46:53Z',
    '2025-09-21T14:35:11.786521Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-11-03T16:46:53Z',
    'vip'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: SULEYMAN (255714224358)
SELECT id FROM customers WHERE phone = '255714224358';


-- Insert new customer: SULEYMAN (255714224358)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '96d89006-84cb-481f-9133-de96b0584c25',
    'SULEYMAN',
    '255714224358',
    NULL,
    '255714224358',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 2',
    True,
    'vip',
    'platinum',
    2000000,
    '2022-09-22T21:32:16Z',
    2000,
    'SMS Import',
    2,
    '2022-09-22T21:32:16Z',
    '2022-09-22T21:31:47Z',
    '2025-09-21T14:35:11.785750Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-22T21:31:47Z',
    'vip'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: YUSUPH (255654811032)
SELECT id FROM customers WHERE phone = '255654811032';


-- Insert new customer: YUSUPH (255654811032)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'ec6273f7-e17f-4e05-8606-cd6043f32a59',
    'YUSUPH',
    '255654811032',
    NULL,
    '255654811032',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 4',
    True,
    'vip',
    'gold',
    1936000,
    '2023-01-25T12:36:40Z',
    1936,
    'SMS Import',
    4,
    '2023-01-25T12:36:40Z',
    '2022-09-29T15:40:55Z',
    '2025-09-21T14:35:11.785939Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-29T15:40:55Z',
    'vip'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: ROBYN (255672573983)
SELECT id FROM customers WHERE phone = '255672573983';


-- Insert new customer: ROBYN (255672573983)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'b92b6cb5-6afa-4a34-b0cc-52e5025f4424',
    'ROBYN',
    '255672573983',
    NULL,
    '255672573983',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'vip',
    'gold',
    1800000,
    '2022-10-03T09:27:41Z',
    1800,
    'SMS Import',
    1,
    '2022-10-03T09:27:41Z',
    '2022-10-03T09:27:41Z',
    '2025-09-21T14:35:11.786041Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-10-03T09:27:41Z',
    'vip'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: FRANCIS (255714819163)
SELECT id FROM customers WHERE phone = '255714819163';


-- Insert new customer: FRANCIS (255714819163)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '4aa4cc5b-7047-4fc5-93f5-fe7f3d4b5db4',
    'FRANCIS',
    '255714819163',
    NULL,
    '255714819163',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'vip',
    'gold',
    1782000,
    '2022-12-31T16:52:36Z',
    1782,
    'SMS Import',
    1,
    '2022-12-31T16:52:36Z',
    '2022-12-31T16:52:36Z',
    '2025-09-21T14:35:11.787235Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-12-31T16:52:36Z',
    'vip'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: SIFAELI (255714146221)
SELECT id FROM customers WHERE phone = '255714146221';


-- Insert new customer: SIFAELI (255714146221)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '026de2c1-e1c2-4dfe-880b-f91f901c8331',
    'SIFAELI',
    '255714146221',
    NULL,
    '255714146221',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 2',
    True,
    'vip',
    'gold',
    1500000,
    '2022-10-05T16:22:36Z',
    1500,
    'SMS Import',
    2,
    '2022-10-05T16:22:36Z',
    '2022-09-10T15:00:02Z',
    '2025-09-21T14:35:11.784054Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-10T15:00:02Z',
    'vip'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: SALMA (255658270477)
SELECT id FROM customers WHERE phone = '255658270477';


-- Insert new customer: SALMA (255658270477)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '33bf9fd4-1856-43e5-b1bc-fe3c47320b6c',
    'SALMA',
    '255658270477',
    NULL,
    '255658270477',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 3',
    True,
    'vip',
    'gold',
    1500000,
    '2022-10-01T10:15:52Z',
    1500,
    'SMS Import',
    3,
    '2022-10-01T10:15:52Z',
    '2022-09-20T07:41:45Z',
    '2025-09-21T14:35:11.785644Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-20T07:41:45Z',
    'vip'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: DICKSON (255653727999)
SELECT id FROM customers WHERE phone = '255653727999';


-- Insert new customer: DICKSON (255653727999)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'a5c7ccee-5a90-45b2-a099-2b7ede18cc8f',
    'DICKSON',
    '255653727999',
    NULL,
    '255653727999',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'vip',
    'gold',
    1320000,
    '2022-11-06T16:13:21Z',
    1320,
    'SMS Import',
    1,
    '2022-11-06T16:13:21Z',
    '2022-11-06T16:13:21Z',
    '2025-09-21T14:35:11.786581Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-11-06T16:13:21Z',
    'vip'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: ERICK (255658123624)
SELECT id FROM customers WHERE phone = '255658123624';


-- Insert new customer: ERICK (255658123624)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '5c543a81-e2e3-4ea1-a29a-484673beb7a6',
    'ERICK',
    '255658123624',
    NULL,
    '255658123624',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 2',
    True,
    'vip',
    'gold',
    1210000,
    '2023-02-11T12:07:39Z',
    1210,
    'SMS Import',
    2,
    '2023-02-11T12:07:39Z',
    '2023-02-03T22:57:01Z',
    '2025-09-21T14:35:11.787953Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-02-03T22:57:01Z',
    'vip'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: KHERI (255717123349)
SELECT id FROM customers WHERE phone = '255717123349';


-- Insert new customer: KHERI (255717123349)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '6ee1d382-c544-4942-9ce5-12ed9b73436c',
    'KHERI',
    '255717123349',
    NULL,
    '255717123349',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 3',
    True,
    'vip',
    'gold',
    1119000,
    '2023-03-06T19:33:27Z',
    1119,
    'SMS Import',
    3,
    '2023-03-06T19:33:27Z',
    '2023-03-06T16:09:57Z',
    '2025-09-21T14:35:11.788302Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-03-06T16:09:57Z',
    'vip'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: EMANUEL (255657966815)
SELECT id FROM customers WHERE phone = '255657966815';


-- Insert new customer: EMANUEL (255657966815)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '37d21584-00f3-424a-82d9-3ac5900fd489',
    'EMANUEL',
    '255657966815',
    NULL,
    '255657966815',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'vip',
    'gold',
    1100000,
    '2022-10-02T15:24:13Z',
    1100,
    'SMS Import',
    1,
    '2022-10-02T15:24:13Z',
    '2022-10-02T15:24:13Z',
    '2025-09-21T14:35:11.786009Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-10-02T15:24:13Z',
    'vip'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: FAISARI (255716852090)
SELECT id FROM customers WHERE phone = '255716852090';


-- Insert new customer: FAISARI (255716852090)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '1bf4729c-109a-4c7a-9efd-49ab3523ddc2',
    'FAISARI',
    '255716852090',
    NULL,
    '255716852090',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 2',
    True,
    'vip',
    'gold',
    1019000,
    '2023-01-06T16:34:50Z',
    1019,
    'SMS Import',
    2,
    '2023-01-06T16:34:50Z',
    '2023-01-06T15:25:58Z',
    '2025-09-21T14:35:11.787295Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-01-06T15:25:58Z',
    'vip'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: SALEHE (255713768183)
SELECT id FROM customers WHERE phone = '255713768183';


-- Insert new customer: SALEHE (255713768183)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'f5e674e7-4875-43a4-8b23-784b13366f37',
    'SALEHE',
    '255713768183',
    NULL,
    '255713768183',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'vip',
    'gold',
    1000000,
    '2022-10-17T16:46:33Z',
    1000,
    'SMS Import',
    1,
    '2022-10-17T16:46:33Z',
    '2022-10-17T16:46:33Z',
    '2025-09-21T14:35:11.786227Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-10-17T16:46:33Z',
    'vip'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: KHALIFA (255712739618)
SELECT id FROM customers WHERE phone = '255712739618';


-- Insert new customer: KHALIFA (255712739618)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '6cb6ed5f-4cf1-4da2-8883-23c4c92e55bd',
    'KHALIFA',
    '255712739618',
    NULL,
    '255712739618',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'vip',
    'gold',
    1000000,
    '2022-10-18T15:24:25Z',
    1000,
    'SMS Import',
    1,
    '2022-10-18T15:24:25Z',
    '2022-10-18T15:24:25Z',
    '2025-09-21T14:35:11.786281Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-10-18T15:24:25Z',
    'vip'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: ADOLFU (255719830922)
SELECT id FROM customers WHERE phone = '255719830922';


-- Insert new customer: ADOLFU (255719830922)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '068da4c1-6dd9-4a2c-860a-4d631bb5cca7',
    'ADOLFU',
    '255719830922',
    NULL,
    '255719830922',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 3',
    True,
    'purchased',
    'silver',
    980000,
    '2023-02-10T11:53:27Z',
    980,
    'SMS Import',
    3,
    '2023-02-10T11:53:27Z',
    '2023-01-28T14:50:10Z',
    '2025-09-21T14:35:11.787854Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-01-28T14:50:10Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: MOHAMEDI (255710809525)
SELECT id FROM customers WHERE phone = '255710809525';


-- Insert new customer: MOHAMEDI (255710809525)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '3dbca876-e8a5-42a3-bc01-4babd1c0a737',
    'MOHAMEDI',
    '255710809525',
    NULL,
    '255710809525',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 3',
    True,
    'purchased',
    'silver',
    969000,
    '2023-01-11T20:54:40Z',
    969,
    'SMS Import',
    3,
    '2023-01-11T20:54:40Z',
    '2022-12-18T14:21:20Z',
    '2025-09-21T14:35:11.787090Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-12-18T14:21:20Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: HANS (255712076431)
SELECT id FROM customers WHERE phone = '255712076431';


-- Insert new customer: HANS (255712076431)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'c8a7c7dd-0a01-43e3-88d6-1854a3f2a3e2',
    'HANS',
    '255712076431',
    NULL,
    '255712076431',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'silver',
    910000,
    '2022-12-12T10:38:30Z',
    910,
    'SMS Import',
    1,
    '2022-12-12T10:38:30Z',
    '2022-12-12T10:38:30Z',
    '2025-09-21T14:35:11.786981Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-12-12T10:38:30Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: JOEL (255719968222)
SELECT id FROM customers WHERE phone = '255719968222';


-- Insert new customer: JOEL (255719968222)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '9b993f11-2ba7-40e7-85e4-3837ec7c1e40',
    'JOEL',
    '255719968222',
    NULL,
    '255719968222',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 2',
    True,
    'purchased',
    'silver',
    900000,
    '2022-09-14T16:59:37Z',
    900,
    'SMS Import',
    2,
    '2022-09-14T16:59:37Z',
    '2022-09-11T14:14:20Z',
    '2025-09-21T14:35:11.785385Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-11T14:14:20Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: BENWARD (255713510369)
SELECT id FROM customers WHERE phone = '255713510369';


-- Insert new customer: BENWARD (255713510369)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '5de622df-acb2-4ca2-a015-6985244e39d3',
    'BENWARD',
    '255713510369',
    NULL,
    '255713510369',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'silver',
    900000,
    '2023-02-18T12:45:31Z',
    900,
    'SMS Import',
    1,
    '2023-02-18T12:45:31Z',
    '2023-02-18T12:45:31Z',
    '2025-09-21T14:35:11.788226Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-02-18T12:45:31Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: AMEDEUS (255658225522)
SELECT id FROM customers WHERE phone = '255658225522';


-- Insert new customer: AMEDEUS (255658225522)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'e8be3245-0a7f-4ba9-acea-dfed2fafa32c',
    'AMEDEUS',
    '255658225522',
    NULL,
    '255658225522',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 3',
    True,
    'purchased',
    'silver',
    865000,
    '2023-02-08T12:16:21Z',
    865,
    'SMS Import',
    3,
    '2023-02-08T12:16:21Z',
    '2022-10-21T11:06:40Z',
    '2025-09-21T14:35:11.786360Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-10-21T11:06:40Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: MANASEH (255710086306)
SELECT id FROM customers WHERE phone = '255710086306';


-- Insert new customer: MANASEH (255710086306)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '3ac72155-f0e6-47da-a632-d0bd862f548e',
    'MANASEH',
    '255710086306',
    NULL,
    '255710086306',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'silver',
    850000,
    '2022-12-10T14:29:29Z',
    850,
    'SMS Import',
    1,
    '2022-12-10T14:29:29Z',
    '2022-12-10T14:29:29Z',
    '2025-09-21T14:35:11.786950Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-12-10T14:29:29Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: SHEKA (255657108159)
SELECT id FROM customers WHERE phone = '255657108159';


-- Insert new customer: SHEKA (255657108159)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '3df25995-77c2-40f6-a595-64a67f70c27b',
    'SHEKA',
    '255657108159',
    NULL,
    '255657108159',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'silver',
    850000,
    '2023-01-07T12:44:37Z',
    850,
    'SMS Import',
    1,
    '2023-01-07T12:44:37Z',
    '2023-01-07T12:44:37Z',
    '2025-09-21T14:35:11.787326Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-01-07T12:44:37Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: MIRIAM (255712760663)
SELECT id FROM customers WHERE phone = '255712760663';


-- Insert new customer: MIRIAM (255712760663)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '297bce6a-c172-45de-82f8-b3ec257d067b',
    'MIRIAM',
    '255712760663',
    NULL,
    '255712760663',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'silver',
    850000,
    '2023-01-30T10:57:31Z',
    850,
    'SMS Import',
    1,
    '2023-01-30T10:57:31Z',
    '2023-01-30T10:57:31Z',
    '2025-09-21T14:35:11.787900Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-01-30T10:57:31Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: TRUE IMAGE UNDERTAKING INVESTMENT LTD (25571210682)
SELECT id FROM customers WHERE phone = '25571210682';


-- Insert new customer: TRUE IMAGE UNDERTAKING INVESTMENT LTD (25571210682)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'bf8a8507-95d9-4254-be45-5634320e8ec1',
    'TRUE IMAGE UNDERTAKING INVESTMENT LTD',
    '25571210682',
    NULL,
    '25571210682',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'silver',
    829000,
    '2023-03-06T19:23:16Z',
    829,
    'SMS Import',
    1,
    '2023-03-06T19:23:16Z',
    '2023-03-06T19:23:16Z',
    '2025-09-21T14:35:11.788316Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-03-06T19:23:16Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: GEORGE (255717187685)
SELECT id FROM customers WHERE phone = '255717187685';


-- Insert new customer: GEORGE (255717187685)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '24e88bca-9cc5-4873-bab9-f0cce9a7e4f7',
    'GEORGE',
    '255717187685',
    NULL,
    '255717187685',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'silver',
    750000,
    '2022-11-13T11:10:41Z',
    750,
    'SMS Import',
    1,
    '2022-11-13T11:10:41Z',
    '2022-11-13T11:10:41Z',
    '2025-09-21T14:35:11.786651Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-11-13T11:10:41Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: CANDID (255655413102)
SELECT id FROM customers WHERE phone = '255655413102';


-- Insert new customer: CANDID (255655413102)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '5b699fc3-a171-4618-8434-da9d15605bf8',
    'CANDID',
    '255655413102',
    NULL,
    '255655413102',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 5',
    True,
    'purchased',
    'silver',
    670000,
    '2023-03-05T14:50:45Z',
    670,
    'SMS Import',
    5,
    '2023-03-05T14:50:45Z',
    '2023-02-10T18:05:09Z',
    '2025-09-21T14:35:11.788097Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-02-10T18:05:09Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: ALBERT (255715284802)
SELECT id FROM customers WHERE phone = '255715284802';


-- Insert new customer: ALBERT (255715284802)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '073f66a0-7d9e-4e5c-b6ec-ef26c5227aea',
    'ALBERT',
    '255715284802',
    NULL,
    '255715284802',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 2',
    True,
    'purchased',
    'silver',
    640000,
    '2022-10-17T20:40:22Z',
    640,
    'SMS Import',
    2,
    '2022-10-17T20:40:22Z',
    '2022-09-28T21:58:34Z',
    '2025-09-21T14:35:11.785847Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-28T21:58:34Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: JACKLINE (255718766011)
SELECT id FROM customers WHERE phone = '255718766011';


-- Insert new customer: JACKLINE (255718766011)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '2630ad6e-9d99-45cf-9cf8-0c889d437889',
    'JACKLINE',
    '255718766011',
    NULL,
    '255718766011',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'silver',
    635000,
    '2022-10-17T21:24:58Z',
    635,
    'SMS Import',
    1,
    '2022-10-17T21:24:58Z',
    '2022-10-17T21:24:58Z',
    '2025-09-21T14:35:11.786266Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-10-17T21:24:58Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: GERALD (255719800080)
SELECT id FROM customers WHERE phone = '255719800080';


-- Insert new customer: GERALD (255719800080)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'ccfb04bd-f4a9-414a-9f14-6674635b0cdd',
    'GERALD',
    '255719800080',
    NULL,
    '255719800080',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 2',
    True,
    'purchased',
    'silver',
    635000,
    '2022-11-07T10:13:28Z',
    635,
    'SMS Import',
    2,
    '2022-11-07T10:13:28Z',
    '2022-10-25T16:55:05Z',
    '2025-09-21T14:35:11.786429Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-10-25T16:55:05Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: MBILIKILA (255712517415)
SELECT id FROM customers WHERE phone = '255712517415';


-- Insert new customer: MBILIKILA (255712517415)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'd03c9a95-490c-49fc-8b06-f32ca634f9fc',
    'MBILIKILA',
    '255712517415',
    NULL,
    '255712517415',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 3',
    True,
    'purchased',
    'silver',
    610000,
    '2023-01-30T17:37:17Z',
    610,
    'SMS Import',
    3,
    '2023-01-30T17:37:17Z',
    '2023-01-22T19:04:43Z',
    '2025-09-21T14:35:11.787790Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-01-22T19:04:43Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: ARNOLD (255658123222)
SELECT id FROM customers WHERE phone = '255658123222';


-- Insert new customer: ARNOLD (255658123222)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '540303a0-914d-428e-b706-fa4e317467ba',
    'ARNOLD',
    '255658123222',
    NULL,
    '255658123222',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 2',
    True,
    'purchased',
    'silver',
    600000,
    '2023-01-12T13:41:30Z',
    600,
    'SMS Import',
    2,
    '2023-01-12T13:41:30Z',
    '2023-01-10T13:54:20Z',
    '2025-09-21T14:35:11.787426Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-01-10T13:54:20Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: ENEZA (255654917217)
SELECT id FROM customers WHERE phone = '255654917217';


-- Insert new customer: ENEZA (255654917217)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '498b8054-8546-443b-a403-499a42606224',
    'ENEZA',
    '255654917217',
    NULL,
    '255654917217',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'silver',
    600000,
    '2023-01-12T20:52:22Z',
    600,
    'SMS Import',
    1,
    '2023-01-12T20:52:22Z',
    '2023-01-12T20:52:22Z',
    '2025-09-21T14:35:11.787470Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-01-12T20:52:22Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: SYLVESTER (255657163242)
SELECT id FROM customers WHERE phone = '255657163242';


-- Insert new customer: SYLVESTER (255657163242)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'eab6fc6e-fd6b-46cf-84f6-c36b71113aa6',
    'SYLVESTER',
    '255657163242',
    NULL,
    '255657163242',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'silver',
    600000,
    '2023-02-20T13:32:03Z',
    600,
    'SMS Import',
    1,
    '2023-02-20T13:32:03Z',
    '2023-02-20T13:32:03Z',
    '2025-09-21T14:35:11.788240Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-02-20T13:32:03Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: CHRISANTUS (255652511380)
SELECT id FROM customers WHERE phone = '255652511380';


-- Insert new customer: CHRISANTUS (255652511380)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'b3e74b1f-d36d-40e7-84e2-344672f830fd',
    'CHRISANTUS',
    '255652511380',
    NULL,
    '255652511380',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'silver',
    580000,
    '2022-09-08T14:31:26Z',
    580,
    'SMS Import',
    1,
    '2022-09-08T14:31:26Z',
    '2022-09-08T14:31:26Z',
    '2025-09-21T14:35:11.783753Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-08T14:31:26Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: JAMBIA (255714898832)
SELECT id FROM customers WHERE phone = '255714898832';


-- Insert new customer: JAMBIA (255714898832)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '42153235-bfb5-4b11-a71f-4927a1c0a507',
    'JAMBIA',
    '255714898832',
    NULL,
    '255714898832',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 2',
    True,
    'purchased',
    'silver',
    550000,
    '2022-09-16T15:08:43Z',
    550,
    'SMS Import',
    2,
    '2022-09-16T15:08:43Z',
    '2022-09-13T11:27:50Z',
    '2025-09-21T14:35:11.785427Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-13T11:27:50Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: JOHN (255654052610)
SELECT id FROM customers WHERE phone = '255654052610';


-- Insert new customer: JOHN (255654052610)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '5511959c-5398-4eab-8f2c-8e2afb4d8be5',
    'JOHN',
    '255654052610',
    NULL,
    '255654052610',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'silver',
    500000,
    '2022-10-05T16:05:50Z',
    500,
    'SMS Import',
    1,
    '2022-10-05T16:05:50Z',
    '2022-10-05T16:05:50Z',
    '2025-09-21T14:35:11.786085Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-10-05T16:05:50Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: TUMSIFU (255717809991)
SELECT id FROM customers WHERE phone = '255717809991';


-- Insert new customer: TUMSIFU (255717809991)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '26d28d10-ff25-4c38-9dbc-da2671c22ded',
    'TUMSIFU',
    '255717809991',
    NULL,
    '255717809991',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'silver',
    500000,
    '2022-10-21T11:08:58Z',
    500,
    'SMS Import',
    1,
    '2022-10-21T11:08:58Z',
    '2022-10-21T11:08:58Z',
    '2025-09-21T14:35:11.786374Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-10-21T11:08:58Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: HARRIS (255653109270)
SELECT id FROM customers WHERE phone = '255653109270';


-- Insert new customer: HARRIS (255653109270)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '747111ec-3715-4282-b2a5-35f3d19c2ffe',
    'HARRIS',
    '255653109270',
    NULL,
    '255653109270',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 3',
    True,
    'purchased',
    'silver',
    500000,
    '2023-01-11T12:55:31Z',
    500,
    'SMS Import',
    3,
    '2023-01-11T12:55:31Z',
    '2023-01-09T18:51:38Z',
    '2025-09-21T14:35:11.787374Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-01-09T18:51:38Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: AKBAR (255716608870)
SELECT id FROM customers WHERE phone = '255716608870';


-- Insert new customer: AKBAR (255716608870)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'd678f6f4-799d-47c7-a82d-0c0a5a3352ae',
    'AKBAR',
    '255716608870',
    NULL,
    '255716608870',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'silver',
    500000,
    '2023-01-10T14:49:00Z',
    500,
    'SMS Import',
    1,
    '2023-01-10T14:49:00Z',
    '2023-01-10T14:49:00Z',
    '2025-09-21T14:35:11.787441Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-01-10T14:49:00Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: SEBASTIAN (255715298282)
SELECT id FROM customers WHERE phone = '255715298282';


-- Insert new customer: SEBASTIAN (255715298282)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '49b28d89-75fe-41c3-99e1-bb7dd8c8f331',
    'SEBASTIAN',
    '255715298282',
    NULL,
    '255715298282',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 2',
    True,
    'purchased',
    'silver',
    500000,
    '2023-02-22T14:39:51Z',
    500,
    'SMS Import',
    2,
    '2023-02-22T14:39:51Z',
    '2023-02-16T20:58:07Z',
    '2025-09-21T14:35:11.788211Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-02-16T20:58:07Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: NAOMI (255654841225)
SELECT id FROM customers WHERE phone = '255654841225';


-- Insert new customer: NAOMI (255654841225)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '4b80a190-1431-4304-8bec-344344678637',
    'NAOMI',
    '255654841225',
    NULL,
    '255654841225',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    497000,
    '2022-12-24T21:59:50Z',
    497,
    'SMS Import',
    1,
    '2022-12-24T21:59:50Z',
    '2022-12-24T21:59:50Z',
    '2025-09-21T14:35:11.787175Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-12-24T21:59:50Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: IDRISA (255656230000)
SELECT id FROM customers WHERE phone = '255656230000';


-- Insert new customer: IDRISA (255656230000)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '6feea406-da55-43c1-8c12-dd6a72b1bcfb',
    'IDRISA',
    '255656230000',
    NULL,
    '255656230000',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    490000,
    '2022-09-23T16:24:00Z',
    490,
    'SMS Import',
    1,
    '2022-09-23T16:24:00Z',
    '2022-09-23T16:24:00Z',
    '2025-09-21T14:35:11.785766Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-23T16:24:00Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: DANIEL (255715303065)
SELECT id FROM customers WHERE phone = '255715303065';


-- Insert new customer: DANIEL (255715303065)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '45110019-1a6b-4657-99bd-a8cf42ed6aab',
    'DANIEL',
    '255715303065',
    NULL,
    '255715303065',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 2',
    True,
    'purchased',
    'bronze',
    465000,
    '2023-01-17T20:20:25Z',
    465,
    'SMS Import',
    2,
    '2023-01-17T20:20:25Z',
    '2022-10-15T11:58:10Z',
    '2025-09-21T14:35:11.786195Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-10-15T11:58:10Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: THE GRAND AIM COMPANY (25571255774)
SELECT id FROM customers WHERE phone = '25571255774';


-- Insert new customer: THE GRAND AIM COMPANY (25571255774)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '51c2ca0a-73fb-4e91-93c3-cf9257c6c2c5',
    'THE GRAND AIM COMPANY',
    '25571255774',
    NULL,
    '25571255774',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    450000,
    '2022-12-17T14:02:58Z',
    450,
    'SMS Import',
    1,
    '2022-12-17T14:02:58Z',
    '2022-12-17T14:02:58Z',
    '2025-09-21T14:35:11.787043Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-12-17T14:02:58Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: MITUTOYO (255718282509)
SELECT id FROM customers WHERE phone = '255718282509';


-- Insert new customer: MITUTOYO (255718282509)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '0f56c512-e757-49e1-9e7c-90f662304b0c',
    'MITUTOYO',
    '255718282509',
    NULL,
    '255718282509',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    410000,
    '2022-11-03T19:59:01Z',
    410,
    'SMS Import',
    1,
    '2022-11-03T19:59:01Z',
    '2022-11-03T19:59:01Z',
    '2025-09-21T14:35:11.786537Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-11-03T19:59:01Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: PROSPER (255719222709)
SELECT id FROM customers WHERE phone = '255719222709';


-- Insert new customer: PROSPER (255719222709)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '5f156d29-2e48-4c18-8bc4-5d2cfd87c701',
    'PROSPER',
    '255719222709',
    NULL,
    '255719222709',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 2',
    True,
    'purchased',
    'bronze',
    400000,
    '2022-10-17T19:50:32Z',
    400,
    'SMS Import',
    2,
    '2022-10-17T19:50:32Z',
    '2022-10-17T18:08:25Z',
    '2025-09-21T14:35:11.786251Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-10-17T18:08:25Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: KELVIN (255717223822)
SELECT id FROM customers WHERE phone = '255717223822';


-- Insert new customer: KELVIN (255717223822)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '88041eda-41cb-4d28-9d15-70e2ed87a6d9',
    'KELVIN',
    '255717223822',
    NULL,
    '255717223822',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    400000,
    '2023-02-10T18:59:55Z',
    400,
    'SMS Import',
    1,
    '2023-02-10T18:59:55Z',
    '2023-02-10T18:59:55Z',
    '2025-09-21T14:35:11.788111Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-02-10T18:59:55Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: ERICK (255719014040)
SELECT id FROM customers WHERE phone = '255719014040';


-- Insert new customer: ERICK (255719014040)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'c32a4ef0-e5de-447e-994f-12b58da2d7ed',
    'ERICK',
    '255719014040',
    NULL,
    '255719014040',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    399000,
    '2022-11-15T13:28:00Z',
    399,
    'SMS Import',
    1,
    '2022-11-15T13:28:00Z',
    '2022-11-15T13:28:00Z',
    '2025-09-21T14:35:11.786705Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-11-15T13:28:00Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: THOMAS (255716057542)
SELECT id FROM customers WHERE phone = '255716057542';


-- Insert new customer: THOMAS (255716057542)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '55eeeaa1-ad4a-455b-b71c-032abae3e9a4',
    'THOMAS',
    '255716057542',
    NULL,
    '255716057542',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 2',
    True,
    'purchased',
    'bronze',
    369000,
    '2022-09-23T10:22:21Z',
    369,
    'SMS Import',
    2,
    '2022-09-23T10:22:21Z',
    '2022-09-21T13:37:25Z',
    '2025-09-21T14:35:11.785694Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-21T13:37:25Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: DATIUS (255719938063)
SELECT id FROM customers WHERE phone = '255719938063';


-- Insert new customer: DATIUS (255719938063)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '561008c3-dff8-4777-b190-ee6812a490e5',
    'DATIUS',
    '255719938063',
    NULL,
    '255719938063',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    368000,
    '2022-10-29T16:43:28Z',
    368,
    'SMS Import',
    1,
    '2022-10-29T16:43:28Z',
    '2022-10-29T16:43:28Z',
    '2025-09-21T14:35:11.786491Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-10-29T16:43:28Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: OMARY (255710000008)
SELECT id FROM customers WHERE phone = '255710000008';


-- Insert new customer: OMARY (255710000008)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '0f153ac4-5b24-44dd-81e2-d473aad6b61d',
    'OMARY',
    '255710000008',
    NULL,
    '255710000008',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    350000,
    '2022-11-24T09:03:31Z',
    350,
    'SMS Import',
    1,
    '2022-11-24T09:03:31Z',
    '2022-11-24T09:03:31Z',
    '2025-09-21T14:35:11.786803Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-11-24T09:03:31Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: FADHILI (255656304959)
SELECT id FROM customers WHERE phone = '255656304959';


-- Insert new customer: FADHILI (255656304959)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'f342374b-9023-42d4-bcee-cbd9718e1f75',
    'FADHILI',
    '255656304959',
    NULL,
    '255656304959',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 2',
    True,
    'purchased',
    'bronze',
    330000,
    '2022-09-06T20:17:36Z',
    330,
    'SMS Import',
    2,
    '2022-09-06T20:17:36Z',
    '2022-09-05T15:15:49Z',
    '2025-09-21T14:35:11.781057Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-05T15:15:49Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: YUSUPH (255717831422)
SELECT id FROM customers WHERE phone = '255717831422';


-- Insert new customer: YUSUPH (255717831422)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'ea84a23f-5aa8-4dd7-a158-40f5d383aefb',
    'YUSUPH',
    '255717831422',
    NULL,
    '255717831422',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 2',
    True,
    'purchased',
    'bronze',
    310000,
    '2022-09-30T17:23:34Z',
    310,
    'SMS Import',
    2,
    '2022-09-30T17:23:34Z',
    '2022-09-30T16:23:31Z',
    '2025-09-21T14:35:11.785963Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-30T16:23:31Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: JUMA (255710870870)
SELECT id FROM customers WHERE phone = '255710870870';


-- Insert new customer: JUMA (255710870870)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'a59ea5fa-7920-4773-8119-4b9b59e63cb5',
    'JUMA',
    '255710870870',
    NULL,
    '255710870870',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    310000,
    '2023-01-06T13:17:23Z',
    310,
    'SMS Import',
    1,
    '2023-01-06T13:17:23Z',
    '2023-01-06T13:17:23Z',
    '2025-09-21T14:35:11.787273Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-01-06T13:17:23Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: JOSEPH (255656953059)
SELECT id FROM customers WHERE phone = '255656953059';


-- Insert new customer: JOSEPH (255656953059)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'a3b308a5-33e2-48f6-a3d7-c6ff2c4060b0',
    'JOSEPH',
    '255656953059',
    NULL,
    '255656953059',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 2',
    True,
    'purchased',
    'bronze',
    300000,
    '2022-12-05T20:44:21Z',
    300,
    'SMS Import',
    2,
    '2022-12-05T20:44:21Z',
    '2022-10-07T16:13:39Z',
    '2025-09-21T14:35:11.786124Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-10-07T16:13:39Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: ABDALLAH (255715652652)
SELECT id FROM customers WHERE phone = '255715652652';


-- Insert new customer: ABDALLAH (255715652652)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '93df404b-e3d0-47bc-a169-2cef22c31d6b',
    'ABDALLAH',
    '255715652652',
    NULL,
    '255715652652',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    300000,
    '2022-12-05T19:52:41Z',
    300,
    'SMS Import',
    1,
    '2022-12-05T19:52:41Z',
    '2022-12-05T19:52:41Z',
    '2025-09-21T14:35:11.786857Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-12-05T19:52:41Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: SELEMANI (255655869221)
SELECT id FROM customers WHERE phone = '255655869221';


-- Insert new customer: SELEMANI (255655869221)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '2d08dc0c-14d5-4ca5-8798-f7ce8f54caf0',
    'SELEMANI',
    '255655869221',
    NULL,
    '255655869221',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 2',
    True,
    'purchased',
    'bronze',
    275000,
    '2022-12-23T19:02:34Z',
    275,
    'SMS Import',
    2,
    '2022-12-23T19:02:34Z',
    '2022-12-10T13:52:14Z',
    '2025-09-21T14:35:11.786935Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-12-10T13:52:14Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: FRANK (255653005099)
SELECT id FROM customers WHERE phone = '255653005099';


-- Insert new customer: FRANK (255653005099)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '92579d7a-639e-416e-925f-3eee57d53934',
    'FRANK',
    '255653005099',
    NULL,
    '255653005099',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    250000,
    '2022-12-23T11:17:41Z',
    250,
    'SMS Import',
    1,
    '2022-12-23T11:17:41Z',
    '2022-12-23T11:17:41Z',
    '2025-09-21T14:35:11.787120Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-12-23T11:17:41Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: ANNASTERDA (255712624133)
SELECT id FROM customers WHERE phone = '255712624133';


-- Insert new customer: ANNASTERDA (255712624133)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '42fa2bb5-a3b3-4764-b97e-e90b16eec1ba',
    'ANNASTERDA',
    '255712624133',
    NULL,
    '255712624133',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    250000,
    '2023-02-07T08:09:13Z',
    250,
    'SMS Import',
    1,
    '2023-02-07T08:09:13Z',
    '2023-02-07T08:09:13Z',
    '2025-09-21T14:35:11.788005Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-02-07T08:09:13Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: WINFRIDA (255717432850)
SELECT id FROM customers WHERE phone = '255717432850';


-- Insert new customer: WINFRIDA (255717432850)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '04841d9a-227e-4dc2-9d09-e1e2f8710550',
    'WINFRIDA',
    '255717432850',
    NULL,
    '255717432850',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    220000,
    '2022-09-19T13:54:10Z',
    220,
    'SMS Import',
    1,
    '2022-09-19T13:54:10Z',
    '2022-09-19T13:54:10Z',
    '2025-09-21T14:35:11.785610Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-19T13:54:10Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: STEPHEN (255679261245)
SELECT id FROM customers WHERE phone = '255679261245';


-- Insert new customer: STEPHEN (255679261245)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '219b0ef8-d31c-4790-93b3-b42d5895687e',
    'STEPHEN',
    '255679261245',
    NULL,
    '255679261245',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 2',
    True,
    'purchased',
    'bronze',
    200000,
    '2022-09-15T11:53:41Z',
    200,
    'SMS Import',
    2,
    '2022-09-15T11:53:41Z',
    '2022-09-15T11:40:29Z',
    '2025-09-21T14:35:11.785547Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-15T11:40:29Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: STEVEN (255673974292)
SELECT id FROM customers WHERE phone = '255673974292';


-- Insert new customer: STEVEN (255673974292)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '14642f72-d00f-4450-9e80-464d78701bd6',
    'STEVEN',
    '255673974292',
    NULL,
    '255673974292',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    200000,
    '2022-10-30T14:43:30Z',
    200,
    'SMS Import',
    1,
    '2022-10-30T14:43:30Z',
    '2022-10-30T14:43:30Z',
    '2025-09-21T14:35:11.786506Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-10-30T14:43:30Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: SHAFII (255712863893)
SELECT id FROM customers WHERE phone = '255712863893';


-- Insert new customer: SHAFII (255712863893)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'a428bdff-e250-4af0-a331-210c3e16bfad',
    'SHAFII',
    '255712863893',
    NULL,
    '255712863893',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    200000,
    '2022-12-04T14:53:31Z',
    200,
    'SMS Import',
    1,
    '2022-12-04T14:53:31Z',
    '2022-12-04T14:53:31Z',
    '2025-09-21T14:35:11.786842Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-12-04T14:53:31Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: MEDARD (255657378230)
SELECT id FROM customers WHERE phone = '255657378230';


-- Insert new customer: MEDARD (255657378230)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '05d13831-1442-47c7-99a4-a863182b2604',
    'MEDARD',
    '255657378230',
    NULL,
    '255657378230',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    200000,
    '2023-01-13T14:43:35Z',
    200,
    'SMS Import',
    1,
    '2023-01-13T14:43:35Z',
    '2023-01-13T14:43:35Z',
    '2025-09-21T14:35:11.787484Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-01-13T14:43:35Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: WILFRED (255674840320)
SELECT id FROM customers WHERE phone = '255674840320';


-- Insert new customer: WILFRED (255674840320)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'b195fe9a-0604-46cc-b6d7-1348603deeb2',
    'WILFRED',
    '255674840320',
    NULL,
    '255674840320',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    200000,
    '2023-02-03T11:16:59Z',
    200,
    'SMS Import',
    1,
    '2023-02-03T11:16:59Z',
    '2023-02-03T11:16:59Z',
    '2025-09-21T14:35:11.787930Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-02-03T11:16:59Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: MANGE (255658645749)
SELECT id FROM customers WHERE phone = '255658645749';


-- Insert new customer: MANGE (255658645749)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'd9c463a1-fbc2-4ab7-9557-d7b9cbadf58e',
    'MANGE',
    '255658645749',
    NULL,
    '255658645749',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    190000,
    '2022-10-25T17:04:38Z',
    190,
    'SMS Import',
    1,
    '2022-10-25T17:04:38Z',
    '2022-10-25T17:04:38Z',
    '2025-09-21T14:35:11.786446Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-10-25T17:04:38Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: OMBENI (255719625566)
SELECT id FROM customers WHERE phone = '255719625566';


-- Insert new customer: OMBENI (255719625566)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'b9072bff-9533-4ed5-800b-0606a5a20124',
    'OMBENI',
    '255719625566',
    NULL,
    '255719625566',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    180000,
    '2022-11-06T10:29:06Z',
    180,
    'SMS Import',
    1,
    '2022-11-06T10:29:06Z',
    '2022-11-06T10:29:06Z',
    '2025-09-21T14:35:11.786566Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-11-06T10:29:06Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: JOHNBOSCO (255714174067)
SELECT id FROM customers WHERE phone = '255714174067';


-- Insert new customer: JOHNBOSCO (255714174067)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '06db816b-c131-485b-98c9-7c82a9020bf0',
    'JOHNBOSCO',
    '255714174067',
    NULL,
    '255714174067',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    179000,
    '2022-12-17T19:31:36Z',
    179,
    'SMS Import',
    1,
    '2022-12-17T19:31:36Z',
    '2022-12-17T19:31:36Z',
    '2025-09-21T14:35:11.787058Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-12-17T19:31:36Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: LUCY (255712565000)
SELECT id FROM customers WHERE phone = '255712565000';


-- Insert new customer: LUCY (255712565000)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'ab5ac251-a905-435f-a2d1-2f4f6be0eb4b',
    'LUCY',
    '255712565000',
    NULL,
    '255712565000',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    170000,
    '2022-10-03T21:06:49Z',
    170,
    'SMS Import',
    1,
    '2022-10-03T21:06:49Z',
    '2022-10-03T21:06:49Z',
    '2025-09-21T14:35:11.786056Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-10-03T21:06:49Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: GERLAD (255719404434)
SELECT id FROM customers WHERE phone = '255719404434';


-- Insert new customer: GERLAD (255719404434)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'bf470df4-7105-49bd-ac9a-09c16f0f1f77',
    'GERLAD',
    '255719404434',
    NULL,
    '255719404434',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 2',
    True,
    'purchased',
    'bronze',
    170000,
    '2022-12-29T19:49:00Z',
    170,
    'SMS Import',
    2,
    '2022-12-29T19:49:00Z',
    '2022-11-14T12:30:02Z',
    '2025-09-21T14:35:11.786690Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-11-14T12:30:02Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: OMARI (255713609197)
SELECT id FROM customers WHERE phone = '255713609197';


-- Insert new customer: OMARI (255713609197)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'a2e809c8-a959-44af-b2d0-c9a2b5bfb041',
    'OMARI',
    '255713609197',
    NULL,
    '255713609197',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 2',
    True,
    'purchased',
    'bronze',
    160000,
    '2023-01-04T18:39:43Z',
    160,
    'SMS Import',
    2,
    '2023-01-04T18:39:43Z',
    '2022-11-08T15:29:06Z',
    '2025-09-21T14:35:11.786636Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-11-08T15:29:06Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: MARIAM (255654771058)
SELECT id FROM customers WHERE phone = '255654771058';


-- Insert new customer: MARIAM (255654771058)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '220efd9a-ede1-4111-adc8-ae1ba28e5567',
    'MARIAM',
    '255654771058',
    NULL,
    '255654771058',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    160000,
    '2023-01-18T20:02:46Z',
    160,
    'SMS Import',
    1,
    '2023-01-18T20:02:46Z',
    '2023-01-18T20:02:46Z',
    '2025-09-21T14:35:11.787744Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-01-18T20:02:46Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: SHABIR (255658429988)
SELECT id FROM customers WHERE phone = '255658429988';


-- Insert new customer: SHABIR (255658429988)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'ae01954b-7083-482d-bc93-af7e8ada0cd7',
    'SHABIR',
    '255658429988',
    NULL,
    '255658429988',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    160000,
    '2023-02-13T18:45:25Z',
    160,
    'SMS Import',
    1,
    '2023-02-13T18:45:25Z',
    '2023-02-13T18:45:25Z',
    '2025-09-21T14:35:11.788128Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-02-13T18:45:25Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: HIDAYA (255715236614)
SELECT id FROM customers WHERE phone = '255715236614';


-- Insert new customer: HIDAYA (255715236614)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '1983d08e-f520-4b68-b45a-73dab1bc90fc',
    'HIDAYA',
    '255715236614',
    NULL,
    '255715236614',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    150000,
    '2022-10-06T18:10:29Z',
    150,
    'SMS Import',
    1,
    '2022-10-06T18:10:29Z',
    '2022-10-06T18:10:29Z',
    '2025-09-21T14:35:11.786100Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-10-06T18:10:29Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: JAMES (255653513914)
SELECT id FROM customers WHERE phone = '255653513914';


-- Insert new customer: JAMES (255653513914)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '177cceeb-a96f-4ac0-afe1-029c9e614c41',
    'JAMES',
    '255653513914',
    NULL,
    '255653513914',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 3',
    True,
    'purchased',
    'bronze',
    150000,
    '2023-02-04T19:38:06Z',
    150,
    'SMS Import',
    3,
    '2023-02-04T19:38:06Z',
    '2022-10-18T20:21:44Z',
    '2025-09-21T14:35:11.786328Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-10-18T20:21:44Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: CLARA (255713560566)
SELECT id FROM customers WHERE phone = '255713560566';


-- Insert new customer: CLARA (255713560566)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '1cf39b17-200d-4a33-8a7c-b2fbc015e96c',
    'CLARA',
    '255713560566',
    NULL,
    '255713560566',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    150000,
    '2023-01-06T19:33:19Z',
    150,
    'SMS Import',
    1,
    '2023-01-06T19:33:19Z',
    '2023-01-06T19:33:19Z',
    '2025-09-21T14:35:11.787310Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-01-06T19:33:19Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: ESTER (255656601774)
SELECT id FROM customers WHERE phone = '255656601774';


-- Insert new customer: ESTER (255656601774)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '7f931c49-1e02-4bfd-b62e-b16c4ed0368a',
    'ESTER',
    '255656601774',
    NULL,
    '255656601774',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    150000,
    '2023-02-08T12:35:35Z',
    150,
    'SMS Import',
    1,
    '2023-02-08T12:35:35Z',
    '2023-02-08T12:35:35Z',
    '2025-09-21T14:35:11.788020Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-02-08T12:35:35Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: AMOUR (255719113012)
SELECT id FROM customers WHERE phone = '255719113012';


-- Insert new customer: AMOUR (255719113012)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'ed064b59-a7a5-470d-a244-31c186dcf81d',
    'AMOUR',
    '255719113012',
    NULL,
    '255719113012',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    130000,
    '2022-11-15T20:32:17Z',
    130,
    'SMS Import',
    1,
    '2022-11-15T20:32:17Z',
    '2022-11-15T20:32:17Z',
    '2025-09-21T14:35:11.786721Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-11-15T20:32:17Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: CLEMENCE (255719793143)
SELECT id FROM customers WHERE phone = '255719793143';


-- Insert new customer: CLEMENCE (255719793143)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'd3caf8dc-9c94-4a9a-9cd5-51e7a08a1e18',
    'CLEMENCE',
    '255719793143',
    NULL,
    '255719793143',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 2',
    True,
    'purchased',
    'bronze',
    130000,
    '2023-02-28T10:43:12Z',
    130,
    'SMS Import',
    2,
    '2023-02-28T10:43:12Z',
    '2022-11-28T13:33:09Z',
    '2025-09-21T14:35:11.786826Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-11-28T13:33:09Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: FLAVIUS (255676771949)
SELECT id FROM customers WHERE phone = '255676771949';


-- Insert new customer: FLAVIUS (255676771949)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '03002e5f-4755-466a-adfc-af7623651fe8',
    'FLAVIUS',
    '255676771949',
    NULL,
    '255676771949',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    120000,
    '2022-09-26T15:57:17Z',
    120,
    'SMS Import',
    1,
    '2022-09-26T15:57:17Z',
    '2022-09-26T15:57:17Z',
    '2025-09-21T14:35:11.785822Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-26T15:57:17Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: PETER (255678333672)
SELECT id FROM customers WHERE phone = '255678333672';


-- Insert new customer: PETER (255678333672)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'f4345652-f5e3-4ff4-ad80-82c1e41bd90b',
    'PETER',
    '255678333672',
    NULL,
    '255678333672',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    105000,
    '2022-09-17T11:31:50Z',
    105,
    'SMS Import',
    1,
    '2022-09-17T11:31:50Z',
    '2022-09-17T11:31:50Z',
    '2025-09-21T14:35:11.785578Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-17T11:31:50Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: INNOCENT (255673419493)
SELECT id FROM customers WHERE phone = '255673419493';


-- Insert new customer: INNOCENT (255673419493)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'ee15cd63-9984-4e72-b3bc-3a74bc6f4014',
    'INNOCENT',
    '255673419493',
    NULL,
    '255673419493',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    105000,
    '2022-11-03T20:24:42Z',
    105,
    'SMS Import',
    1,
    '2022-11-03T20:24:42Z',
    '2022-11-03T20:24:42Z',
    '2025-09-21T14:35:11.786551Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-11-03T20:24:42Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: ISAKWISA (255656870345)
SELECT id FROM customers WHERE phone = '255656870345';


-- Insert new customer: ISAKWISA (255656870345)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'f20a1007-2fc2-4aaf-9b8b-1179e1f2e29e',
    'ISAKWISA',
    '255656870345',
    NULL,
    '255656870345',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    100000,
    '2022-10-01T20:44:21Z',
    100,
    'SMS Import',
    1,
    '2022-10-01T20:44:21Z',
    '2022-10-01T20:44:21Z',
    '2025-09-21T14:35:11.785994Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-10-01T20:44:21Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: SUZANA (255719100544)
SELECT id FROM customers WHERE phone = '255719100544';


-- Insert new customer: SUZANA (255719100544)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'a6f0aaf9-5220-4f54-8839-9a4499a7c27f',
    'SUZANA',
    '255719100544',
    NULL,
    '255719100544',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    100000,
    '2022-12-23T16:46:12Z',
    100,
    'SMS Import',
    1,
    '2022-12-23T16:46:12Z',
    '2022-12-23T16:46:12Z',
    '2025-09-21T14:35:11.787158Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-12-23T16:46:12Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: CHRISTOPHER (255653977233)
SELECT id FROM customers WHERE phone = '255653977233';


-- Insert new customer: CHRISTOPHER (255653977233)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '80608294-d096-49c1-884d-ea670ef5069c',
    'CHRISTOPHER',
    '255653977233',
    NULL,
    '255653977233',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    100000,
    '2023-01-24T18:51:53Z',
    100,
    'SMS Import',
    1,
    '2023-01-24T18:51:53Z',
    '2023-01-24T18:51:53Z',
    '2025-09-21T14:35:11.787822Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-01-24T18:51:53Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: PAUL (255715194263)
SELECT id FROM customers WHERE phone = '255715194263';


-- Insert new customer: PAUL (255715194263)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'a7875f01-0471-438b-98e6-f4dc51556882',
    'PAUL',
    '255715194263',
    NULL,
    '255715194263',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    100000,
    '2023-02-06T15:25:11Z',
    100,
    'SMS Import',
    1,
    '2023-02-06T15:25:11Z',
    '2023-02-06T15:25:11Z',
    '2025-09-21T14:35:11.787991Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-02-06T15:25:11Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: DEUS (255654233617)
SELECT id FROM customers WHERE phone = '255654233617';


-- Insert new customer: DEUS (255654233617)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '76fece64-f107-47ca-ae1e-71c5d7649a5d',
    'DEUS',
    '255654233617',
    NULL,
    '255654233617',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'purchased',
    'bronze',
    100000,
    '2023-02-13T20:33:56Z',
    100,
    'SMS Import',
    1,
    '2023-02-13T20:33:56Z',
    '2023-02-13T20:33:56Z',
    '2025-09-21T14:35:11.788142Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-02-13T20:33:56Z',
    'purchased'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: PATRICK (255675410470)
SELECT id FROM customers WHERE phone = '255675410470';


-- Insert new customer: PATRICK (255675410470)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '4056027d-a061-47fc-9069-ab6633ace86b',
    'PATRICK',
    '255675410470',
    NULL,
    '255675410470',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 2',
    True,
    'new',
    'bronze',
    90000,
    '2022-12-23T15:51:45Z',
    90,
    'SMS Import',
    2,
    '2022-12-23T15:51:45Z',
    '2022-12-23T15:29:02Z',
    '2025-09-21T14:35:11.787144Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-12-23T15:29:02Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: GLORY (255710495852)
SELECT id FROM customers WHERE phone = '255710495852';


-- Insert new customer: GLORY (255710495852)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'f955dc6c-982f-43e3-a0fe-9173fd293a7a',
    'GLORY',
    '255710495852',
    NULL,
    '255710495852',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    90000,
    '2022-12-30T18:11:00Z',
    90,
    'SMS Import',
    1,
    '2022-12-30T18:11:00Z',
    '2022-12-30T18:11:00Z',
    '2025-09-21T14:35:11.787205Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-12-30T18:11:00Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: JOSEPH (255710925886)
SELECT id FROM customers WHERE phone = '255710925886';


-- Insert new customer: JOSEPH (255710925886)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '27fecbf5-4187-44ae-af89-8f145154dbe5',
    'JOSEPH',
    '255710925886',
    NULL,
    '255710925886',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    90000,
    '2023-02-08T21:34:00Z',
    90,
    'SMS Import',
    1,
    '2023-02-08T21:34:00Z',
    '2023-02-08T21:34:00Z',
    '2025-09-21T14:35:11.788049Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-02-08T21:34:00Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: HONEST (255712143985)
SELECT id FROM customers WHERE phone = '255712143985';


-- Insert new customer: HONEST (255712143985)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '2162b8fd-42ab-43d2-a71e-4baec5d22a71',
    'HONEST',
    '255712143985',
    NULL,
    '255712143985',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 2',
    True,
    'new',
    'bronze',
    85000,
    '2023-01-03T17:33:19Z',
    85,
    'SMS Import',
    2,
    '2023-01-03T17:33:19Z',
    '2023-01-03T16:57:38Z',
    '2025-09-21T14:35:11.787257Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-01-03T16:57:38Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: LUCAS (255716481313)
SELECT id FROM customers WHERE phone = '255716481313';


-- Insert new customer: LUCAS (255716481313)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '70a5ac8d-f52c-487a-a758-37b1555dad1f',
    'LUCAS',
    '255716481313',
    NULL,
    '255716481313',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    85000,
    '2023-02-27T16:35:01Z',
    85,
    'SMS Import',
    1,
    '2023-02-27T16:35:01Z',
    '2023-02-27T16:35:01Z',
    '2025-09-21T14:35:11.788270Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-02-27T16:35:01Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: ASHA (255653006424)
SELECT id FROM customers WHERE phone = '255653006424';


-- Insert new customer: ASHA (255653006424)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'e9587940-879c-4c96-a291-2382fdadd312',
    'ASHA',
    '255653006424',
    NULL,
    '255653006424',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 2',
    True,
    'new',
    'bronze',
    70000,
    '2022-09-10T16:06:56Z',
    70,
    'SMS Import',
    2,
    '2022-09-10T16:06:56Z',
    '2022-09-09T18:32:27Z',
    '2025-09-21T14:35:11.784029Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-09T18:32:27Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: CHRISTINA (255652710536)
SELECT id FROM customers WHERE phone = '255652710536';


-- Insert new customer: CHRISTINA (255652710536)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'fe07f79c-cffd-4d03-b0ec-5bfc750b3bd0',
    'CHRISTINA',
    '255652710536',
    NULL,
    '255652710536',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    70000,
    '2022-09-24T15:52:37Z',
    70,
    'SMS Import',
    1,
    '2022-09-24T15:52:37Z',
    '2022-09-24T15:52:37Z',
    '2025-09-21T14:35:11.785782Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-24T15:52:37Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: JOSHUA (255714797103)
SELECT id FROM customers WHERE phone = '255714797103';


-- Insert new customer: JOSHUA (255714797103)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'c02916d5-bf13-4a3d-a9e8-b4214cad09d7',
    'JOSHUA',
    '255714797103',
    NULL,
    '255714797103',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    70000,
    '2022-10-18T18:08:01Z',
    70,
    'SMS Import',
    1,
    '2022-10-18T18:08:01Z',
    '2022-10-18T18:08:01Z',
    '2025-09-21T14:35:11.786296Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-10-18T18:08:01Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: NEEMA (255676471785)
SELECT id FROM customers WHERE phone = '255676471785';


-- Insert new customer: NEEMA (255676471785)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '990f35e2-46d8-40b9-a7ec-eae750416f0a',
    'NEEMA',
    '255676471785',
    NULL,
    '255676471785',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    70000,
    '2022-10-25T14:13:16Z',
    70,
    'SMS Import',
    1,
    '2022-10-25T14:13:16Z',
    '2022-10-25T14:13:16Z',
    '2025-09-21T14:35:11.786404Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-10-25T14:13:16Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: MAGRETH (255718652812)
SELECT id FROM customers WHERE phone = '255718652812';


-- Insert new customer: MAGRETH (255718652812)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'c1c8d724-3518-4ddc-83ce-8c2f8b37c498',
    'MAGRETH',
    '255718652812',
    NULL,
    '255718652812',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    70000,
    '2023-01-09T15:31:27Z',
    70,
    'SMS Import',
    1,
    '2023-01-09T15:31:27Z',
    '2023-01-09T15:31:27Z',
    '2025-09-21T14:35:11.787341Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-01-09T15:31:27Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: WILLIAM (255674984328)
SELECT id FROM customers WHERE phone = '255674984328';


-- Insert new customer: WILLIAM (255674984328)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '409cb4b7-0082-474d-b749-75a956b55ac5',
    'WILLIAM',
    '255674984328',
    NULL,
    '255674984328',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    67000,
    '2022-09-29T13:27:31Z',
    67,
    'SMS Import',
    1,
    '2022-09-29T13:27:31Z',
    '2022-09-29T13:27:31Z',
    '2025-09-21T14:35:11.785897Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-29T13:27:31Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: DAZZLER OUTLET (25571125160)
SELECT id FROM customers WHERE phone = '25571125160';


-- Insert new customer: DAZZLER OUTLET (25571125160)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '8eab75eb-17a5-4876-8b2b-522ff18ed412',
    'DAZZLER OUTLET',
    '25571125160',
    NULL,
    '25571125160',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    67000,
    '2022-11-13T23:45:24Z',
    67,
    'SMS Import',
    1,
    '2022-11-13T23:45:24Z',
    '2022-11-13T23:45:24Z',
    '2025-09-21T14:35:11.786666Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-11-13T23:45:24Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: DENIS (255672710938)
SELECT id FROM customers WHERE phone = '255672710938';


-- Insert new customer: DENIS (255672710938)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '3f882432-90dc-44fc-b4e6-1f71143aa3be',
    'DENIS',
    '255672710938',
    NULL,
    '255672710938',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 2',
    True,
    'new',
    'bronze',
    65000,
    '2022-09-13T22:45:56Z',
    65,
    'SMS Import',
    2,
    '2022-09-13T22:45:56Z',
    '2022-09-13T22:38:24Z',
    '2025-09-21T14:35:11.785452Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-13T22:38:24Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: ANTHONY (255713333322)
SELECT id FROM customers WHERE phone = '255713333322';


-- Insert new customer: ANTHONY (255713333322)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'ee318342-2e57-439b-9589-beaabf628db7',
    'ANTHONY',
    '255713333322',
    NULL,
    '255713333322',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    65000,
    '2022-09-16T15:25:57Z',
    65,
    'SMS Import',
    1,
    '2022-09-16T15:25:57Z',
    '2022-09-16T15:25:57Z',
    '2025-09-21T14:35:11.785563Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-16T15:25:57Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: FRANK (255656326087)
SELECT id FROM customers WHERE phone = '255656326087';


-- Insert new customer: FRANK (255656326087)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'e1d3cb6d-f470-42fa-97c2-d5985aca3b42',
    'FRANK',
    '255656326087',
    NULL,
    '255656326087',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    65000,
    '2022-11-20T16:30:43Z',
    65,
    'SMS Import',
    1,
    '2022-11-20T16:30:43Z',
    '2022-11-20T16:30:43Z',
    '2025-09-21T14:35:11.786752Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-11-20T16:30:43Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: NANCY (255714985378)
SELECT id FROM customers WHERE phone = '255714985378';


-- Insert new customer: NANCY (255714985378)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'e291cbdd-78c7-4529-8eb1-73b1a59b79ff',
    'NANCY',
    '255714985378',
    NULL,
    '255714985378',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 2',
    True,
    'new',
    'bronze',
    60000,
    '2023-01-18T20:36:55Z',
    60,
    'SMS Import',
    2,
    '2023-01-18T20:36:55Z',
    '2023-01-18T18:55:54Z',
    '2025-09-21T14:35:11.787729Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-01-18T18:55:54Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: EMANUEL (255716623234)
SELECT id FROM customers WHERE phone = '255716623234';


-- Insert new customer: EMANUEL (255716623234)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '2f8fdf04-3a99-4d9e-8b35-16ddf842e81d',
    'EMANUEL',
    '255716623234',
    NULL,
    '255716623234',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    58000,
    '2023-01-18T16:03:00Z',
    58,
    'SMS Import',
    1,
    '2023-01-18T16:03:00Z',
    '2023-01-18T16:03:00Z',
    '2025-09-21T14:35:11.787705Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-01-18T16:03:00Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: MOHAMED (255717742525)
SELECT id FROM customers WHERE phone = '255717742525';


-- Insert new customer: MOHAMED (255717742525)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'ceda83ab-8106-4e6b-8d2d-48d1b491d625',
    'MOHAMED',
    '255717742525',
    NULL,
    '255717742525',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    55000,
    '2022-09-05T11:46:16Z',
    55,
    'SMS Import',
    1,
    '2022-09-05T11:46:16Z',
    '2022-09-05T11:46:16Z',
    '2025-09-21T14:35:11.781021Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-05T11:46:16Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: MOSES (255717443384)
SELECT id FROM customers WHERE phone = '255717443384';


-- Insert new customer: MOSES (255717443384)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '903865b9-9c01-4996-97ad-bc165fb335b5',
    'MOSES',
    '255717443384',
    NULL,
    '255717443384',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    55000,
    '2022-10-27T13:34:39Z',
    55,
    'SMS Import',
    1,
    '2022-10-27T13:34:39Z',
    '2022-10-27T13:34:39Z',
    '2025-09-21T14:35:11.786461Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-10-27T13:34:39Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: CHRISTIAN (255715173596)
SELECT id FROM customers WHERE phone = '255715173596';


-- Insert new customer: CHRISTIAN (255715173596)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '39933509-1d03-4db0-bfb4-65431b87b5ae',
    'CHRISTIAN',
    '255715173596',
    NULL,
    '255715173596',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    50000,
    '2022-09-21T14:59:45Z',
    50,
    'SMS Import',
    1,
    '2022-09-21T14:59:45Z',
    '2022-09-21T14:59:45Z',
    '2025-09-21T14:35:11.785709Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-21T14:59:45Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: MODEST (255716399697)
SELECT id FROM customers WHERE phone = '255716399697';


-- Insert new customer: MODEST (255716399697)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '272cfafd-9435-4a8f-b9b3-ecb1431217c6',
    'MODEST',
    '255716399697',
    NULL,
    '255716399697',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    50000,
    '2022-12-19T14:15:33Z',
    50,
    'SMS Import',
    1,
    '2022-12-19T14:15:33Z',
    '2022-12-19T14:15:33Z',
    '2025-09-21T14:35:11.787105Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-12-19T14:15:33Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: CALVIN (255719561561)
SELECT id FROM customers WHERE phone = '255719561561';


-- Insert new customer: CALVIN (255719561561)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '50f366a8-1f6c-43da-9a93-41f10f80392c',
    'CALVIN',
    '255719561561',
    NULL,
    '255719561561',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    50000,
    '2023-01-10T13:47:41Z',
    50,
    'SMS Import',
    1,
    '2023-01-10T13:47:41Z',
    '2023-01-10T13:47:41Z',
    '2025-09-21T14:35:11.787388Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-01-10T13:47:41Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: MOHAMED (255717592335)
SELECT id FROM customers WHERE phone = '255717592335';


-- Insert new customer: MOHAMED (255717592335)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'd0a05726-4f8d-40a2-a14c-7409215a090c',
    'MOHAMED',
    '255717592335',
    NULL,
    '255717592335',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    50000,
    '2023-01-10T13:53:06Z',
    50,
    'SMS Import',
    1,
    '2023-01-10T13:53:06Z',
    '2023-01-10T13:53:06Z',
    '2025-09-21T14:35:11.787403Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-01-10T13:53:06Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: GODFREY (255713123334)
SELECT id FROM customers WHERE phone = '255713123334';


-- Insert new customer: GODFREY (255713123334)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '465f3b9a-52ec-4ff6-8031-b347ac972377',
    'GODFREY',
    '255713123334',
    NULL,
    '255713123334',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    50000,
    '2023-02-21T17:45:31Z',
    50,
    'SMS Import',
    1,
    '2023-02-21T17:45:31Z',
    '2023-02-21T17:45:31Z',
    '2025-09-21T14:35:11.788255Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-02-21T17:45:31Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: AHMED (255712259767)
SELECT id FROM customers WHERE phone = '255712259767';


-- Insert new customer: AHMED (255712259767)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '62fb166b-d931-46f3-a676-8daa52a1f5bf',
    'AHMED',
    '255712259767',
    NULL,
    '255712259767',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    45000,
    '2022-10-05T10:59:49Z',
    45,
    'SMS Import',
    1,
    '2022-10-05T10:59:49Z',
    '2022-10-05T10:59:49Z',
    '2025-09-21T14:35:11.786070Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-10-05T10:59:49Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: AARON (255679176387)
SELECT id FROM customers WHERE phone = '255679176387';


-- Insert new customer: AARON (255679176387)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '71df163d-829b-42cb-a4d5-c3fa77aaf00e',
    'AARON',
    '255679176387',
    NULL,
    '255679176387',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    45000,
    '2022-12-14T19:48:30Z',
    45,
    'SMS Import',
    1,
    '2022-12-14T19:48:30Z',
    '2022-12-14T19:48:30Z',
    '2025-09-21T14:35:11.787012Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-12-14T19:48:30Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: AMANI (255714985685)
SELECT id FROM customers WHERE phone = '255714985685';


-- Insert new customer: AMANI (255714985685)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '8bc9c12e-a58d-4b11-931e-403ba58a0871',
    'AMANI',
    '255714985685',
    NULL,
    '255714985685',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 2',
    True,
    'new',
    'bronze',
    45000,
    '2023-02-04T13:05:15Z',
    45,
    'SMS Import',
    2,
    '2023-02-04T13:05:15Z',
    '2023-02-04T12:37:42Z',
    '2025-09-21T14:35:11.787976Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-02-04T12:37:42Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: SAMWEL (255656668144)
SELECT id FROM customers WHERE phone = '255656668144';


-- Insert new customer: SAMWEL (255656668144)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'e2ecdfba-c465-463a-82c1-2b8bfcdc451e',
    'SAMWEL',
    '255656668144',
    NULL,
    '255656668144',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    40000,
    '2022-12-06T15:08:46Z',
    40,
    'SMS Import',
    1,
    '2022-12-06T15:08:46Z',
    '2022-12-06T15:08:46Z',
    '2025-09-21T14:35:11.786872Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-12-06T15:08:46Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: TRUDY TRENDS (25571245238)
SELECT id FROM customers WHERE phone = '25571245238';


-- Insert new customer: TRUDY TRENDS (25571245238)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '69111210-47bc-467c-b16f-30e034d1ef44',
    'TRUDY TRENDS',
    '25571245238',
    NULL,
    '25571245238',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    35000,
    '2022-11-23T09:59:31Z',
    35,
    'SMS Import',
    1,
    '2022-11-23T09:59:31Z',
    '2022-11-23T09:59:31Z',
    '2025-09-21T14:35:11.786767Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-11-23T09:59:31Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: DANIEL (255718111711)
SELECT id FROM customers WHERE phone = '255718111711';


-- Insert new customer: DANIEL (255718111711)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'ab3039aa-ffd8-4e5f-bfc3-b8be191db703',
    'DANIEL',
    '255718111711',
    NULL,
    '255718111711',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    35000,
    '2022-12-13T15:31:33Z',
    35,
    'SMS Import',
    1,
    '2022-12-13T15:31:33Z',
    '2022-12-13T15:31:33Z',
    '2025-09-21T14:35:11.786997Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-12-13T15:31:33Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: HENRICK RUGAIYULULA (255656326612)
SELECT id FROM customers WHERE phone = '255656326612';


-- Insert new customer: HENRICK RUGAIYULULA (255656326612)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '0a60081a-76bb-4f4a-aa77-e35216013ccd',
    'HENRICK RUGAIYULULA',
    '255656326612',
    NULL,
    '255656326612',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    35000,
    '2023-01-24T17:36:25Z',
    35,
    'SMS Import',
    1,
    '2023-01-24T17:36:25Z',
    '2023-01-24T17:36:25Z',
    '2025-09-21T14:35:11.787807Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-01-24T17:36:25Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: JEFFERSON (255713571375)
SELECT id FROM customers WHERE phone = '255713571375';


-- Insert new customer: JEFFERSON (255713571375)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'cd2be733-c5a3-4626-bd85-3d4efcafb51a',
    'JEFFERSON',
    '255713571375',
    NULL,
    '255713571375',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    35000,
    '2023-02-08T18:25:39Z',
    35,
    'SMS Import',
    1,
    '2023-02-08T18:25:39Z',
    '2023-02-08T18:25:39Z',
    '2025-09-21T14:35:11.788035Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-02-08T18:25:39Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: GELWIN (255657002014)
SELECT id FROM customers WHERE phone = '255657002014';


-- Insert new customer: GELWIN (255657002014)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '682762ed-e242-4abf-8a36-5c31b119988a',
    'GELWIN',
    '255657002014',
    NULL,
    '255657002014',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    30000,
    '2022-09-17T18:36:41Z',
    30,
    'SMS Import',
    1,
    '2022-09-17T18:36:41Z',
    '2022-09-17T18:36:41Z',
    '2025-09-21T14:35:11.785594Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-17T18:36:41Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: DAMIAN (255713326229)
SELECT id FROM customers WHERE phone = '255713326229';


-- Insert new customer: DAMIAN (255713326229)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '0ea1e1c8-917b-4e7b-9c55-c588f918ede8',
    'DAMIAN',
    '255713326229',
    NULL,
    '255713326229',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    30000,
    '2022-11-07T10:44:15Z',
    30,
    'SMS Import',
    1,
    '2022-11-07T10:44:15Z',
    '2022-11-07T10:44:15Z',
    '2025-09-21T14:35:11.786598Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-11-07T10:44:15Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: ENOCK (255652641317)
SELECT id FROM customers WHERE phone = '255652641317';


-- Insert new customer: ENOCK (255652641317)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '320d2ce3-970e-4675-b3a1-e0b9ce54722b',
    'ENOCK',
    '255652641317',
    NULL,
    '255652641317',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    30000,
    '2022-12-31T12:44:54Z',
    30,
    'SMS Import',
    1,
    '2022-12-31T12:44:54Z',
    '2022-12-31T12:44:54Z',
    '2025-09-21T14:35:11.787220Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-12-31T12:44:54Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: MICHAEL (255713288162)
SELECT id FROM customers WHERE phone = '255713288162';


-- Insert new customer: MICHAEL (255713288162)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '66813c43-9b10-4dbe-a6f6-603f12075bb3',
    'MICHAEL',
    '255713288162',
    NULL,
    '255713288162',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    29000,
    '2023-01-16T21:40:05Z',
    29,
    'SMS Import',
    1,
    '2023-01-16T21:40:05Z',
    '2023-01-16T21:40:05Z',
    '2025-09-21T14:35:11.787689Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-01-16T21:40:05Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: BARAKA (255718599927)
SELECT id FROM customers WHERE phone = '255718599927';


-- Insert new customer: BARAKA (255718599927)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '0bdb20b3-82e7-4306-8174-b6485a35ec35',
    'BARAKA',
    '255718599927',
    NULL,
    '255718599927',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    25000,
    '2022-10-15T18:53:17Z',
    25,
    'SMS Import',
    1,
    '2022-10-15T18:53:17Z',
    '2022-10-15T18:53:17Z',
    '2025-09-21T14:35:11.786210Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-10-15T18:53:17Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: PILI (255675153248)
SELECT id FROM customers WHERE phone = '255675153248';


-- Insert new customer: PILI (255675153248)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'da175f39-cdff-4f3f-af3d-5b939dfc1bd8',
    'PILI',
    '255675153248',
    NULL,
    '255675153248',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    20000,
    '2022-09-12T19:42:23Z',
    20,
    'SMS Import',
    1,
    '2022-09-12T19:42:23Z',
    '2022-09-12T19:42:23Z',
    '2025-09-21T14:35:11.785402Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-12T19:42:23Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: BENJAMIN (255679695596)
SELECT id FROM customers WHERE phone = '255679695596';


-- Insert new customer: BENJAMIN (255679695596)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '1977bf52-ace5-49d3-8608-5da355ce0a34',
    'BENJAMIN',
    '255679695596',
    NULL,
    '255679695596',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    20000,
    '2022-11-23T11:26:23Z',
    20,
    'SMS Import',
    1,
    '2022-11-23T11:26:23Z',
    '2022-11-23T11:26:23Z',
    '2025-09-21T14:35:11.786786Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-11-23T11:26:23Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: BERNARD (255719242631)
SELECT id FROM customers WHERE phone = '255719242631';


-- Insert new customer: BERNARD (255719242631)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'ec6293b9-8451-4e71-869a-e395bb8c41ee',
    'BERNARD',
    '255719242631',
    NULL,
    '255719242631',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    20000,
    '2022-12-30T11:49:04Z',
    20,
    'SMS Import',
    1,
    '2022-12-30T11:49:04Z',
    '2022-12-30T11:49:04Z',
    '2025-09-21T14:35:11.787190Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-12-30T11:49:04Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: HUSSEIN (255710506767)
SELECT id FROM customers WHERE phone = '255710506767';


-- Insert new customer: HUSSEIN (255710506767)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'dc0bfb29-b8e4-4a25-8b4d-40b2f3d7195f',
    'HUSSEIN',
    '255710506767',
    NULL,
    '255710506767',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    19500,
    '2023-01-30T22:48:30Z',
    19,
    'SMS Import',
    1,
    '2023-01-30T22:48:30Z',
    '2023-01-30T22:48:30Z',
    '2025-09-21T14:35:11.787916Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-01-30T22:48:30Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: EDGER (255714661379)
SELECT id FROM customers WHERE phone = '255714661379';


-- Insert new customer: EDGER (255714661379)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '4ed9cdcd-6059-41bd-9b05-ad39a72097a0',
    'EDGER',
    '255714661379',
    NULL,
    '255714661379',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    19000,
    '2022-09-08T18:51:36Z',
    19,
    'SMS Import',
    1,
    '2022-09-08T18:51:36Z',
    '2022-09-08T18:51:36Z',
    '2025-09-21T14:35:11.783769Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-08T18:51:36Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: DICKSON (255655118291)
SELECT id FROM customers WHERE phone = '255655118291';


-- Insert new customer: DICKSON (255655118291)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '90ed5832-50c2-4dd3-94cb-bb31ce10e5cb',
    'DICKSON',
    '255655118291',
    NULL,
    '255655118291',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    19000,
    '2023-01-21T18:08:40Z',
    19,
    'SMS Import',
    1,
    '2023-01-21T18:08:40Z',
    '2023-01-21T18:08:40Z',
    '2025-09-21T14:35:11.787759Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-01-21T18:08:40Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: RAMADHANI (255677445627)
SELECT id FROM customers WHERE phone = '255677445627';


-- Insert new customer: RAMADHANI (255677445627)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '410af348-9654-4e2f-a647-7d6e00900643',
    'RAMADHANI',
    '255677445627',
    NULL,
    '255677445627',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    18000,
    '2022-10-11T14:36:39Z',
    18,
    'SMS Import',
    1,
    '2022-10-11T14:36:39Z',
    '2022-10-11T14:36:39Z',
    '2025-09-21T14:35:11.786141Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-10-11T14:36:39Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: WILLIAM (255672791438)
SELECT id FROM customers WHERE phone = '255672791438';


-- Insert new customer: WILLIAM (255672791438)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '938de01e-57b2-4bd4-898c-850a64951cc1',
    'WILLIAM',
    '255672791438',
    NULL,
    '255672791438',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    15000,
    '2022-11-07T19:14:49Z',
    15,
    'SMS Import',
    1,
    '2022-11-07T19:14:49Z',
    '2022-11-07T19:14:49Z',
    '2025-09-21T14:35:11.786612Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-11-07T19:14:49Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: ALFREDY (255714411910)
SELECT id FROM customers WHERE phone = '255714411910';


-- Insert new customer: ALFREDY (255714411910)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '294ceb86-ec1c-468b-a038-d66fae0da1ec',
    'ALFREDY',
    '255714411910',
    NULL,
    '255714411910',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    15000,
    '2022-11-16T19:19:28Z',
    15,
    'SMS Import',
    1,
    '2022-11-16T19:19:28Z',
    '2022-11-16T19:19:28Z',
    '2025-09-21T14:35:11.786736Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-11-16T19:19:28Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: JACQUELINE (255653649336)
SELECT id FROM customers WHERE phone = '255653649336';


-- Insert new customer: JACQUELINE (255653649336)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'f386dc8c-a56a-4725-8711-cd02cd97e91d',
    'JACQUELINE',
    '255653649336',
    NULL,
    '255653649336',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    14500,
    '2022-10-24T18:50:48Z',
    14,
    'SMS Import',
    1,
    '2022-10-24T18:50:48Z',
    '2022-10-24T18:50:48Z',
    '2025-09-21T14:35:11.786390Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-10-24T18:50:48Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: BEATRICE (255656007681)
SELECT id FROM customers WHERE phone = '255656007681';


-- Insert new customer: BEATRICE (255656007681)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '05b8a1fd-918b-4917-95b9-1475d33e3180',
    'BEATRICE',
    '255656007681',
    NULL,
    '255656007681',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    10000,
    '2022-09-22T12:16:13Z',
    10,
    'SMS Import',
    1,
    '2022-09-22T12:16:13Z',
    '2022-09-22T12:16:13Z',
    '2025-09-21T14:35:11.785725Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-22T12:16:13Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: GLORIOUS (255656613148)
SELECT id FROM customers WHERE phone = '255656613148';


-- Insert new customer: GLORIOUS (255656613148)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'c31e1493-5a9e-4b9b-9769-d272cfa5010a',
    'GLORIOUS',
    '255656613148',
    NULL,
    '255656613148',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    10000,
    '2022-09-30T20:30:14Z',
    10,
    'SMS Import',
    1,
    '2022-09-30T20:30:14Z',
    '2022-09-30T20:30:14Z',
    '2025-09-21T14:35:11.785979Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-09-30T20:30:14Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: ELIAS (255719007488)
SELECT id FROM customers WHERE phone = '255719007488';


-- Insert new customer: ELIAS (255719007488)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'cf9bde9d-0f0c-4456-943b-9a4c44ed8967',
    'ELIAS',
    '255719007488',
    NULL,
    '255719007488',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    10000,
    '2022-10-02T18:30:29Z',
    10,
    'SMS Import',
    1,
    '2022-10-02T18:30:29Z',
    '2022-10-02T18:30:29Z',
    '2025-09-21T14:35:11.786024Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-10-02T18:30:29Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: PETER (255712778182)
SELECT id FROM customers WHERE phone = '255712778182';


-- Insert new customer: PETER (255712778182)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '539b9caf-601b-41d9-a271-57a0272bdd34',
    'PETER',
    '255712778182',
    NULL,
    '255712778182',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    10000,
    '2022-10-11T14:48:28Z',
    10,
    'SMS Import',
    1,
    '2022-10-11T14:48:28Z',
    '2022-10-11T14:48:28Z',
    '2025-09-21T14:35:11.786156Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-10-11T14:48:28Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: OSCAR (255717088160)
SELECT id FROM customers WHERE phone = '255717088160';


-- Insert new customer: OSCAR (255717088160)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '19507427-c21a-4a3a-b591-d6a2e12625e4',
    'OSCAR',
    '255717088160',
    NULL,
    '255717088160',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    10000,
    '2022-10-14T19:25:20Z',
    10,
    'SMS Import',
    1,
    '2022-10-14T19:25:20Z',
    '2022-10-14T19:25:20Z',
    '2025-09-21T14:35:11.786171Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-10-14T19:25:20Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: RACHEL (255653007661)
SELECT id FROM customers WHERE phone = '255653007661';


-- Insert new customer: RACHEL (255653007661)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'be6c6104-1a56-476d-b9ce-305fc5eb5d76',
    'RACHEL',
    '255653007661',
    NULL,
    '255653007661',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    10000,
    '2022-10-28T14:30:24Z',
    10,
    'SMS Import',
    1,
    '2022-10-28T14:30:24Z',
    '2022-10-28T14:30:24Z',
    '2025-09-21T14:35:11.786476Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-10-28T14:30:24Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: MWASHI (255716849554)
SELECT id FROM customers WHERE phone = '255716849554';


-- Insert new customer: MWASHI (255716849554)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    'dae121d1-5528-4d63-9f8f-449ae3f61c7b',
    'MWASHI',
    '255716849554',
    NULL,
    '255716849554',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    10000,
    '2022-12-10T18:57:05Z',
    10,
    'SMS Import',
    1,
    '2022-12-10T18:57:05Z',
    '2022-12-10T18:57:05Z',
    '2025-09-21T14:35:11.786965Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-12-10T18:57:05Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: KUDRAT (255659846367)
SELECT id FROM customers WHERE phone = '255659846367';


-- Insert new customer: KUDRAT (255659846367)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '54a9fe7f-f4ce-4587-bb17-ee6c9f7d2aa3',
    'KUDRAT',
    '255659846367',
    NULL,
    '255659846367',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    10000,
    '2022-12-15T20:00:09Z',
    10,
    'SMS Import',
    1,
    '2022-12-15T20:00:09Z',
    '2022-12-15T20:00:09Z',
    '2025-09-21T14:35:11.787027Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2022-12-15T20:00:09Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;


-- Check if customer exists: Customer 1540 (25571551540)
SELECT id FROM customers WHERE phone = '25571551540';


-- Insert new customer: Customer 1540 (25571551540)
INSERT INTO customers (
    id, name, phone, email, whatsapp, gender, city, country, 
    notes, is_active, color_tag, loyalty_level, total_spent, 
    last_visit, points, referral_source, total_purchases, 
    last_purchase_date, created_at, updated_at, created_by, 
    whatsapp_opt_out, initial_notes, customer_tag
) VALUES (
    '59d10464-20c6-4cbb-b0ad-451f29d5a8aa',
    'Customer 1540',
    '25571551540',
    NULL,
    '25571551540',
    'other',
    'Dar es Salaam',
    'Tanzania',
    'Auto-imported from SMS transactions. Total transactions: 1',
    True,
    'new',
    'bronze',
    10000,
    '2023-01-11T19:30:45Z',
    10,
    'SMS Import',
    1,
    '2023-01-11T19:30:45Z',
    '2023-01-11T19:30:45Z',
    '2025-09-21T14:35:11.787455Z',
    'system_import',
    False,
    'Customer imported from SMS transaction data. First transaction: 2023-01-11T19:30:45Z',
    'new'
) ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    total_spent = EXCLUDED.total_spent,
    loyalty_level = EXCLUDED.loyalty_level,
    color_tag = EXCLUDED.color_tag,
    points = EXCLUDED.points,
    last_visit = EXCLUDED.last_visit,
    total_purchases = EXCLUDED.total_purchases,
    last_purchase_date = EXCLUDED.last_purchase_date,
    updated_at = EXCLUDED.updated_at,
    customer_tag = EXCLUDED.customer_tag;

