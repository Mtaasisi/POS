-- Update user role to admin for xamuelhance10@gmail.com
-- Run this in your Supabase SQL editor

UPDATE auth_users 
SET role = 'admin', 
    updated_at = NOW()
WHERE email = 'xamuelhance10@gmail.com';

-- Verify the update
SELECT id, email, name, role, is_active, created_at, updated_at 
FROM auth_users 
WHERE email = 'xamuelhance10@gmail.com';
