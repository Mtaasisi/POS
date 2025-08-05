-- Create brands table if it doesn't exist
CREATE TABLE IF NOT EXISTS brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url TEXT,
  category JSONB DEFAULT '[]'::jsonb,
  categories JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_brands_active ON brands(is_active);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_brands_updated_at ON brands;
CREATE TRIGGER update_brands_updated_at 
  BEFORE UPDATE ON brands 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON brands;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON brands;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON brands;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON brands;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON brands
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON brands
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON brands
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON brands
  FOR DELETE USING (auth.role() = 'authenticated');

-- Insert sample brands only if they don't exist
INSERT INTO brands (name, description, category, is_active) VALUES
  ('Apple', 'Apple Inc. - Premium electronics manufacturer', '["phone", "laptop", "tablet"]', true),
  ('Samsung', 'Samsung Electronics - Global technology leader', '["phone", "laptop", "tablet"]', true),
  ('Generic', 'Generic/Third-party replacement parts', '["accessories", "other"]', true),
  ('Dell', 'Dell Technologies - Computer hardware company', '["laptop", "desktop", "monitor"]', true),
  ('HP', 'Hewlett-Packard - Technology company', '["laptop", "printer", "desktop"]', true)
ON CONFLICT (name) DO NOTHING; 