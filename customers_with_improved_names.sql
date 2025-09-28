-- Customer Database Updates with Improved Names
-- Generated automatically from transaction analysis

-- Ensure all required columns exist
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS total_spent NUMERIC(12,2) DEFAULT 0;

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS loyalty_level TEXT DEFAULT 'bronze';

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS color_tag TEXT DEFAULT 'new';

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS total_purchases INTEGER DEFAULT 0;

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS last_visit TIMESTAMP WITH TIME ZONE;

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMP WITH TIME ZONE;


-- Update SIMU KITAA (25571184504)
UPDATE customers SET
    name = 'SIMU KITAA',
    total_spent = 4930000,
    points = 4930,
    loyalty_level = 'platinum',
    color_tag = 'vip',
    total_purchases = 2,
    last_visit = '2023-01-20T21:31:01Z',
    last_purchase_date = '2023-01-20T21:31:01Z',
    updated_at = NOW()
WHERE phone = '25571184504';

-- Update INAUZWA ELECTRONICS (25571145721)
UPDATE customers SET
    name = 'INAUZWA ELECTRONICS',
    total_spent = 4363250,
    points = 4363,
    loyalty_level = 'platinum',
    color_tag = 'vip',
    total_purchases = 22,
    last_visit = '2024-09-27T12:17:07Z',
    last_purchase_date = '2024-09-27T12:17:07Z',
    updated_at = NOW()
WHERE phone = '25571145721';

-- Update RICKY (255657463697)
UPDATE customers SET
    name = 'RICKY',
    total_spent = 4105000,
    points = 4105,
    loyalty_level = 'platinum',
    color_tag = 'vip',
    total_purchases = 4,
    last_visit = '2023-01-12T14:33:12Z',
    last_purchase_date = '2023-01-12T14:33:12Z',
    updated_at = NOW()
WHERE phone = '255657463697';

-- Update ABDALLA (255774195002)
UPDATE customers SET
    name = 'ABDALLA',
    total_spent = 3790000,
    points = 3790,
    loyalty_level = 'platinum',
    color_tag = 'vip',
    total_purchases = 2,
    last_visit = '2023-02-12T20:07:18Z',
    last_purchase_date = '2023-02-12T20:07:18Z',
    updated_at = NOW()
WHERE phone = '255774195002';

-- Update ELIGIUS (255679463945)
UPDATE customers SET
    name = 'ELIGIUS',
    total_spent = 2675000,
    points = 2675,
    loyalty_level = 'platinum',
    color_tag = 'vip',
    total_purchases = 7,
    last_visit = '2023-02-02T12:34:56Z',
    last_purchase_date = '2023-02-02T12:34:56Z',
    updated_at = NOW()
WHERE phone = '255679463945';

-- Update GLORIA (255659509345)
UPDATE customers SET
    name = 'GLORIA',
    total_spent = 2500000,
    points = 2500,
    loyalty_level = 'platinum',
    color_tag = 'vip',
    total_purchases = 2,
    last_visit = '2022-10-04T13:21:28Z',
    last_purchase_date = '2022-10-04T13:21:28Z',
    updated_at = NOW()
WHERE phone = '255659509345';

-- Update HELLEN (255719796574)
UPDATE customers SET
    name = 'HELLEN',
    total_spent = 2300000,
    points = 2300,
    loyalty_level = 'platinum',
    color_tag = 'vip',
    total_purchases = 3,
    last_visit = '2023-02-03T09:54:01Z',
    last_purchase_date = '2023-02-03T09:54:01Z',
    updated_at = NOW()
WHERE phone = '255719796574';

-- Update NTIMI (255677949296)
UPDATE customers SET
    name = 'NTIMI',
    total_spent = 2200000,
    points = 2200,
    loyalty_level = 'platinum',
    color_tag = 'vip',
    total_purchases = 1,
    last_visit = '2022-11-03T16:46:53Z',
    last_purchase_date = '2022-11-03T16:46:53Z',
    updated_at = NOW()
WHERE phone = '255677949296';

-- Update SULEYMAN (255714224358)
UPDATE customers SET
    name = 'SULEYMAN',
    total_spent = 2000000,
    points = 2000,
    loyalty_level = 'platinum',
    color_tag = 'vip',
    total_purchases = 2,
    last_visit = '2022-09-22T21:32:16Z',
    last_purchase_date = '2022-09-22T21:32:16Z',
    updated_at = NOW()
WHERE phone = '255714224358';

-- Update YUSUPH (255654811032)
UPDATE customers SET
    name = 'YUSUPH',
    total_spent = 1936000,
    points = 1936,
    loyalty_level = 'gold',
    color_tag = 'vip',
    total_purchases = 4,
    last_visit = '2023-01-25T12:36:40Z',
    last_purchase_date = '2023-01-25T12:36:40Z',
    updated_at = NOW()
WHERE phone = '255654811032';

-- Update ROBYN (255672573983)
UPDATE customers SET
    name = 'ROBYN',
    total_spent = 1800000,
    points = 1800,
    loyalty_level = 'gold',
    color_tag = 'vip',
    total_purchases = 1,
    last_visit = '2022-10-03T09:27:41Z',
    last_purchase_date = '2022-10-03T09:27:41Z',
    updated_at = NOW()
WHERE phone = '255672573983';

-- Update FRANCIS (255714819163)
UPDATE customers SET
    name = 'FRANCIS',
    total_spent = 1782000,
    points = 1782,
    loyalty_level = 'gold',
    color_tag = 'vip',
    total_purchases = 1,
    last_visit = '2022-12-31T16:52:36Z',
    last_purchase_date = '2022-12-31T16:52:36Z',
    updated_at = NOW()
WHERE phone = '255714819163';

-- Update SIFAELI (255714146221)
UPDATE customers SET
    name = 'SIFAELI',
    total_spent = 1500000,
    points = 1500,
    loyalty_level = 'gold',
    color_tag = 'vip',
    total_purchases = 2,
    last_visit = '2022-10-05T16:22:36Z',
    last_purchase_date = '2022-10-05T16:22:36Z',
    updated_at = NOW()
WHERE phone = '255714146221';

-- Update SALMA (255658270477)
UPDATE customers SET
    name = 'SALMA',
    total_spent = 1500000,
    points = 1500,
    loyalty_level = 'gold',
    color_tag = 'vip',
    total_purchases = 3,
    last_visit = '2022-10-01T10:15:52Z',
    last_purchase_date = '2022-10-01T10:15:52Z',
    updated_at = NOW()
