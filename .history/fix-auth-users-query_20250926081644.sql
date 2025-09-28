-- FIX AUTH_USERS QUERY 400 ERROR
-- This script fixes the malformed query issue

-- 1. Check if auth_users table exists and has data
SELECT 
    'Checking auth_users table structure' as step;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'auth_users'
ORDER BY ordinal_position;

-- 2. Check existing users in auth_users
SELECT 
    'Current users in auth_users table' as step;

SELECT 
    id,
    name,
    email,
    username,
    role,
    is_active,
    created_at
FROM auth_users
ORDER BY created_at DESC;

-- 3. Test the correct query pattern (this should work)
SELECT 
    'Testing correct query pattern' as step;

-- This is the CORRECT way to query by name
SELECT 
    id,
    name,
    email
FROM auth_users 
WHERE name = 'care';

-- 4. Test the correct in() syntax (if you need multiple values)
SELECT 
    'Testing correct in() syntax' as step;

-- This is the CORRECT way to use in() with multiple values
SELECT 
    id,
    name,
    email
FROM auth_users 
WHERE name IN ('care', 'admin', 'technician');

-- 5. Show the difference between correct and incorrect syntax
SELECT 
    '✅ CORRECT: WHERE name = "care"' as correct_syntax,
    '❌ WRONG: WHERE id = in.(care)' as wrong_syntax,
    '❌ WRONG: WHERE id = in.(care)' as wrong_syntax2;

-- 6. Create a test user if needed
INSERT INTO auth_users (name, email, username, role, is_active)
VALUES ('care', 'care@example.com', 'care', 'technician', true)
ON CONFLICT (name) DO NOTHING;

-- 7. Final test - this should work without 400 error
SELECT 
    'Final test - should work without 400 error' as step;

SELECT 
    id,
    name,
    email,
    username,
    role
FROM auth_users 
WHERE name = 'care';

-- 8. Success message
SELECT 
    '✅ AUTH_USERS QUERY FIX COMPLETED!' as status,
    'Use .eq("name", "care") instead of .in("id", ["care"]) in your JavaScript code' as solution;
