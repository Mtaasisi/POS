-- Create employees table to fix 42P01 error
-- Migration: 20250124000001_create_employees_table.sql

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for employees table
CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(name);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON employees(is_active);

-- Enable RLS for employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for employees
DROP POLICY IF EXISTS "Enable read access for all users" ON employees;
DROP POLICY IF EXISTS "Enable insert access for all users" ON employees;
DROP POLICY IF EXISTS "Enable update access for all users" ON employees;

CREATE POLICY "Enable read access for all users" ON employees FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON employees FOR UPDATE USING (true);

-- Create trigger for updated_at (safe - drops existing first)
CREATE OR REPLACE FUNCTION update_employees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at 
    BEFORE UPDATE ON employees 
    FOR EACH ROW EXECUTE FUNCTION update_employees_updated_at();

-- Insert some sample employees for testing
INSERT INTO employees (name, email, phone, role, is_active) VALUES
    ('John Doe', 'john.doe@company.com', '+1234567890', 'Technician', true),
    ('Jane Smith', 'jane.smith@company.com', '+1234567891', 'Manager', true),
    ('Mike Johnson', 'mike.johnson@company.com', '+1234567892', 'Technician', true)
ON CONFLICT DO NOTHING;