WHERE phone = '255658270477';

-- Update DICKSON (255653727999)
UPDATE customers SET
    name = 'DICKSON',
    total_spent = 1320000,
    points = 1320,
    loyalty_level = 'gold',
    color_tag = 'vip',
    total_purchases = 1,
    last_visit = '2022-11-06T16:13:21Z',
    last_purchase_date = '2022-11-06T16:13:21Z',
    updated_at = NOW()
WHERE phone = '255653727999';

-- Update ERICK (255658123624)
UPDATE customers SET
    name = 'ERICK',
    total_spent = 1210000,
    points = 1210,
    loyalty_level = 'gold',
    color_tag = 'vip',
    total_purchases = 2,
    last_visit = '2023-02-11T12:07:39Z',
    last_purchase_date = '2023-02-11T12:07:39Z',
    updated_at = NOW()
WHERE phone = '255658123624';

-- Update KHERI (255717123349)
UPDATE customers SET
    name = 'KHERI',
    total_spent = 1119000,
    points = 1119,
    loyalty_level = 'gold',
    color_tag = 'vip',
    total_purchases = 3,
    last_visit = '2023-03-06T19:33:27Z',
    last_purchase_date = '2023-03-06T19:33:27Z',
    updated_at = NOW()
WHERE phone = '255717123349';

-- Update EMANUEL (255657966815)
UPDATE customers SET
    name = 'EMANUEL',
    total_spent = 1100000,
    points = 1100,
    loyalty_level = 'gold',
    color_tag = 'vip',
    total_purchases = 1,
    last_visit = '2022-10-02T15:24:13Z',
    last_purchase_date = '2022-10-02T15:24:13Z',
    updated_at = NOW()
WHERE phone = '255657966815';

-- Update FAISARI (255716852090)
UPDATE customers SET
    name = 'FAISARI',
    total_spent = 1019000,
    points = 1019,
    loyalty_level = 'gold',
    color_tag = 'vip',
    total_purchases = 2,
    last_visit = '2023-01-06T16:34:50Z',
    last_purchase_date = '2023-01-06T16:34:50Z',
    updated_at = NOW()
WHERE phone = '255716852090';

-- Update SALEHE (255713768183)
UPDATE customers SET
    name = 'SALEHE',
    total_spent = 1000000,
    points = 1000,
    loyalty_level = 'gold',
    color_tag = 'vip',
    total_purchases = 1,
    last_visit = '2022-10-17T16:46:33Z',
    last_purchase_date = '2022-10-17T16:46:33Z',
    updated_at = NOW()
WHERE phone = '255713768183';

-- Update KHALIFA (255712739618)
UPDATE customers SET
    name = 'KHALIFA',
    total_spent = 1000000,
    points = 1000,
    loyalty_level = 'gold',
    color_tag = 'vip',
    total_purchases = 1,
    last_visit = '2022-10-18T15:24:25Z',
    last_purchase_date = '2022-10-18T15:24:25Z',
    updated_at = NOW()
WHERE phone = '255712739618';

-- Update ADOLFU (255719830922)
UPDATE customers SET
    name = 'ADOLFU',
    total_spent = 980000,
    points = 980,
    loyalty_level = 'silver',
    color_tag = 'purchased',
    total_purchases = 3,
    last_visit = '2023-02-10T11:53:27Z',
    last_purchase_date = '2023-02-10T11:53:27Z',
    updated_at = NOW()
WHERE phone = '255719830922';

-- Update MOHAMEDI (255710809525)
UPDATE customers SET
    name = 'MOHAMEDI',
    total_spent = 969000,
    points = 969,
    loyalty_level = 'silver',
    color_tag = 'purchased',
    total_purchases = 3,
    last_visit = '2023-01-11T20:54:40Z',
    last_purchase_date = '2023-01-11T20:54:40Z',
    updated_at = NOW()
WHERE phone = '255710809525';

-- Update HANS (255712076431)
UPDATE customers SET
    name = 'HANS',
    total_spent = 910000,
    points = 910,
    loyalty_level = 'silver',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2022-12-12T10:38:30Z',
    last_purchase_date = '2022-12-12T10:38:30Z',
    updated_at = NOW()
WHERE phone = '255712076431';

-- Update JOEL (255719968222)
UPDATE customers SET
    name = 'JOEL',
    total_spent = 900000,
    points = 900,
    loyalty_level = 'silver',
    color_tag = 'purchased',
    total_purchases = 2,
    last_visit = '2022-09-14T16:59:37Z',
    last_purchase_date = '2022-09-14T16:59:37Z',
    updated_at = NOW()
WHERE phone = '255719968222';

-- Update BENWARD (255713510369)
UPDATE customers SET
    name = 'BENWARD',
    total_spent = 900000,
    points = 900,
    loyalty_level = 'silver',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2023-02-18T12:45:31Z',
    last_purchase_date = '2023-02-18T12:45:31Z',
    updated_at = NOW()
WHERE phone = '255713510369';

-- Update AMEDEUS (255658225522)
UPDATE customers SET
    name = 'AMEDEUS',
    total_spent = 865000,
    points = 865,
    loyalty_level = 'silver',
    color_tag = 'purchased',
    total_purchases = 3,
    last_visit = '2023-02-08T12:16:21Z',
    last_purchase_date = '2023-02-08T12:16:21Z',
    updated_at = NOW()
WHERE phone = '255658225522';

-- Update MANASEH (255710086306)
UPDATE customers SET
    name = 'MANASEH',
    total_spent = 850000,
    points = 850,
    loyalty_level = 'silver',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2022-12-10T14:29:29Z',
    last_purchase_date = '2022-12-10T14:29:29Z',
    updated_at = NOW()
WHERE phone = '255710086306';

-- Update SHEKA (255657108159)
UPDATE customers SET
    name = 'SHEKA',
    total_spent = 850000,
    points = 850,
    loyalty_level = 'silver',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2023-01-07T12:44:37Z',
    last_purchase_date = '2023-01-07T12:44:37Z',
    updated_at = NOW()
WHERE phone = '255657108159';

-- Update MIRIAM (255712760663)
UPDATE customers SET
    name = 'MIRIAM',
    total_spent = 850000,
    points = 850,
    loyalty_level = 'silver',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2023-01-30T10:57:31Z',
    last_purchase_date = '2023-01-30T10:57:31Z',
    updated_at = NOW()
WHERE phone = '255712760663';

