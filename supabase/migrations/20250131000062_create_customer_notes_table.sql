-- Create customer_notes table
-- Migration: 20250131000062_create_customer_notes_table.sql

-- Create customer_notes table
CREATE TABLE IF NOT EXISTS customer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_notes_customer_id ON customer_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_notes_created_by ON customer_notes(created_by);
CREATE INDEX IF NOT EXISTS idx_customer_notes_created_at ON customer_notes(created_at);

-- Enable RLS
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON customer_notes FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON customer_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON customer_notes FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON customer_notes FOR DELETE USING (true);

-- Grant permissions
GRANT ALL ON customer_notes TO authenticated;

-- Verify table creation
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_notes') THEN
    RAISE NOTICE '✅ Customer notes table created successfully';
  ELSE
    RAISE NOTICE '❌ Customer notes table creation failed';
  END IF;
END $$;
