-- Fix customers table structure for online Supabase instance
-- This will resolve the 400 Bad Request error when updating customers

-- First, let's check and fix the color_tag constraint to match the TypeScript types
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_color_tag_check;

-- Update the color_tag constraint to match the TypeScript interface
ALTER TABLE customers ADD CONSTRAINT customers_color_tag_check 
CHECK (color_tag IN ('normal', 'vip', 'complainer', 'purchased'));

-- Update existing 'new' values to 'normal' to match the constraint
UPDATE customers SET color_tag = 'normal' WHERE color_tag = 'new';

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'created_by') THEN
        ALTER TABLE customers ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
    
    -- Add initial_notes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'initial_notes') THEN
        ALTER TABLE customers ADD COLUMN initial_notes TEXT;
    END IF;
    
    -- Add location_description column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'location_description') THEN
        ALTER TABLE customers ADD COLUMN location_description TEXT;
    END IF;
    
    -- Add national_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'national_id') THEN
        ALTER TABLE customers ADD COLUMN national_id TEXT;
    END IF;
    
    -- Add profile_image column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customers' AND column_name = 'profile_image') THEN
        ALTER TABLE customers ADD COLUMN profile_image TEXT;
    END IF;
END $$;

-- Fix RLS policies for customers table
DROP POLICY IF EXISTS "Users can view customers" ON customers;
DROP POLICY IF EXISTS "Users can insert customers" ON customers;
DROP POLICY IF EXISTS "Users can update customers" ON customers;
DROP POLICY IF EXISTS "Users can delete customers" ON customers;

-- Create comprehensive policies for customers
CREATE POLICY "Users can view customers" ON customers 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert customers" ON customers 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update customers" ON customers 
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete customers" ON customers 
FOR DELETE USING (auth.role() = 'authenticated');

-- Success message
SELECT 'Customers table structure and RLS policies fixed successfully!' as status; 