-- Update TRUE IMAGE UNDERTAKING INVESTMENT LTD (25571210682)
UPDATE customers SET
    name = 'TRUE IMAGE UNDERTAKING INVESTMENT LTD',
    total_spent = 829000,
    points = 829,
    loyalty_level = 'silver',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2023-03-06T19:23:16Z',
    last_purchase_date = '2023-03-06T19:23:16Z',
    updated_at = NOW()
WHERE phone = '25571210682';

-- Update GEORGE (255717187685)
UPDATE customers SET
    name = 'GEORGE',
    total_spent = 750000,
    points = 750,
    loyalty_level = 'silver',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2022-11-13T11:10:41Z',
    last_purchase_date = '2022-11-13T11:10:41Z',
    updated_at = NOW()
WHERE phone = '255717187685';

-- Update CANDID (255655413102)
UPDATE customers SET
    name = 'CANDID',
    total_spent = 670000,
    points = 670,
    loyalty_level = 'silver',
    color_tag = 'purchased',
    total_purchases = 5,
    last_visit = '2023-03-05T14:50:45Z',
    last_purchase_date = '2023-03-05T14:50:45Z',
    updated_at = NOW()
WHERE phone = '255655413102';

-- Update ALBERT (255715284802)
UPDATE customers SET
    name = 'ALBERT',
    total_spent = 640000,
    points = 640,
    loyalty_level = 'silver',
    color_tag = 'purchased',
    total_purchases = 2,
    last_visit = '2022-10-17T20:40:22Z',
    last_purchase_date = '2022-10-17T20:40:22Z',
    updated_at = NOW()
WHERE phone = '255715284802';

-- Update JACKLINE (255718766011)
UPDATE customers SET
    name = 'JACKLINE',
    total_spent = 635000,
    points = 635,
    loyalty_level = 'silver',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2022-10-17T21:24:58Z',
    last_purchase_date = '2022-10-17T21:24:58Z',
    updated_at = NOW()
WHERE phone = '255718766011';

-- Update GERALD (255719800080)
UPDATE customers SET
    name = 'GERALD',
    total_spent = 635000,
    points = 635,
    loyalty_level = 'silver',
    color_tag = 'purchased',
    total_purchases = 2,
    last_visit = '2022-11-07T10:13:28Z',
    last_purchase_date = '2022-11-07T10:13:28Z',
    updated_at = NOW()
WHERE phone = '255719800080';

-- Update MBILIKILA (255712517415)
UPDATE customers SET
    name = 'MBILIKILA',
    total_spent = 610000,
    points = 610,
    loyalty_level = 'silver',
    color_tag = 'purchased',
    total_purchases = 3,
    last_visit = '2023-01-30T17:37:17Z',
    last_purchase_date = '2023-01-30T17:37:17Z',
    updated_at = NOW()
WHERE phone = '255712517415';

-- Update ARNOLD (255658123222)
UPDATE customers SET
    name = 'ARNOLD',
    total_spent = 600000,
    points = 600,
    loyalty_level = 'silver',
    color_tag = 'purchased',
    total_purchases = 2,
    last_visit = '2023-01-12T13:41:30Z',
    last_purchase_date = '2023-01-12T13:41:30Z',
    updated_at = NOW()
WHERE phone = '255658123222';

-- Update ENEZA (255654917217)
UPDATE customers SET
    name = 'ENEZA',
    total_spent = 600000,
    points = 600,
    loyalty_level = 'silver',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2023-01-12T20:52:22Z',
    last_purchase_date = '2023-01-12T20:52:22Z',
    updated_at = NOW()
WHERE phone = '255654917217';

-- Update SYLVESTER (255657163242)
UPDATE customers SET
    name = 'SYLVESTER',
    total_spent = 600000,
    points = 600,
    loyalty_level = 'silver',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2023-02-20T13:32:03Z',
    last_purchase_date = '2023-02-20T13:32:03Z',
    updated_at = NOW()
WHERE phone = '255657163242';

-- Update CHRISANTUS (255652511380)
UPDATE customers SET
    name = 'CHRISANTUS',
    total_spent = 580000,
    points = 580,
    loyalty_level = 'silver',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2022-09-08T14:31:26Z',
    last_purchase_date = '2022-09-08T14:31:26Z',
    updated_at = NOW()
WHERE phone = '255652511380';

-- Update JAMBIA (255714898832)
UPDATE customers SET
    name = 'JAMBIA',
    total_spent = 550000,
    points = 550,
    loyalty_level = 'silver',
    color_tag = 'purchased',
    total_purchases = 2,
    last_visit = '2022-09-16T15:08:43Z',
    last_purchase_date = '2022-09-16T15:08:43Z',
    updated_at = NOW()
WHERE phone = '255714898832';

-- Update JOHN (255654052610)
UPDATE customers SET
    name = 'JOHN',
    total_spent = 500000,
    points = 500,
    loyalty_level = 'silver',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2022-10-05T16:05:50Z',
    last_purchase_date = '2022-10-05T16:05:50Z',
    updated_at = NOW()
WHERE phone = '255654052610';

-- Update TUMSIFU (255717809991)
UPDATE customers SET
    name = 'TUMSIFU',
    total_spent = 500000,
    points = 500,
    loyalty_level = 'silver',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2022-10-21T11:08:58Z',
    last_purchase_date = '2022-10-21T11:08:58Z',
    updated_at = NOW()
WHERE phone = '255717809991';

-- Update HARRIS (255653109270)
UPDATE customers SET
    name = 'HARRIS',
    total_spent = 500000,
    points = 500,
    loyalty_level = 'silver',
    color_tag = 'purchased',
    total_purchases = 3,
    last_visit = '2023-01-11T12:55:31Z',
    last_purchase_date = '2023-01-11T12:55:31Z',
    updated_at = NOW()
WHERE phone = '255653109270';

-- Update AKBAR (255716608870)
UPDATE customers SET
    name = 'AKBAR',
    total_spent = 500000,
    points = 500,
    loyalty_level = 'silver',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2023-01-10T14:49:00Z',
    last_purchase_date = '2023-01-10T14:49:00Z',
    updated_at = NOW()
WHERE phone = '255716608870';

-- Update SEBASTIAN (255715298282)
UPDATE customers SET
    name = 'SEBASTIAN',
    total_spent = 500000,
    points = 500,
    loyalty_level = 'silver',
    color_tag = 'purchased',
    total_purchases = 2,
    last_visit = '2023-02-22T14:39:51Z',
    last_purchase_date = '2023-02-22T14:39:51Z',
    updated_at = NOW()
