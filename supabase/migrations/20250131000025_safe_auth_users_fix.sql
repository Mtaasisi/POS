-- Safe fix for auth_users table - add missing columns
-- Migration: 20250131000025_safe_auth_users_fix.sql

-- Ensure the table exists first
CREATE TABLE IF NOT EXISTS auth_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Add columns one by one with proper error handling
DO $$
BEGIN
    -- Add is_active column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_users' AND column_name = 'is_active') THEN
        ALTER TABLE auth_users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Add points column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_users' AND column_name = 'points') THEN
        ALTER TABLE auth_users ADD COLUMN points INTEGER DEFAULT 0;
    END IF;
    
    -- Add username column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_users' AND column_name = 'username') THEN
        ALTER TABLE auth_users ADD COLUMN username TEXT;
    END IF;
    
    -- Add name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_users' AND column_name = 'name') THEN
        ALTER TABLE auth_users ADD COLUMN name TEXT;
    END IF;
    
    -- Add role column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_users' AND column_name = 'role') THEN
        ALTER TABLE auth_users ADD COLUMN role TEXT DEFAULT 'technician';
    END IF;
    
    -- Add email column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_users' AND column_name = 'email') THEN
        ALTER TABLE auth_users ADD COLUMN email TEXT;
    END IF;
    
    -- Add created_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_users' AND column_name = 'created_at') THEN
        ALTER TABLE auth_users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add updated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_users' AND column_name = 'updated_at') THEN
        ALTER TABLE auth_users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

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

-- Create trigger for updating timestamps (only if function exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        DROP TRIGGER IF EXISTS update_auth_users_updated_at ON auth_users;
        CREATE TRIGGER update_auth_users_updated_at 
            BEFORE UPDATE ON auth_users 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

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
