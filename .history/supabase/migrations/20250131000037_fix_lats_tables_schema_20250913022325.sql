-- Fix LATS tables schema inconsistencies
-- Migration: 20250131000037_fix_lats_tables_schema.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENSURE LATS_PRODUCTS TABLE EXISTS WITH CORRECT SCHEMA
-- =====================================================

CREATE TABLE IF NOT EXISTS lats_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID,
    brand_id UUID,
    supplier_id UUID,
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ENSURE LATS_PRODUCT_VARIANTS TABLE EXISTS WITH CORRECT SCHEMA
-- =====================================================

CREATE TABLE IF NOT EXISTS lats_product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    attributes JSONB,
    price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) DEFAULT 0,
    quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ENSURE PRODUCT_IMAGES TABLE EXISTS
-- =====================================================

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

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_lats_products_category_id ON lats_products(category_id);
CREATE INDEX IF NOT EXISTS idx_lats_products_brand_id ON lats_products(brand_id);
CREATE INDEX IF NOT EXISTS idx_lats_products_supplier_id ON lats_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_lats_products_sku ON lats_products(sku);
CREATE INDEX IF NOT EXISTS idx_lats_products_barcode ON lats_products(barcode);
CREATE INDEX IF NOT EXISTS idx_lats_products_is_active ON lats_products(is_active);

-- Product variants indexes
CREATE INDEX IF NOT EXISTS idx_lats_product_variants_product_id ON lats_product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_lats_product_variants_sku ON lats_product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_lats_product_variants_is_active ON lats_product_variants(is_active);

-- Product images indexes
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_is_primary ON product_images(is_primary);
CREATE INDEX IF NOT EXISTS idx_product_images_created_at ON product_images(created_at);

-- =====================================================
-- CREATE TRIGGER FUNCTIONS
-- =====================================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

-- Updated at triggers
DROP TRIGGER IF EXISTS update_lats_products_updated_at ON lats_products;
CREATE TRIGGER update_lats_products_updated_at 
    BEFORE UPDATE ON lats_products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lats_product_variants_updated_at ON lats_product_variants;
CREATE TRIGGER update_lats_product_variants_updated_at 
    BEFORE UPDATE ON lats_product_variants 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_images_updated_at ON product_images;
CREATE TRIGGER update_product_images_updated_at 
    BEFORE UPDATE ON product_images 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Primary image trigger
DROP TRIGGER IF EXISTS ensure_single_primary_image_trigger ON product_images;
CREATE TRIGGER ensure_single_primary_image_trigger
    BEFORE INSERT OR UPDATE ON product_images
    FOR EACH ROW EXECUTE FUNCTION ensure_single_primary_image();

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE lats_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE lats_product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE PERMISSIVE POLICIES FOR ONLINE SUPABASE
-- =====================================================

-- Drop existing policies and create new ones
DROP POLICY IF EXISTS "Allow authenticated users to manage products" ON lats_products;
DROP POLICY IF EXISTS "Allow authenticated users to manage product variants" ON lats_product_variants;
DROP POLICY IF EXISTS "Allow authenticated users to view product images" ON product_images;
DROP POLICY IF EXISTS "Allow authenticated users to insert product images" ON product_images;
DROP POLICY IF EXISTS "Allow authenticated users to update product images" ON product_images;
DROP POLICY IF EXISTS "Allow authenticated users to delete product images" ON product_images;

-- Create permissive policies for online Supabase
CREATE POLICY "Allow authenticated users to manage products" ON lats_products
    FOR ALL USING (true);

CREATE POLICY "Allow authenticated users to manage product variants" ON lats_product_variants
    FOR ALL USING (true);

CREATE POLICY "Allow authenticated users to view product images" ON product_images
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert product images" ON product_images
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update product images" ON product_images
    FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated users to delete product images" ON product_images
    FOR DELETE USING (true);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON lats_products TO authenticated;
GRANT ALL ON lats_products TO anon;
GRANT ALL ON lats_product_variants TO authenticated;
GRANT ALL ON lats_product_variants TO anon;
GRANT ALL ON product_images TO authenticated;
GRANT ALL ON product_images TO anon;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
    table_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_name IN ('lats_products', 'lats_product_variants', 'product_images');
    
    RAISE NOTICE '✅ LATS tables schema fix completed successfully!';
    RAISE NOTICE '✅ Tables verified: %', table_count;
    RAISE NOTICE '✅ All LATS tables are ready for use!';
END $$;