WHERE phone = '255715298282';

-- Update NAOMI (255654841225)
UPDATE customers SET
    name = 'NAOMI',
    total_spent = 497000,
    points = 497,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2022-12-24T21:59:50Z',
    last_purchase_date = '2022-12-24T21:59:50Z',
    updated_at = NOW()
WHERE phone = '255654841225';

-- Update IDRISA (255656230000)
UPDATE customers SET
    name = 'IDRISA',
    total_spent = 490000,
    points = 490,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2022-09-23T16:24:00Z',
    last_purchase_date = '2022-09-23T16:24:00Z',
    updated_at = NOW()
WHERE phone = '255656230000';

-- Update DANIEL (255715303065)
UPDATE customers SET
    name = 'DANIEL',
    total_spent = 465000,
    points = 465,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 2,
    last_visit = '2023-01-17T20:20:25Z',
    last_purchase_date = '2023-01-17T20:20:25Z',
    updated_at = NOW()
WHERE phone = '255715303065';

-- Update THE GRAND AIM COMPANY (25571255774)
UPDATE customers SET
    name = 'THE GRAND AIM COMPANY',
    total_spent = 450000,
    points = 450,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2022-12-17T14:02:58Z',
    last_purchase_date = '2022-12-17T14:02:58Z',
    updated_at = NOW()
WHERE phone = '25571255774';

-- Update MITUTOYO (255718282509)
UPDATE customers SET
    name = 'MITUTOYO',
    total_spent = 410000,
    points = 410,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2022-11-03T19:59:01Z',
    last_purchase_date = '2022-11-03T19:59:01Z',
    updated_at = NOW()
WHERE phone = '255718282509';

-- Update PROSPER (255719222709)
UPDATE customers SET
    name = 'PROSPER',
    total_spent = 400000,
    points = 400,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 2,
    last_visit = '2022-10-17T19:50:32Z',
    last_purchase_date = '2022-10-17T19:50:32Z',
    updated_at = NOW()
WHERE phone = '255719222709';

-- Update KELVIN (255717223822)
UPDATE customers SET
    name = 'KELVIN',
    total_spent = 400000,
    points = 400,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2023-02-10T18:59:55Z',
    last_purchase_date = '2023-02-10T18:59:55Z',
    updated_at = NOW()
WHERE phone = '255717223822';

-- Update ERICK (255719014040)
UPDATE customers SET
    name = 'ERICK',
    total_spent = 399000,
    points = 399,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2022-11-15T13:28:00Z',
    last_purchase_date = '2022-11-15T13:28:00Z',
    updated_at = NOW()
WHERE phone = '255719014040';

-- Update THOMAS (255716057542)
UPDATE customers SET
    name = 'THOMAS',
    total_spent = 369000,
    points = 369,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 2,
    last_visit = '2022-09-23T10:22:21Z',
    last_purchase_date = '2022-09-23T10:22:21Z',
    updated_at = NOW()
WHERE phone = '255716057542';

-- Update DATIUS (255719938063)
UPDATE customers SET
    name = 'DATIUS',
    total_spent = 368000,
    points = 368,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2022-10-29T16:43:28Z',
    last_purchase_date = '2022-10-29T16:43:28Z',
    updated_at = NOW()
WHERE phone = '255719938063';

-- Update OMARY (255710000008)
UPDATE customers SET
    name = 'OMARY',
    total_spent = 350000,
    points = 350,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2022-11-24T09:03:31Z',
    last_purchase_date = '2022-11-24T09:03:31Z',
    updated_at = NOW()
WHERE phone = '255710000008';

-- Update FADHILI (255656304959)
UPDATE customers SET
    name = 'FADHILI',
    total_spent = 330000,
    points = 330,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 2,
    last_visit = '2022-09-06T20:17:36Z',
    last_purchase_date = '2022-09-06T20:17:36Z',
    updated_at = NOW()
WHERE phone = '255656304959';

-- Update YUSUPH (255717831422)
UPDATE customers SET
    name = 'YUSUPH',
    total_spent = 310000,
    points = 310,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 2,
    last_visit = '2022-09-30T17:23:34Z',
    last_purchase_date = '2022-09-30T17:23:34Z',
    updated_at = NOW()
WHERE phone = '255717831422';

-- Update JUMA (255710870870)
UPDATE customers SET
    name = 'JUMA',
    total_spent = 310000,
    points = 310,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2023-01-06T13:17:23Z',
    last_purchase_date = '2023-01-06T13:17:23Z',
    updated_at = NOW()
WHERE phone = '255710870870';

-- Update JOSEPH (255656953059)
UPDATE customers SET
    name = 'JOSEPH',
    total_spent = 300000,
    points = 300,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 2,
    last_visit = '2022-12-05T20:44:21Z',
    last_purchase_date = '2022-12-05T20:44:21Z',
    updated_at = NOW()
WHERE phone = '255656953059';

-- Update ABDALLAH (255715652652)
UPDATE customers SET
    name = 'ABDALLAH',
    total_spent = 300000,
    points = 300,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2022-12-05T19:52:41Z',
    last_purchase_date = '2022-12-05T19:52:41Z',
    updated_at = NOW()
WHERE phone = '255715652652';

-- Update SELEMANI (255655869221)
UPDATE customers SET
    name = 'SELEMANI',
    total_spent = 275000,
    points = 275,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 2,
    last_visit = '2022-12-23T19:02:34Z',
    last_purchase_date = '2022-12-23T19:02:34Z',
    updated_at = NOW()
WHERE phone = '255655869221';

-- Update FRANK (255653005099)
UPDATE customers SET
    name = 'FRANK',
    total_spent = 250000,
    points = 250,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2022-12-23T11:17:41Z',
    last_purchase_date = '2022-12-23T11:17:41Z',
    updated_at = NOW()
WHERE phone = '255653005099';

-- Update ANNASTERDA (255712624133)
UPDATE customers SET
    name = 'ANNASTERDA',
    total_spent = 250000,
    points = 250,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2023-02-07T08:09:13Z',
    last_purchase_date = '2023-02-07T08:09:13Z',
    updated_at = NOW()
WHERE phone = '255712624133';

-- Update WINFRIDA (255717432850)
UPDATE customers SET
    name = 'WINFRIDA',
    total_spent = 220000,
    points = 220,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2022-09-19T13:54:10Z',
    last_purchase_date = '2022-09-19T13:54:10Z',
    updated_at = NOW()
WHERE phone = '255717432850';

