-- High Value Customers Import
-- Generated on 2025-09-24T00:19:56.891Z
-- Total customers: 10


-- High Value Customer: Unknown Customer (0755197700)
INSERT INTO customers (
  id,
  name,
  phone,
  email,
  city,
  gender,
  loyalty_level,
  color_tag,
  points,
  total_spent,
  created_at,
  updated_at,
  is_active,
  last_visit,
  notes
) VALUES (
  'customer_255755197700_1758673196890_0',
  'Unknown Customer',
  '0755197700',
  '',
  'Dar es Salaam',
  'other',
  'gold',
  'vip',
  1962286, -- Points based on spending
  1962286140,
  NOW(),
  NOW(),
  true,
  NOW(),
  'High-value customer identified from message analysis. Total spent: TZS 1,962,286,140, Messages: 498, Loyalty Score: 50%'
) ON CONFLICT (phone) DO UPDATE SET
  total_spent = GREATEST(customers.total_spent, 1962286140),
  loyalty_level = 'gold',
  color_tag = 'vip',
  notes = CONCAT(customers.notes, E'\n', 'Updated from message analysis - High value customer'),
  updated_at = NOW();

-- High Value Customer: Unknown Customer (255712378850)
INSERT INTO customers (
  id,
  name,
  phone,
  email,
  city,
  gender,
  loyalty_level,
  color_tag,
  points,
  total_spent,
  created_at,
  updated_at,
  is_active,
  last_visit,
  notes
) VALUES (
  'customer_255712378850_1758673196890_1',
  'Unknown Customer',
  '255712378850',
  '',
  'Dar es Salaam',
  'other',
  'gold',
  'vip',
  1121986, -- Points based on spending
  1121986330,
  NOW(),
  NOW(),
  true,
  NOW(),
  'High-value customer identified from message analysis. Total spent: TZS 1,121,986,330, Messages: 573, Loyalty Score: 60%'
) ON CONFLICT (phone) DO UPDATE SET
  total_spent = GREATEST(customers.total_spent, 1121986330),
  loyalty_level = 'gold',
  color_tag = 'vip',
  notes = CONCAT(customers.notes, E'\n', 'Updated from message analysis - High value customer'),
  updated_at = NOW();

-- High Value Customer: Unknown Customer (0768985500)
INSERT INTO customers (
  id,
  name,
  phone,
  email,
  city,
  gender,
  loyalty_level,
  color_tag,
  points,
  total_spent,
  created_at,
  updated_at,
  is_active,
  last_visit,
  notes
) VALUES (
  'customer_255768985500_1758673196890_2',
  'Unknown Customer',
  '0768985500',
  '',
  'Dar es Salaam',
  'other',
  'gold',
  'vip',
  380752, -- Points based on spending
  380752409,
  NOW(),
  NOW(),
  true,
  NOW(),
  'High-value customer identified from message analysis. Total spent: TZS 380,752,409, Messages: 611, Loyalty Score: 50%'
) ON CONFLICT (phone) DO UPDATE SET
  total_spent = GREATEST(customers.total_spent, 380752409),
  loyalty_level = 'gold',
  color_tag = 'vip',
  notes = CONCAT(customers.notes, E'\n', 'Updated from message analysis - High value customer'),
  updated_at = NOW();

-- High Value Customer: Unknown Customer (255746605561)
INSERT INTO customers (
  id,
  name,
  phone,
  email,
  city,
  gender,
  loyalty_level,
  color_tag,
  points,
  total_spent,
  created_at,
  updated_at,
  is_active,
  last_visit,
  notes
) VALUES (
  'customer_255746605561_1758673196890_3',
  'Unknown Customer',
  '255746605561',
  '',
  'Dar es Salaam',
  'other',
  'gold',
  'vip',
  92304, -- Points based on spending
  92304307,
  NOW(),
  NOW(),
  true,
  NOW(),
  'High-value customer identified from message analysis. Total spent: TZS 92,304,307, Messages: 363, Loyalty Score: 50%'
) ON CONFLICT (phone) DO UPDATE SET
  total_spent = GREATEST(customers.total_spent, 92304307),
  loyalty_level = 'gold',
  color_tag = 'vip',
  notes = CONCAT(customers.notes, E'\n', 'Updated from message analysis - High value customer'),
  updated_at = NOW();

-- High Value Customer: Unknown Customer (+255714197700)
INSERT INTO customers (
  id,
  name,
  phone,
  email,
  city,
  gender,
  loyalty_level,
  color_tag,
  points,
  total_spent,
  created_at,
  updated_at,
  is_active,
  last_visit,
  notes
) VALUES (
  'customer_255714197700_1758673196890_4',
  'Unknown Customer',
  '+255714197700',
  '',
  'Dar es Salaam',
  'other',
  'gold',
  'vip',
  41850, -- Points based on spending
  41850281,
  NOW(),
  NOW(),
  true,
  NOW(),
  'High-value customer identified from message analysis. Total spent: TZS 41,850,281, Messages: 37, Loyalty Score: 50%'
) ON CONFLICT (phone) DO UPDATE SET
  total_spent = GREATEST(customers.total_spent, 41850281),
  loyalty_level = 'gold',
  color_tag = 'vip',
  notes = CONCAT(customers.notes, E'\n', 'Updated from message analysis - High value customer'),
  updated_at = NOW();

