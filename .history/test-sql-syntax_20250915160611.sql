-- Test SQL syntax for spare part variants table
-- This is a simplified version to test the syntax

CREATE TABLE IF NOT EXISTS test_spare_part_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    spare_part_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_quantity INTEGER NOT NULL DEFAULT 0,
    variant_attributes JSONB DEFAULT '{}',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test insert
INSERT INTO test_spare_part_variants (name, sku, variant_attributes) 
VALUES ('Test Variant', 'TEST-001', '{"color": "red", "size": "large"}');

-- Test select
SELECT * FROM test_spare_part_variants;

-- Clean up
DROP TABLE IF EXISTS test_spare_part_variants;