-- Update STEPHEN (255679261245)
UPDATE customers SET
    name = 'STEPHEN',
    total_spent = 200000,
    points = 200,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 2,
    last_visit = '2022-09-15T11:53:41Z',
    last_purchase_date = '2022-09-15T11:53:41Z',
    updated_at = NOW()
WHERE phone = '255679261245';

-- Update STEVEN (255673974292)
UPDATE customers SET
    name = 'STEVEN',
    total_spent = 200000,
    points = 200,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2022-10-30T14:43:30Z',
    last_purchase_date = '2022-10-30T14:43:30Z',
    updated_at = NOW()
WHERE phone = '255673974292';

-- Update SHAFII (255712863893)
UPDATE customers SET
    name = 'SHAFII',
    total_spent = 200000,
    points = 200,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2022-12-04T14:53:31Z',
    last_purchase_date = '2022-12-04T14:53:31Z',
    updated_at = NOW()
WHERE phone = '255712863893';

-- Update MEDARD (255657378230)
UPDATE customers SET
    name = 'MEDARD',
    total_spent = 200000,
    points = 200,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2023-01-13T14:43:35Z',
    last_purchase_date = '2023-01-13T14:43:35Z',
    updated_at = NOW()
WHERE phone = '255657378230';

-- Update WILFRED (255674840320)
UPDATE customers SET
    name = 'WILFRED',
    total_spent = 200000,
    points = 200,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2023-02-03T11:16:59Z',
    last_purchase_date = '2023-02-03T11:16:59Z',
    updated_at = NOW()
WHERE phone = '255674840320';

-- Update MANGE (255658645749)
UPDATE customers SET
    name = 'MANGE',
    total_spent = 190000,
    points = 190,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2022-10-25T17:04:38Z',
    last_purchase_date = '2022-10-25T17:04:38Z',
    updated_at = NOW()
WHERE phone = '255658645749';

-- Update OMBENI (255719625566)
UPDATE customers SET
    name = 'OMBENI',
    total_spent = 180000,
    points = 180,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2022-11-06T10:29:06Z',
    last_purchase_date = '2022-11-06T10:29:06Z',
    updated_at = NOW()
WHERE phone = '255719625566';

-- Update JOHNBOSCO (255714174067)
UPDATE customers SET
    name = 'JOHNBOSCO',
    total_spent = 179000,
    points = 179,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2022-12-17T19:31:36Z',
    last_purchase_date = '2022-12-17T19:31:36Z',
    updated_at = NOW()
WHERE phone = '255714174067';

-- Update LUCY (255712565000)
UPDATE customers SET
    name = 'LUCY',
    total_spent = 170000,
    points = 170,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2022-10-03T21:06:49Z',
    last_purchase_date = '2022-10-03T21:06:49Z',
    updated_at = NOW()
WHERE phone = '255712565000';

-- Update GERLAD (255719404434)
UPDATE customers SET
    name = 'GERLAD',
    total_spent = 170000,
    points = 170,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 2,
    last_visit = '2022-12-29T19:49:00Z',
    last_purchase_date = '2022-12-29T19:49:00Z',
    updated_at = NOW()
WHERE phone = '255719404434';

-- Update OMARI (255713609197)
UPDATE customers SET
    name = 'OMARI',
    total_spent = 160000,
    points = 160,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 2,
    last_visit = '2023-01-04T18:39:43Z',
    last_purchase_date = '2023-01-04T18:39:43Z',
    updated_at = NOW()
WHERE phone = '255713609197';

-- Update MARIAM (255654771058)
UPDATE customers SET
    name = 'MARIAM',
    total_spent = 160000,
    points = 160,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2023-01-18T20:02:46Z',
    last_purchase_date = '2023-01-18T20:02:46Z',
    updated_at = NOW()
WHERE phone = '255654771058';

-- Update SHABIR (255658429988)
UPDATE customers SET
    name = 'SHABIR',
    total_spent = 160000,
    points = 160,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2023-02-13T18:45:25Z',
    last_purchase_date = '2023-02-13T18:45:25Z',
    updated_at = NOW()
WHERE phone = '255658429988';

-- Update HIDAYA (255715236614)
UPDATE customers SET
    name = 'HIDAYA',
    total_spent = 150000,
    points = 150,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2022-10-06T18:10:29Z',
    last_purchase_date = '2022-10-06T18:10:29Z',
    updated_at = NOW()
WHERE phone = '255715236614';

-- Update JAMES (255653513914)
UPDATE customers SET
    name = 'JAMES',
    total_spent = 150000,
    points = 150,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 3,
    last_visit = '2023-02-04T19:38:06Z',
    last_purchase_date = '2023-02-04T19:38:06Z',
    updated_at = NOW()
WHERE phone = '255653513914';

-- Update CLARA (255713560566)
UPDATE customers SET
    name = 'CLARA',
    total_spent = 150000,
    points = 150,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2023-01-06T19:33:19Z',
    last_purchase_date = '2023-01-06T19:33:19Z',
    updated_at = NOW()
WHERE phone = '255713560566';

-- Update ESTER (255656601774)
UPDATE customers SET
    name = 'ESTER',
    total_spent = 150000,
    points = 150,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2023-02-08T12:35:35Z',
    last_purchase_date = '2023-02-08T12:35:35Z',
    updated_at = NOW()
WHERE phone = '255656601774';

-- Update AMOUR (255719113012)
UPDATE customers SET
    name = 'AMOUR',
    total_spent = 130000,
    points = 130,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2022-11-15T20:32:17Z',
    last_purchase_date = '2022-11-15T20:32:17Z',
    updated_at = NOW()
WHERE phone = '255719113012';

-- Update CLEMENCE (255719793143)
UPDATE customers SET
    name = 'CLEMENCE',
    total_spent = 130000,
    points = 130,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 2,
    last_visit = '2023-02-28T10:43:12Z',
    last_purchase_date = '2023-02-28T10:43:12Z',
    updated_at = NOW()
WHERE phone = '255719793143';

-- Update FLAVIUS (255676771949)
UPDATE customers SET
    name = 'FLAVIUS',
    total_spent = 120000,
    points = 120,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2022-09-26T15:57:17Z',
    last_purchase_date = '2022-09-26T15:57:17Z',
    updated_at = NOW()
WHERE phone = '255676771949';

-- Update PETER (255678333672)
UPDATE customers SET
    name = 'PETER',
    total_spent = 105000,
    points = 105,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2022-09-17T11:31:50Z',
    last_purchase_date = '2022-09-17T11:31:50Z',
    updated_at = NOW()
