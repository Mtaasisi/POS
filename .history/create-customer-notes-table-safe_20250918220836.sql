-- Create customer_notes table safely (handles existing policies)
-- Copy and paste this into your Supabase SQL editor

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

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Enable read access for all users" ON customer_notes;
DROP POLICY IF EXISTS "Enable insert access for all users" ON customer_notes;
DROP POLICY IF EXISTS "Enable update access for all users" ON customer_notes;
DROP POLICY IF EXISTS "Enable delete access for all users" ON customer_notes;

-- Create RLS policies (now safe to create)
CREATE POLICY "Enable read access for all users" ON customer_notes FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON customer_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON customer_notes FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON customer_notes FOR DELETE USING (true);

-- Grant permissions (safe to run multiple times)
GRANT ALL ON customer_notes TO authenticated;

-- Verify table creation
SELECT 'Customer notes table created/verified successfully' as status;
