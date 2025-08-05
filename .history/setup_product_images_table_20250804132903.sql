-- Setup Product Images Table
-- This script creates the product_images table for storing product images and thumbnails

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create product_images table
CREATE TABLE IF NOT EXISTS product_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    uploaded_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_is_primary ON product_images(is_primary);
CREATE INDEX IF NOT EXISTS idx_product_images_created_at ON product_images(created_at);

-- Create a unique constraint to ensure only one primary image per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_images_primary_unique 
ON product_images(product_id) WHERE is_primary = true;

-- Create RLS policies for product_images table
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view product images
CREATE POLICY "Users can view product images" ON product_images
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for authenticated users to insert product images
CREATE POLICY "Users can insert product images" ON product_images
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update their own product images
CREATE POLICY "Users can update product images" ON product_images
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for authenticated users to delete their own product images
CREATE POLICY "Users can delete product images" ON product_images
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create storage bucket for product images if it doesn't exist
-- Note: This needs to be done in the Supabase dashboard or via API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_product_images_updated_at
    BEFORE UPDATE ON product_images
    FOR EACH ROW
    EXECUTE FUNCTION update_product_images_updated_at();

-- Add images column to products table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'images'
    ) THEN
        ALTER TABLE products ADD COLUMN images TEXT[];
    END IF;
END $$; 