WHERE phone = '255678333672';

-- Update INNOCENT (255673419493)
UPDATE customers SET
    name = 'INNOCENT',
    total_spent = 105000,
    points = 105,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2022-11-03T20:24:42Z',
    last_purchase_date = '2022-11-03T20:24:42Z',
    updated_at = NOW()
WHERE phone = '255673419493';

-- Update ISAKWISA (255656870345)
UPDATE customers SET
    name = 'ISAKWISA',
    total_spent = 100000,
    points = 100,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2022-10-01T20:44:21Z',
    last_purchase_date = '2022-10-01T20:44:21Z',
    updated_at = NOW()
WHERE phone = '255656870345';

-- Update SUZANA (255719100544)
UPDATE customers SET
    name = 'SUZANA',
    total_spent = 100000,
    points = 100,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2022-12-23T16:46:12Z',
    last_purchase_date = '2022-12-23T16:46:12Z',
    updated_at = NOW()
WHERE phone = '255719100544';

-- Update CHRISTOPHER (255653977233)
UPDATE customers SET
    name = 'CHRISTOPHER',
    total_spent = 100000,
    points = 100,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2023-01-24T18:51:53Z',
    last_purchase_date = '2023-01-24T18:51:53Z',
    updated_at = NOW()
WHERE phone = '255653977233';

-- Update PAUL (255715194263)
UPDATE customers SET
    name = 'PAUL',
    total_spent = 100000,
    points = 100,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2023-02-06T15:25:11Z',
    last_purchase_date = '2023-02-06T15:25:11Z',
    updated_at = NOW()
WHERE phone = '255715194263';

-- Update DEUS (255654233617)
UPDATE customers SET
    name = 'DEUS',
    total_spent = 100000,
    points = 100,
    loyalty_level = 'bronze',
    color_tag = 'purchased',
    total_purchases = 1,
    last_visit = '2023-02-13T20:33:56Z',
    last_purchase_date = '2023-02-13T20:33:56Z',
    updated_at = NOW()
WHERE phone = '255654233617';

-- Update PATRICK (255675410470)
UPDATE customers SET
    name = 'PATRICK',
    total_spent = 90000,
    points = 90,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 2,
    last_visit = '2022-12-23T15:51:45Z',
    last_purchase_date = '2022-12-23T15:51:45Z',
    updated_at = NOW()
WHERE phone = '255675410470';

-- Update GLORY (255710495852)
UPDATE customers SET
    name = 'GLORY',
    total_spent = 90000,
    points = 90,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-12-30T18:11:00Z',
    last_purchase_date = '2022-12-30T18:11:00Z',
    updated_at = NOW()
WHERE phone = '255710495852';

-- Update JOSEPH (255710925886)
UPDATE customers SET
    name = 'JOSEPH',
    total_spent = 90000,
    points = 90,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2023-02-08T21:34:00Z',
    last_purchase_date = '2023-02-08T21:34:00Z',
    updated_at = NOW()
WHERE phone = '255710925886';

-- Update HONEST (255712143985)
UPDATE customers SET
    name = 'HONEST',
    total_spent = 85000,
    points = 85,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 2,
    last_visit = '2023-01-03T17:33:19Z',
    last_purchase_date = '2023-01-03T17:33:19Z',
    updated_at = NOW()
WHERE phone = '255712143985';

-- Update LUCAS (255716481313)
UPDATE customers SET
    name = 'LUCAS',
    total_spent = 85000,
    points = 85,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2023-02-27T16:35:01Z',
    last_purchase_date = '2023-02-27T16:35:01Z',
    updated_at = NOW()
WHERE phone = '255716481313';

-- Update ASHA (255653006424)
UPDATE customers SET
    name = 'ASHA',
    total_spent = 70000,
    points = 70,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 2,
    last_visit = '2022-09-10T16:06:56Z',
    last_purchase_date = '2022-09-10T16:06:56Z',
    updated_at = NOW()
WHERE phone = '255653006424';

-- Update CHRISTINA (255652710536)
UPDATE customers SET
    name = 'CHRISTINA',
    total_spent = 70000,
    points = 70,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-09-24T15:52:37Z',
    last_purchase_date = '2022-09-24T15:52:37Z',
    updated_at = NOW()
WHERE phone = '255652710536';

-- Update JOSHUA (255714797103)
UPDATE customers SET
    name = 'JOSHUA',
    total_spent = 70000,
    points = 70,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-10-18T18:08:01Z',
    last_purchase_date = '2022-10-18T18:08:01Z',
    updated_at = NOW()
WHERE phone = '255714797103';

-- Update NEEMA (255676471785)
UPDATE customers SET
    name = 'NEEMA',
    total_spent = 70000,
    points = 70,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-10-25T14:13:16Z',
    last_purchase_date = '2022-10-25T14:13:16Z',
    updated_at = NOW()
WHERE phone = '255676471785';

-- Update MAGRETH (255718652812)
UPDATE customers SET
    name = 'MAGRETH',
    total_spent = 70000,
    points = 70,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2023-01-09T15:31:27Z',
    last_purchase_date = '2023-01-09T15:31:27Z',
    updated_at = NOW()
WHERE phone = '255718652812';

-- Update WILLIAM (255674984328)
UPDATE customers SET
    name = 'WILLIAM',
    total_spent = 67000,
    points = 67,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-09-29T13:27:31Z',
    last_purchase_date = '2022-09-29T13:27:31Z',
    updated_at = NOW()
WHERE phone = '255674984328';

-- Update DAZZLER OUTLET (25571125160)
UPDATE customers SET
    name = 'DAZZLER OUTLET',
    total_spent = 67000,
    points = 67,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-11-13T23:45:24Z',
    last_purchase_date = '2022-11-13T23:45:24Z',
    updated_at = NOW()
WHERE phone = '25571125160';

-- Update DENIS (255672710938)
UPDATE customers SET
    name = 'DENIS',
    total_spent = 65000,
    points = 65,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 2,
    last_visit = '2022-09-13T22:45:56Z',
    last_purchase_date = '2022-09-13T22:45:56Z',
    updated_at = NOW()
WHERE phone = '255672710938';

-- Update ANTHONY (255713333322)
UPDATE customers SET
    name = 'ANTHONY',
    total_spent = 65000,
    points = 65,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-09-16T15:25:57Z',
    last_purchase_date = '2022-09-16T15:25:57Z',
    updated_at = NOW()
