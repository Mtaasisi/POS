-- Create auth_users table for user management
-- Migration: 20250131000016_create_auth_users_table.sql

-- Create auth_users table
CREATE TABLE IF NOT EXISTS auth_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'technician' CHECK (role IN ('admin', 'customer-care', 'technician')),
    is_active BOOLEAN DEFAULT true,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_users' AND column_name = 'is_active') THEN
        ALTER TABLE auth_users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Add points column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_users' AND column_name = 'points') THEN
        ALTER TABLE auth_users ADD COLUMN points INTEGER DEFAULT 0;
    END IF;
    
    -- Add username column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_users' AND column_name = 'username') THEN
        ALTER TABLE auth_users ADD COLUMN username TEXT UNIQUE;
    END IF;
    
    -- Add name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_users' AND column_name = 'name') THEN
        ALTER TABLE auth_users ADD COLUMN name TEXT;
    END IF;
    
    -- Add role column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_users' AND column_name = 'role') THEN
        ALTER TABLE auth_users ADD COLUMN role TEXT DEFAULT 'technician';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email);
CREATE INDEX IF NOT EXISTS idx_auth_users_username ON auth_users(username);
CREATE INDEX IF NOT EXISTS idx_auth_users_role ON auth_users(role);
CREATE INDEX IF NOT EXISTS idx_auth_users_is_active ON auth_users(is_active);

-- Enable Row Level Security
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for authenticated users
CREATE POLICY "Enable all access for authenticated users" ON auth_users
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions to authenticated users
GRANT ALL ON auth_users TO authenticated;

-- Create trigger for updating timestamps
CREATE TRIGGER update_auth_users_updated_at 
    BEFORE UPDATE ON auth_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default users if they don't exist
INSERT INTO auth_users (id, email, username, name, role, is_active, points) VALUES
    ('9838a65b-e373-4d0a-bdfe-790304e9e3ea', 'technician@example.com', 'technician1', 'Technician User', 'technician', true, 0)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    points = EXCLUDED.points;

-- Verify the table was created successfully
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'auth_users' 
    AND table_schema = 'public'
  ) THEN
    RAISE NOTICE '✅ Auth users table created successfully';
  ELSE
    RAISE NOTICE '❌ Failed to create auth users table';
  END IF;
END $$;
