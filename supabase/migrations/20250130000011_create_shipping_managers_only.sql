-- Create only the shipping managers table to fix 404 error
-- This is the minimal migration needed

CREATE TABLE IF NOT EXISTS lats_shipping_managers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    department TEXT DEFAULT 'Logistics',
    is_active BOOLEAN DEFAULT true,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_shipping_managers_is_active ON lats_shipping_managers(is_active);

-- Enable RLS
ALTER TABLE lats_shipping_managers ENABLE ROW LEVEL SECURITY;

-- Create simple policy
CREATE POLICY "Allow all operations" ON lats_shipping_managers FOR ALL USING (true);

-- Insert default data
INSERT INTO lats_shipping_managers (name, email, department, is_active)
VALUES ('Default Logistics Manager', 'logistics@company.com', 'Logistics', true)
ON CONFLICT DO NOTHING;
