-- Add missing columns to auth_users table
-- Migration: 20250131000018_add_missing_auth_users_columns.sql

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_users' AND column_name = 'is_active') THEN
        ALTER TABLE auth_users ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column to auth_users table';
    END IF;
    
    -- Add points column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_users' AND column_name = 'points') THEN
        ALTER TABLE auth_users ADD COLUMN points INTEGER DEFAULT 0;
        RAISE NOTICE 'Added points column to auth_users table';
    END IF;
    
    -- Add username column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_users' AND column_name = 'username') THEN
        ALTER TABLE auth_users ADD COLUMN username TEXT;
        RAISE NOTICE 'Added username column to auth_users table';
    END IF;
    
    -- Add name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_users' AND column_name = 'name') THEN
        ALTER TABLE auth_users ADD COLUMN name TEXT;
        RAISE NOTICE 'Added name column to auth_users table';
    END IF;
    
    -- Add role column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_users' AND column_name = 'role') THEN
        ALTER TABLE auth_users ADD COLUMN role TEXT DEFAULT 'technician';
        RAISE NOTICE 'Added role column to auth_users table';
    END IF;
    
    -- Add email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_users' AND column_name = 'email') THEN
        ALTER TABLE auth_users ADD COLUMN email TEXT;
        RAISE NOTICE 'Added email column to auth_users table';
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_users' AND column_name = 'created_at') THEN
        ALTER TABLE auth_users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to auth_users table';
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_users' AND column_name = 'updated_at') THEN
        ALTER TABLE auth_users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to auth_users table';
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email);
CREATE INDEX IF NOT EXISTS idx_auth_users_username ON auth_users(username);
CREATE INDEX IF NOT EXISTS idx_auth_users_role ON auth_users(role);
CREATE INDEX IF NOT EXISTS idx_auth_users_is_active ON auth_users(is_active);

-- Enable Row Level Security if not already enabled
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;

-- Create policy if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'auth_users' 
        AND policyname = 'Enable all access for authenticated users'
    ) THEN
        CREATE POLICY "Enable all access for authenticated users" ON auth_users
            FOR ALL USING (auth.role() = 'authenticated');
        RAISE NOTICE 'Created RLS policy for auth_users table';
    END IF;
END $$;

-- Grant permissions
GRANT ALL ON auth_users TO authenticated;

-- Create trigger for updating timestamps if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_auth_users_updated_at'
    ) THEN
        CREATE TRIGGER update_auth_users_updated_at 
            BEFORE UPDATE ON auth_users 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created update trigger for auth_users table';
    END IF;
END $$;

-- Insert or update the technician user
INSERT INTO auth_users (id, email, username, name, role, is_active, points) VALUES
    ('9838a65b-e373-4d0a-bdfe-790304e9e3ea', 'technician@example.com', 'technician1', 'Technician User', 'technician', true, 0)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    points = EXCLUDED.points;

-- Verify the table structure
DO $$
BEGIN
    RAISE NOTICE 'Auth users table structure:';
    RAISE NOTICE 'Columns: %', (
        SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
        FROM information_schema.columns 
        WHERE table_name = 'auth_users' 
        AND table_schema = 'public'
    );
END $$;
