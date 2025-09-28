-- Complete fix for customer_notes table with all possible conflicts handled
-- Copy and paste this into your Supabase SQL editor

-- First, let's check what exists and clean up completely
DO $$
BEGIN
    -- Drop all existing policies on customer_notes table
    DROP POLICY IF EXISTS "Enable read access for all users" ON customer_notes;
    DROP POLICY IF EXISTS "Enable insert access for all users" ON customer_notes;
    DROP POLICY IF EXISTS "Enable update access for all users" ON customer_notes;
    DROP POLICY IF EXISTS "Enable delete access for all users" ON customer_notes;
    DROP POLICY IF EXISTS "Users can view their own customer notes" ON customer_notes;
    DROP POLICY IF EXISTS "Users can insert their own customer notes" ON customer_notes;
    DROP POLICY IF EXISTS "Users can update their own customer notes" ON customer_notes;
    DROP POLICY IF EXISTS "Users can delete their own customer notes" ON customer_notes;
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON customer_notes;
    
    RAISE NOTICE 'Dropped all existing policies on customer_notes table';
END $$;

-- Create customer_notes table if it doesn't exist
CREATE TABLE IF NOT EXISTS customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance (IF NOT EXISTS handles duplicates)
CREATE INDEX IF NOT EXISTS idx_customer_notes_customer_id ON customer_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_created_by ON customer_notes(created_by);
CREATE INDEX IF NOT EXISTS idx_customer_notes_created_at ON customer_notes(created_at);

-- Enable RLS (safe to run multiple times)
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies with unique names
CREATE POLICY "customer_notes_read_policy" ON customer_notes FOR SELECT USING (true);
CREATE POLICY "customer_notes_insert_policy" ON customer_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "customer_notes_update_policy" ON customer_notes FOR UPDATE USING (true);
CREATE POLICY "customer_notes_delete_policy" ON customer_notes FOR DELETE USING (true);

-- Grant permissions (safe to run multiple times)
GRANT ALL ON customer_notes TO authenticated;

-- Verify table creation
SELECT 'Customer notes table created/verified successfully' as status;