WHERE phone = '255713333322';

-- Update FRANK (255656326087)
UPDATE customers SET
    name = 'FRANK',
    total_spent = 65000,
    points = 65,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-11-20T16:30:43Z',
    last_purchase_date = '2022-11-20T16:30:43Z',
    updated_at = NOW()
WHERE phone = '255656326087';

-- Update NANCY (255714985378)
UPDATE customers SET
    name = 'NANCY',
    total_spent = 60000,
    points = 60,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 2,
    last_visit = '2023-01-18T20:36:55Z',
    last_purchase_date = '2023-01-18T20:36:55Z',
    updated_at = NOW()
WHERE phone = '255714985378';

-- Update EMANUEL (255716623234)
UPDATE customers SET
    name = 'EMANUEL',
    total_spent = 58000,
    points = 58,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2023-01-18T16:03:00Z',
    last_purchase_date = '2023-01-18T16:03:00Z',
    updated_at = NOW()
WHERE phone = '255716623234';

-- Update MOHAMED (255717742525)
UPDATE customers SET
    name = 'MOHAMED',
    total_spent = 55000,
    points = 55,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-09-05T11:46:16Z',
    last_purchase_date = '2022-09-05T11:46:16Z',
    updated_at = NOW()
WHERE phone = '255717742525';

-- Update MOSES (255717443384)
UPDATE customers SET
    name = 'MOSES',
    total_spent = 55000,
    points = 55,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-10-27T13:34:39Z',
    last_purchase_date = '2022-10-27T13:34:39Z',
    updated_at = NOW()
WHERE phone = '255717443384';

-- Update CHRISTIAN (255715173596)
UPDATE customers SET
    name = 'CHRISTIAN',
    total_spent = 50000,
    points = 50,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-09-21T14:59:45Z',
    last_purchase_date = '2022-09-21T14:59:45Z',
    updated_at = NOW()
WHERE phone = '255715173596';

-- Update MODEST (255716399697)
UPDATE customers SET
    name = 'MODEST',
    total_spent = 50000,
    points = 50,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-12-19T14:15:33Z',
    last_purchase_date = '2022-12-19T14:15:33Z',
    updated_at = NOW()
WHERE phone = '255716399697';

-- Update CALVIN (255719561561)
UPDATE customers SET
    name = 'CALVIN',
    total_spent = 50000,
    points = 50,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2023-01-10T13:47:41Z',
    last_purchase_date = '2023-01-10T13:47:41Z',
    updated_at = NOW()
WHERE phone = '255719561561';

-- Update MOHAMED (255717592335)
UPDATE customers SET
    name = 'MOHAMED',
    total_spent = 50000,
    points = 50,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2023-01-10T13:53:06Z',
    last_purchase_date = '2023-01-10T13:53:06Z',
    updated_at = NOW()
WHERE phone = '255717592335';

-- Update GODFREY (255713123334)
UPDATE customers SET
    name = 'GODFREY',
    total_spent = 50000,
    points = 50,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2023-02-21T17:45:31Z',
    last_purchase_date = '2023-02-21T17:45:31Z',
    updated_at = NOW()
WHERE phone = '255713123334';

-- Update AHMED (255712259767)
UPDATE customers SET
    name = 'AHMED',
    total_spent = 45000,
    points = 45,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-10-05T10:59:49Z',
    last_purchase_date = '2022-10-05T10:59:49Z',
    updated_at = NOW()
WHERE phone = '255712259767';

-- Update AARON (255679176387)
UPDATE customers SET
    name = 'AARON',
    total_spent = 45000,
    points = 45,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-12-14T19:48:30Z',
    last_purchase_date = '2022-12-14T19:48:30Z',
    updated_at = NOW()
WHERE phone = '255679176387';

-- Update AMANI (255714985685)
UPDATE customers SET
    name = 'AMANI',
    total_spent = 45000,
    points = 45,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 2,
    last_visit = '2023-02-04T13:05:15Z',
    last_purchase_date = '2023-02-04T13:05:15Z',
    updated_at = NOW()
WHERE phone = '255714985685';

-- Update SAMWEL (255656668144)
UPDATE customers SET
    name = 'SAMWEL',
    total_spent = 40000,
    points = 40,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-12-06T15:08:46Z',
    last_purchase_date = '2022-12-06T15:08:46Z',
    updated_at = NOW()
WHERE phone = '255656668144';

-- Update TRUDY TRENDS (25571245238)
UPDATE customers SET
    name = 'TRUDY TRENDS',
    total_spent = 35000,
    points = 35,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-11-23T09:59:31Z',
    last_purchase_date = '2022-11-23T09:59:31Z',
    updated_at = NOW()
WHERE phone = '25571245238';

-- Update DANIEL (255718111711)
UPDATE customers SET
    name = 'DANIEL',
    total_spent = 35000,
    points = 35,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-12-13T15:31:33Z',
    last_purchase_date = '2022-12-13T15:31:33Z',
    updated_at = NOW()
WHERE phone = '255718111711';

-- Update HENRICK RUGAIYULULA (255656326612)
UPDATE customers SET
    name = 'HENRICK RUGAIYULULA',
    total_spent = 35000,
    points = 35,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2023-01-24T17:36:25Z',
    last_purchase_date = '2023-01-24T17:36:25Z',
    updated_at = NOW()
WHERE phone = '255656326612';

-- Update JEFFERSON (255713571375)
UPDATE customers SET
    name = 'JEFFERSON',
    total_spent = 35000,
    points = 35,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2023-02-08T18:25:39Z',
    last_purchase_date = '2023-02-08T18:25:39Z',
    updated_at = NOW()
WHERE phone = '255713571375';

-- Update GELWIN (255657002014)
UPDATE customers SET
    name = 'GELWIN',
    total_spent = 30000,
    points = 30,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-09-17T18:36:41Z',
    last_purchase_date = '2022-09-17T18:36:41Z',
    updated_at = NOW()
WHERE phone = '255657002014';

-- Update DAMIAN (255713326229)
UPDATE customers SET
    name = 'DAMIAN',
    total_spent = 30000,
    points = 30,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-11-07T10:44:15Z',
    last_purchase_date = '2022-11-07T10:44:15Z',
    updated_at = NOW()
WHERE phone = '255713326229';

-- Update ENOCK (255652641317)
UPDATE customers SET
    name = 'ENOCK',
    total_spent = 30000,
    points = 30,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-12-31T12:44:54Z',
    last_purchase_date = '2022-12-31T12:44:54Z',
    updated_at = NOW()
