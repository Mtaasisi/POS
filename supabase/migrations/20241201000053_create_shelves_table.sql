-- Create shelves table for inventory management
CREATE TABLE IF NOT EXISTS shelves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 100,
    current_usage INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_shelves_location ON shelves(location);
CREATE INDEX IF NOT EXISTS idx_shelves_category ON shelves(category);
CREATE INDEX IF NOT EXISTS idx_shelves_status ON shelves(status);
CREATE INDEX IF NOT EXISTS idx_shelves_created_at ON shelves(created_at);

-- Enable Row Level Security
ALTER TABLE shelves ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view shelves" ON shelves
    FOR SELECT USING (true);

CREATE POLICY "Admin users can insert shelves" ON shelves
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.role = 'admin'
        )
    );

CREATE POLICY "Admin users can update shelves" ON shelves
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.role = 'admin'
        )
    );

CREATE POLICY "Admin users can delete shelves" ON shelves
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.role = 'admin'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shelves_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_shelves_updated_at
    BEFORE UPDATE ON shelves
    FOR EACH ROW
    EXECUTE FUNCTION update_shelves_updated_at();

-- Insert some sample data
INSERT INTO shelves (name, location, capacity, current_usage, category, description, status) VALUES
('Shelf A1', 'Warehouse 1', 100, 75, 'Electronics', 'Main electronics storage shelf', 'active'),
('Shelf B2', 'Warehouse 2', 150, 120, 'Clothing', 'Fashion items storage', 'active'),
('Shelf C3', 'Warehouse 1', 80, 0, 'Books', 'Book storage area', 'inactive'),
('Shelf D4', 'Store A', 200, 180, 'Home & Garden', 'Home improvement products', 'active'),
('Shelf E5', 'Storage Room 1', 60, 45, 'Sports', 'Sports equipment storage', 'active');
