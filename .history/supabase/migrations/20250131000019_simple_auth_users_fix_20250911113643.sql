-- Simple fix for auth_users table - add missing columns
-- Migration: 20250131000019_simple_auth_users_fix.sql

-- Add is_active column if it doesn't exist
ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add points column if it doesn't exist
ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Add username column if it doesn't exist
ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS username TEXT;

-- Add name column if it doesn't exist
ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS name TEXT;

-- Add role column if it doesn't exist
ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'technician';

-- Add email column if it doesn't exist
ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS email TEXT;

-- Add created_at column if it doesn't exist
ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add updated_at column if it doesn't exist
ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email);
CREATE INDEX IF NOT EXISTS idx_auth_users_username ON auth_users(username);
CREATE INDEX IF NOT EXISTS idx_auth_users_role ON auth_users(role);
CREATE INDEX IF NOT EXISTS idx_auth_users_is_active ON auth_users(is_active);

-- Enable Row Level Security
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and create new one
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON auth_users;
CREATE POLICY "Enable all access for authenticated users" ON auth_users
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON auth_users TO authenticated;

-- Create trigger for updating timestamps
DROP TRIGGER IF EXISTS update_auth_users_updated_at ON auth_users;
CREATE TRIGGER update_auth_users_updated_at 
    BEFORE UPDATE ON auth_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert or update the technician users
INSERT INTO auth_users (id, email, username, name, role, is_active, points) VALUES
    ('9838a65b-e373-4d0a-bdfe-790304e9e3ea', 'technician1@example.com', 'technician1', 'Technician User 1', 'technician', true, 0),
    ('d1a28512-8b3a-425b-98a6-d47842b14313', 'technician2@example.com', 'technician2', 'Technician User 2', 'technician', true, 0)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    points = EXCLUDED.points;

-- Show success message
SELECT 'Auth users table fixed successfully' as message;