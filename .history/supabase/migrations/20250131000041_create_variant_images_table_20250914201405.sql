-- Create variant_images table for variant-specific images
-- Migration: 20250131000041_create_variant_images_table.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create variant_images table
CREATE TABLE IF NOT EXISTS variant_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    variant_id UUID NOT NULL REFERENCES lats_product_variants(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_variant_images_variant_id ON variant_images(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_images_is_primary ON variant_images(is_primary);
CREATE INDEX IF NOT EXISTS idx_variant_images_created_at ON variant_images(created_at);

-- Create trigger functions if they don't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION ensure_single_primary_variant_image()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = true THEN
        UPDATE variant_images 
        SET is_primary = false 
        WHERE variant_id = NEW.variant_id 
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS update_variant_images_updated_at ON variant_images;
DROP TRIGGER IF EXISTS ensure_single_primary_variant_image_trigger ON variant_images;

-- Create triggers
CREATE TRIGGER update_variant_images_updated_at 
    BEFORE UPDATE ON variant_images 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER ensure_single_primary_variant_image_trigger
    BEFORE INSERT OR UPDATE ON variant_images
    FOR EACH ROW EXECUTE FUNCTION ensure_single_primary_variant_image();

-- Enable RLS
ALTER TABLE variant_images ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to view variant images" 
    ON variant_images FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert variant images" 
    ON variant_images FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update variant images" 
    ON variant_images FOR UPDATE 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete variant images" 
    ON variant_images FOR DELETE 
    USING (auth.role() = 'authenticated');

-- Add comment to table
COMMENT ON TABLE variant_images IS 'Stores variant-specific images with fallback to product images';
COMMENT ON COLUMN variant_images.variant_id IS 'References lats_product_variants.id';
COMMENT ON COLUMN variant_images.is_primary IS 'Only one primary image per variant';
