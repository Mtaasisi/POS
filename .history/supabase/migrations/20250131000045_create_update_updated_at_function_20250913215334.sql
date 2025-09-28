-- Create update_updated_at_column function
-- Migration: 20250131000045_create_update_updated_at_function.sql

-- Create the function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
