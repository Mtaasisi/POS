-- Cleanup duplicate users and ensure proper data
-- Migration: 20250131000029_cleanup_duplicate_users.sql

-- Remove duplicate users based on email, keeping the first one
WITH duplicate_users AS (
    SELECT id, email, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at) as rn
    FROM auth_users
    WHERE email IS NOT NULL
)
DELETE FROM auth_users 
WHERE id IN (
    SELECT id FROM duplicate_users WHERE rn > 1
);

-- Ensure we have at least one technician user
INSERT INTO auth_users (id, email, username, name, role, is_active, points) VALUES
    ('2e50be86-f31d-4700-bca7-1e2da2bae8b3', 'technician1@example.com', 'technician1', 'Technician User 1', 'technician', true, 0),
    ('9838a65b-e373-4d0a-bdfe-790304e9e3ea', 'technician2@example.com', 'technician2', 'Technician User 2', 'technician', true, 0)
ON CONFLICT (email) DO UPDATE SET
    username = EXCLUDED.username,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    points = EXCLUDED.points;

-- Clean up any orphaned settings records
DELETE FROM lats_pos_general_settings 
WHERE user_id NOT IN (SELECT id FROM auth_users);

DELETE FROM lats_pos_receipt_settings 
WHERE user_id NOT IN (SELECT id FROM auth_users);

-- Show final status
SELECT 'Cleanup completed successfully' as message;
SELECT 'Auth users: ' || COUNT(*) as auth_users_count FROM auth_users;
SELECT 'POS general settings: ' || COUNT(*) as general_settings_count FROM lats_pos_general_settings;
SELECT 'POS receipt settings: ' || COUNT(*) as receipt_settings_count FROM lats_pos_receipt_settings;
