-- Create spare_part_images table for spare parts (SAFE VERSION)
-- Run this SQL in your Supabase SQL Editor
-- This version handles existing objects gracefully

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create spare_part_images table if it doesn't exist
CREATE TABLE IF NOT EXISTS spare_part_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    spare_part_id UUID NOT NULL REFERENCES lats_spare_parts(id) ON DELETE CASCADE,
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

-- Create indexes for performance (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_spare_part_images_spare_part_id ON spare_part_images(spare_part_id);
CREATE INDEX IF NOT EXISTS idx_spare_part_images_is_primary ON spare_part_images(is_primary);
CREATE INDEX IF NOT EXISTS idx_spare_part_images_created_at ON spare_part_images(created_at);

-- Create trigger functions if they don't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION ensure_single_primary_spare_part_image()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = true THEN
        UPDATE spare_part_images 
        SET is_primary = false 
        WHERE spare_part_id = NEW.spare_part_id 
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS update_spare_part_images_updated_at ON spare_part_images;
DROP TRIGGER IF EXISTS ensure_single_primary_spare_part_image_trigger ON spare_part_images;

-- Create triggers
CREATE TRIGGER update_spare_part_images_updated_at 
    BEFORE UPDATE ON spare_part_images 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER ensure_single_primary_spare_part_image_trigger
    BEFORE INSERT OR UPDATE ON spare_part_images
    FOR EACH ROW EXECUTE FUNCTION ensure_single_primary_spare_part_image();

-- Enable RLS
ALTER TABLE spare_part_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to view spare part images" ON spare_part_images;
DROP POLICY IF EXISTS "Allow authenticated users to insert spare part images" ON spare_part_images;
DROP POLICY IF EXISTS "Allow authenticated users to update spare part images" ON spare_part_images;
DROP POLICY IF EXISTS "Allow authenticated users to delete spare part images" ON spare_part_images;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to view spare part images" 
    ON spare_part_images FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert spare part images" 
    ON spare_part_images FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update spare part images" 
    ON spare_part_images FOR UPDATE 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete spare part images" 
    ON spare_part_images FOR DELETE 
    USING (auth.role() = 'authenticated');

-- Add comments (these will be ignored if they already exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_description 
        WHERE objoid = 'spare_part_images'::regclass 
        AND objsubid = 0
    ) THEN
        COMMENT ON TABLE spare_part_images IS 'Stores images and thumbnails for spare parts';
    END IF;
END $$;

-- Verify the table was created successfully
SELECT 
    'spare_part_images table created successfully' as status,
    COUNT(*) as existing_records
FROM spare_part_images;