-- High Value Customer: Fella 💸 (+255714261732)
INSERT INTO customers (
  id,
  name,
  phone,
  email,
  city,
  gender,
  loyalty_level,
  color_tag,
  points,
  total_spent,
  created_at,
  updated_at,
  is_active,
  last_visit,
  notes
) VALUES (
  'customer_255714261732_1758673196890_5',
  'Fella 💸',
  '+255714261732',
  '',
  'Dar es Salaam',
  'other',
  'gold',
  'vip',
  33166, -- Points based on spending
  33166302,
  NOW(),
  NOW(),
  true,
  NOW(),
  'High-value customer identified from message analysis. Total spent: TZS 33,166,302, Messages: 49, Loyalty Score: 50%'
) ON CONFLICT (phone) DO UPDATE SET
  total_spent = GREATEST(customers.total_spent, 33166302),
  loyalty_level = 'gold',
  color_tag = 'vip',
  notes = CONCAT(customers.notes, E'\n', 'Updated from message analysis - High value customer'),
  updated_at = NOW();

-- High Value Customer: Unknown Customer (717268500)
INSERT INTO customers (
  id,
  name,
  phone,
  email,
  city,
  gender,
  loyalty_level,
  color_tag,
  points,
  total_spent,
  created_at,
  updated_at,
  is_active,
  last_visit,
  notes
) VALUES (
  'customer_255717268500_1758673196890_6',
  'Unknown Customer',
  '717268500',
  '',
  'Dar es Salaam',
  'other',
  'gold',
  'vip',
  32379, -- Points based on spending
  32379433,
  NOW(),
  NOW(),
  true,
  NOW(),
  'High-value customer identified from message analysis. Total spent: TZS 32,379,433, Messages: 14, Loyalty Score: 50%'
) ON CONFLICT (phone) DO UPDATE SET
  total_spent = GREATEST(customers.total_spent, 32379433),
  loyalty_level = 'gold',
  color_tag = 'vip',
  notes = CONCAT(customers.notes, E'\n', 'Updated from message analysis - High value customer'),
  updated_at = NOW();

-- High Value Customer: Unknown Customer (0711185886)
INSERT INTO customers (
  id,
  name,
  phone,
  email,
  city,
  gender,
  loyalty_level,
  color_tag,
  points,
  total_spent,
  created_at,
  updated_at,
  is_active,
  last_visit,
  notes
) VALUES (
  'customer_255711185886_1758673196891_7',
  'Unknown Customer',
  '0711185886',
  '',
  'Dar es Salaam',
  'other',
  'gold',
  'vip',
  29857, -- Points based on spending
  29857681,
  NOW(),
  NOW(),
  true,
  NOW(),
  'High-value customer identified from message analysis. Total spent: TZS 29,857,681, Messages: 8, Loyalty Score: 50%'
) ON CONFLICT (phone) DO UPDATE SET
  total_spent = GREATEST(customers.total_spent, 29857681),
  loyalty_level = 'gold',
  color_tag = 'vip',
  notes = CONCAT(customers.notes, E'\n', 'Updated from message analysis - High value customer'),
  updated_at = NOW();

-- High Value Customer: INAUZWA (0746813813)
INSERT INTO customers (
  id,
  name,
  phone,
  email,
  city,
  gender,
  loyalty_level,
  color_tag,
  points,
  total_spent,
  created_at,
  updated_at,
  is_active,
  last_visit,
  notes
) VALUES (
  'customer_255746813813_1758673196891_8',
  'INAUZWA',
  '0746813813',
  '',
  'Dar es Salaam',
  'other',
  'gold',
  'vip',
  26584, -- Points based on spending
  26584037,
  NOW(),
  NOW(),
  true,
  NOW(),
  'High-value customer identified from message analysis. Total spent: TZS 26,584,037, Messages: 47, Loyalty Score: 60%'
) ON CONFLICT (phone) DO UPDATE SET
  total_spent = GREATEST(customers.total_spent, 26584037),
  loyalty_level = 'gold',
  color_tag = 'vip',
  notes = CONCAT(customers.notes, E'\n', 'Updated from message analysis - High value customer'),
  updated_at = NOW();

-- High Value Customer: Emmano Mwilongo (+255717364036)
INSERT INTO customers (
  id,
  name,
  phone,
  email,
  city,
  gender,
  loyalty_level,
  color_tag,
  points,
  total_spent,
  created_at,
  updated_at,
  is_active,
  last_visit,
  notes
) VALUES (
  'customer_255717364036_1758673196891_9',
  'Emmano Mwilongo',
  '+255717364036',
  '',
  'Dar es Salaam',
  'other',
  'gold',
  'vip',
  24373, -- Points based on spending
  24373396,
  NOW(),
  NOW(),
  true,
  NOW(),
  'High-value customer identified from message analysis. Total spent: TZS 24,373,396, Messages: 40, Loyalty Score: 70%'
) ON CONFLICT (phone) DO UPDATE SET
  total_spent = GREATEST(customers.total_spent, 24373396),
  loyalty_level = 'gold',
  color_tag = 'vip',
  notes = CONCAT(customers.notes, E'\n', 'Updated from message analysis - High value customer'),
  updated_at = NOW();