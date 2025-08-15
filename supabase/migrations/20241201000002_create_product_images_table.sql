-- Create product_images table for LATS module
-- This table stores product images with thumbnails

CREATE TABLE IF NOT EXISTS product_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
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

-- Create trigger to update updated_at column
CREATE TRIGGER update_product_images_updated_at 
    BEFORE UPDATE ON product_images 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view product images" 
    ON product_images FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert product images" 
    ON product_images FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update product images" 
    ON product_images FOR UPDATE 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete product images" 
    ON product_images FOR DELETE 
    USING (auth.role() = 'authenticated');

-- Function to ensure only one primary image per product
CREATE OR REPLACE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
    -- If this image is being set as primary, unset all other primary images for this product
    IF NEW.is_primary = true THEN
        UPDATE product_images 
        SET is_primary = false 
        WHERE product_id = NEW.product_id 
        AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure only one primary image per product
CREATE TRIGGER ensure_single_primary_image_trigger
    BEFORE INSERT OR UPDATE ON product_images
    FOR EACH ROW EXECUTE FUNCTION ensure_single_primary_image();
