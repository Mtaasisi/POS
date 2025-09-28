-- Create spare_part_images table from scratch
-- Run this SQL in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create spare_part_images table
CREATE TABLE spare_part_images (
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

-- Create indexes for performance
CREATE INDEX idx_spare_part_images_spare_part_id ON spare_part_images(spare_part_id);
CREATE INDEX idx_spare_part_images_is_primary ON spare_part_images(is_primary);
CREATE INDEX idx_spare_part_images_created_at ON spare_part_images(created_at);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger function for single primary image
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

-- Create triggers
CREATE TRIGGER update_spare_part_images_updated_at 
    BEFORE UPDATE ON spare_part_images 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER ensure_single_primary_spare_part_image_trigger
    BEFORE INSERT OR UPDATE ON spare_part_images
    FOR EACH ROW EXECUTE FUNCTION ensure_single_primary_spare_part_image();

-- Enable RLS
ALTER TABLE spare_part_images ENABLE ROW LEVEL SECURITY;

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

-- Add comments
COMMENT ON TABLE spare_part_images IS 'Stores images and thumbnails for spare parts';
COMMENT ON COLUMN spare_part_images.spare_part_id IS 'Reference to spare part in lats_spare_parts table';
COMMENT ON COLUMN spare_part_images.image_url IS 'URL of the main image';
COMMENT ON COLUMN spare_part_images.thumbnail_url IS 'URL of the thumbnail image';
COMMENT ON COLUMN spare_part_images.file_name IS 'Original filename of the uploaded image';
COMMENT ON COLUMN spare_part_images.file_size IS 'Size of the image file in bytes';
COMMENT ON COLUMN spare_part_images.mime_type IS 'MIME type of the image file';
COMMENT ON COLUMN spare_part_images.is_primary IS 'Whether this is the primary image for the spare part';
COMMENT ON COLUMN spare_part_images.uploaded_by IS 'User who uploaded the image';

-- Verify the table was created
SELECT 'spare_part_images table created successfully!' as status;
