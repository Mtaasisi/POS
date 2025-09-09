-- Add sample air shipping agents for testing
-- This migration adds agents that support air shipping

-- Insert air shipping agents
INSERT INTO lats_shipping_agents (
    name, phone, whatsapp, company, address, city, country,
    supported_shipping_types, service_areas, specializations,
    price_per_cbm, price_per_kg, minimum_order_value,
    average_delivery_time, notes, rating, total_shipments, is_active
) VALUES 
(
    'Air Cargo Express',
    '+255 22 300 1000',
    '+255 22 300 1000',
    'Air Cargo Express Ltd',
    'Julius Nyerere International Airport',
    'Dar es Salaam',
    'Tanzania',
    '["air", "express"]',
    '["Dar es Salaam", "Arusha", "Mwanza", "Kilimanjaro"]',
    '["electronics", "documents", "urgent packages"]',
    200.00,
    35.00,
    200.00,
    '1-2 days',
    'Specialized air cargo service for urgent shipments',
    4.7,
    0,
    true
),
(
    'Sky Logistics Tanzania',
    '+255 22 300 2000',
    '+255 22 300 2000',
    'Sky Logistics',
    'Airport Road, Terminal 2',
    'Dar es Salaam',
    'Tanzania',
    '["air", "sea", "ground"]',
    '["Dar es Salaam", "Arusha", "Mwanza", "Dodoma", "Tanga"]',
    '["electronics", "heavy goods", "perishables"]',
    180.00,
    30.00,
    150.00,
    '2-3 days',
    'Multi-modal logistics provider with air shipping expertise',
    4.5,
    0,
    true
),
(
    'Express Air Tanzania',
    '+255 22 300 3000',
    '+255 22 300 3000',
    'Express Air',
    'Kilimanjaro Airport',
    'Arusha',
    'Tanzania',
    '["air", "express", "overnight"]',
    '["Arusha", "Dar es Salaam", "Mwanza", "Kilimanjaro"]',
    '["documents", "small packages", "urgent deliveries"]',
    220.00,
    40.00,
    100.00,
    'Same day - 1 day',
    'Fastest air delivery service in Tanzania',
    4.8,
    0,
    true
),
(
    'Global Air Freight',
    '+255 22 300 4000',
    '+255 22 300 4000',
    'Global Air Freight Co',
    'Cargo Terminal, JNIA',
    'Dar es Salaam',
    'Tanzania',
    '["air", "international", "freight"]',
    '["Dar es Salaam", "Arusha", "Mwanza"]',
    '["electronics", "machinery", "bulk cargo"]',
    160.00,
    28.00,
    500.00,
    '3-5 days',
    'International air freight specialist',
    4.4,
    0,
    true
)
ON CONFLICT (name) DO NOTHING;

-- Update existing agents to include air shipping if they don't have it
UPDATE lats_shipping_agents 
SET supported_shipping_types = supported_shipping_types || '["air"]'::jsonb
WHERE name IN ('DHL Express Tanzania', 'FedEx Tanzania')
AND NOT (supported_shipping_types ? 'air');

-- Add comments
COMMENT ON TABLE lats_shipping_agents IS 'Shipping agents with air, sea, and ground shipping capabilities';
