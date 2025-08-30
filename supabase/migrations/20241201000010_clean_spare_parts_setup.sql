-- Migration: 20241201000010_clean_spare_parts_setup.sql
-- Clean migration without RAISE statements

-- Add foreign key constraint for products to categories (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lats_products_category_id_fkey' 
        AND table_name = 'lats_products'
    ) THEN
        ALTER TABLE lats_products 
        ADD CONSTRAINT lats_products_category_id_fkey 
        FOREIGN KEY (category_id) REFERENCES lats_categories(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lats_products_category_id ON lats_products(category_id);
CREATE INDEX IF NOT EXISTS idx_lats_products_active_category ON lats_products(category_id, is_active) WHERE is_active = true;

-- Add part_type column to spare parts if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_spare_parts' 
        AND column_name = 'part_type'
    ) THEN
        ALTER TABLE lats_spare_parts ADD COLUMN part_type TEXT DEFAULT 'general';
    END IF;
END $$;

-- Add primary_device_type column to spare parts if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_spare_parts' 
        AND column_name = 'primary_device_type'
    ) THEN
        ALTER TABLE lats_spare_parts ADD COLUMN primary_device_type TEXT DEFAULT 'general';
    END IF;
END $$;

-- Add search_tags column to spare parts if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_spare_parts' 
        AND column_name = 'search_tags'
    ) THEN
        ALTER TABLE lats_spare_parts ADD COLUMN search_tags TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Add indexes for spare parts
CREATE INDEX IF NOT EXISTS idx_spare_parts_part_type ON lats_spare_parts(part_type);
CREATE INDEX IF NOT EXISTS idx_spare_parts_device_type ON lats_spare_parts(primary_device_type);
CREATE INDEX IF NOT EXISTS idx_spare_parts_search_tags ON lats_spare_parts USING GIN(search_tags);

-- Create device compatibility table if it doesn't exist
CREATE TABLE IF NOT EXISTS lats_device_compatibility (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    spare_part_id UUID NOT NULL,
    device_brand TEXT NOT NULL,
    device_model TEXT NOT NULL,
    device_type TEXT NOT NULL,
    compatibility_notes TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for device compatibility
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lats_device_compatibility_spare_part_id_fkey' 
        AND table_name = 'lats_device_compatibility'
    ) THEN
        ALTER TABLE lats_device_compatibility 
        ADD CONSTRAINT lats_device_compatibility_spare_part_id_fkey 
        FOREIGN KEY (spare_part_id) REFERENCES lats_spare_parts(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add unique constraint for device compatibility
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lats_device_compatibility_unique' 
        AND table_name = 'lats_device_compatibility'
    ) THEN
        ALTER TABLE lats_device_compatibility 
        ADD CONSTRAINT lats_device_compatibility_unique 
        UNIQUE(spare_part_id, device_brand, device_model, device_type);
    END IF;
END $$;

-- Add indexes for device compatibility
CREATE INDEX IF NOT EXISTS idx_device_compatibility_lookup ON lats_device_compatibility(device_brand, device_model, device_type);
CREATE INDEX IF NOT EXISTS idx_device_compatibility_spare_part ON lats_device_compatibility(spare_part_id);
