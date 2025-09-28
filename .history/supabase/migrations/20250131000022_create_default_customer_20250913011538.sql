-- Create default customer for migration purposes
-- This migration creates a default customer to handle NULL customer_id values

INSERT INTO customers (id, name, phone, email, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'Unknown Customer',
    '0000000000',
    'unknown@example.com',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO NOTHING;
