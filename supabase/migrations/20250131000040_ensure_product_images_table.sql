-- Ensure product_images table exists
-- Migration: 20250131000040_ensure_product_images_table.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create product_images table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT DEFAULT 'image/jpeg',
    is_primary BOOLEAN DEFAULT false,
    uploaded_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_is_primary ON product_images(is_primary);
CREATE INDEX IF NOT EXISTS idx_product_images_created_at ON product_images(created_at);

-- Create trigger functions if they don't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = true THEN
        UPDATE product_images 
        SET is_primary = false 
        WHERE product_id = NEW.product_id 
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS update_product_images_updated_at ON product_images;
DROP TRIGGER IF EXISTS ensure_single_primary_image_trigger ON product_images;

-- Create triggers
CREATE TRIGGER update_product_images_updated_at 
    BEFORE UPDATE ON product_images 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER ensure_single_primary_image_trigger
    BEFORE INSERT OR UPDATE ON product_images
    FOR EACH ROW EXECUTE FUNCTION ensure_single_primary_image();

-- Enable Row Level Security
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and create new ones
DROP POLICY IF EXISTS "Allow authenticated users to view product images" ON product_images;
DROP POLICY IF EXISTS "Allow authenticated users to insert product images" ON product_images;
DROP POLICY IF EXISTS "Allow authenticated users to update product images" ON product_images;
DROP POLICY IF EXISTS "Allow authenticated users to delete product images" ON product_images;

-- Create permissive policies for online Supabase
CREATE POLICY "Allow authenticated users to view product images" ON product_images
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert product images" ON product_images
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update product images" ON product_images
    FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated users to delete product images" ON product_images
    FOR DELETE USING (true);

-- Grant permissions
GRANT ALL ON product_images TO authenticated;
GRANT ALL ON product_images TO anon;
