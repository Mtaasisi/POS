-- Add missing columns to product_images table
-- This migration adds the mime_type column that's needed for the enhanced image upload service

-- Add mime_type column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_images' 
        AND column_name = 'mime_type'
    ) THEN
        ALTER TABLE product_images ADD COLUMN mime_type TEXT DEFAULT 'image/jpeg';
        RAISE NOTICE 'Added mime_type column to product_images table';
    ELSE
        RAISE NOTICE 'mime_type column already exists in product_images table';
    END IF;
END $$;

-- Create index on mime_type for better performance
CREATE INDEX IF NOT EXISTS idx_product_images_mime_type ON product_images(mime_type);

-- Update existing records to have a default mime_type
UPDATE product_images 
SET mime_type = 'image/jpeg' 
WHERE mime_type IS NULL;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'product_images' 
AND column_name = 'mime_type';