WHERE phone = '255652641317';

-- Update MICHAEL (255713288162)
UPDATE customers SET
    name = 'MICHAEL',
    total_spent = 29000,
    points = 29,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2023-01-16T21:40:05Z',
    last_purchase_date = '2023-01-16T21:40:05Z',
    updated_at = NOW()
WHERE phone = '255713288162';

-- Update BARAKA (255718599927)
UPDATE customers SET
    name = 'BARAKA',
    total_spent = 25000,
    points = 25,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-10-15T18:53:17Z',
    last_purchase_date = '2022-10-15T18:53:17Z',
    updated_at = NOW()
WHERE phone = '255718599927';

-- Update PILI (255675153248)
UPDATE customers SET
    name = 'PILI',
    total_spent = 20000,
    points = 20,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-09-12T19:42:23Z',
    last_purchase_date = '2022-09-12T19:42:23Z',
    updated_at = NOW()
WHERE phone = '255675153248';

-- Update BENJAMIN (255679695596)
UPDATE customers SET
    name = 'BENJAMIN',
    total_spent = 20000,
    points = 20,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-11-23T11:26:23Z',
    last_purchase_date = '2022-11-23T11:26:23Z',
    updated_at = NOW()
WHERE phone = '255679695596';

-- Update BERNARD (255719242631)
UPDATE customers SET
    name = 'BERNARD',
    total_spent = 20000,
    points = 20,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-12-30T11:49:04Z',
    last_purchase_date = '2022-12-30T11:49:04Z',
    updated_at = NOW()
WHERE phone = '255719242631';

-- Update HUSSEIN (255710506767)
UPDATE customers SET
    name = 'HUSSEIN',
    total_spent = 19500,
    points = 19,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2023-01-30T22:48:30Z',
    last_purchase_date = '2023-01-30T22:48:30Z',
    updated_at = NOW()
WHERE phone = '255710506767';

-- Update EDGER (255714661379)
UPDATE customers SET
    name = 'EDGER',
    total_spent = 19000,
    points = 19,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-09-08T18:51:36Z',
    last_purchase_date = '2022-09-08T18:51:36Z',
    updated_at = NOW()
WHERE phone = '255714661379';

-- Update DICKSON (255655118291)
UPDATE customers SET
    name = 'DICKSON',
    total_spent = 19000,
    points = 19,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2023-01-21T18:08:40Z',
    last_purchase_date = '2023-01-21T18:08:40Z',
    updated_at = NOW()
WHERE phone = '255655118291';

-- Update RAMADHANI (255677445627)
UPDATE customers SET
    name = 'RAMADHANI',
    total_spent = 18000,
    points = 18,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-10-11T14:36:39Z',
    last_purchase_date = '2022-10-11T14:36:39Z',
    updated_at = NOW()
WHERE phone = '255677445627';

-- Update WILLIAM (255672791438)
UPDATE customers SET
    name = 'WILLIAM',
    total_spent = 15000,
    points = 15,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-11-07T19:14:49Z',
    last_purchase_date = '2022-11-07T19:14:49Z',
    updated_at = NOW()
WHERE phone = '255672791438';

-- Update ALFREDY (255714411910)
UPDATE customers SET
    name = 'ALFREDY',
    total_spent = 15000,
    points = 15,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-11-16T19:19:28Z',
    last_purchase_date = '2022-11-16T19:19:28Z',
    updated_at = NOW()
WHERE phone = '255714411910';

-- Update JACQUELINE (255653649336)
UPDATE customers SET
    name = 'JACQUELINE',
    total_spent = 14500,
    points = 14,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-10-24T18:50:48Z',
    last_purchase_date = '2022-10-24T18:50:48Z',
    updated_at = NOW()
WHERE phone = '255653649336';

-- Update BEATRICE (255656007681)
UPDATE customers SET
    name = 'BEATRICE',
    total_spent = 10000,
    points = 10,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-09-22T12:16:13Z',
    last_purchase_date = '2022-09-22T12:16:13Z',
    updated_at = NOW()
WHERE phone = '255656007681';

-- Update GLORIOUS (255656613148)
UPDATE customers SET
    name = 'GLORIOUS',
    total_spent = 10000,
    points = 10,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-09-30T20:30:14Z',
    last_purchase_date = '2022-09-30T20:30:14Z',
    updated_at = NOW()
WHERE phone = '255656613148';

-- Update ELIAS (255719007488)
UPDATE customers SET
    name = 'ELIAS',
    total_spent = 10000,
    points = 10,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-10-02T18:30:29Z',
    last_purchase_date = '2022-10-02T18:30:29Z',
    updated_at = NOW()
WHERE phone = '255719007488';

-- Update PETER (255712778182)
UPDATE customers SET
    name = 'PETER',
    total_spent = 10000,
    points = 10,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-10-11T14:48:28Z',
    last_purchase_date = '2022-10-11T14:48:28Z',
    updated_at = NOW()
WHERE phone = '255712778182';

-- Update OSCAR (255717088160)
UPDATE customers SET
    name = 'OSCAR',
    total_spent = 10000,
    points = 10,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-10-14T19:25:20Z',
    last_purchase_date = '2022-10-14T19:25:20Z',
    updated_at = NOW()
WHERE phone = '255717088160';

-- Update RACHEL (255653007661)
UPDATE customers SET
    name = 'RACHEL',
    total_spent = 10000,
    points = 10,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-10-28T14:30:24Z',
    last_purchase_date = '2022-10-28T14:30:24Z',
    updated_at = NOW()
WHERE phone = '255653007661';

-- Update MWASHI (255716849554)
UPDATE customers SET
    name = 'MWASHI',
    total_spent = 10000,
    points = 10,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-12-10T18:57:05Z',
    last_purchase_date = '2022-12-10T18:57:05Z',
    updated_at = NOW()
WHERE phone = '255716849554';

-- Update KUDRAT (255659846367)
UPDATE customers SET
    name = 'KUDRAT',
    total_spent = 10000,
    points = 10,
    loyalty_level = 'bronze',
    color_tag = 'new',
    total_purchases = 1,
    last_visit = '2022-12-15T20:00:09Z',
    last_purchase_date = '2022-12-15T20:00:09Z',
    updated_at = NOW()
WHERE phone = '255659846367';

-- Verify updates
SELECT name, phone, total_spent, points, loyalty_level, color_tag 
FROM customers 
WHERE total_spent > 0
ORDER BY total_spent DESC
LIMIT 20;
