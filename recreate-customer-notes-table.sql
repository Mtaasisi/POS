-- Nuclear option: completely recreate customer_notes table
-- WARNING: This will delete all existing data in customer_notes table
-- Copy and paste this into your Supabase SQL editor

-- Step 1: Drop the entire table and all its dependencies
DROP TABLE IF EXISTS customer_notes CASCADE;

-- Step 2: Recreate the table from scratch
CREATE TABLE customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes
CREATE INDEX idx_customer_notes_customer_id ON customer_notes(customer_id);
CREATE INDEX idx_customer_notes_created_by ON customer_notes(created_by);
CREATE INDEX idx_customer_notes_created_at ON customer_notes(created_at);

-- Step 4: Enable RLS
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
CREATE POLICY "customer_notes_read_policy" ON customer_notes FOR SELECT USING (true);
CREATE POLICY "customer_notes_insert_policy" ON customer_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "customer_notes_update_policy" ON customer_notes FOR UPDATE USING (true);
CREATE POLICY "customer_notes_delete_policy" ON customer_notes FOR DELETE USING (true);

-- Step 6: Grant permissions
GRANT ALL ON customer_notes TO authenticated;

-- Step 7: Verify table creation
SELECT 'Customer notes table recreated successfully' as status;
