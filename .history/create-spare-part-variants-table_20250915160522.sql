-- Create spare part variants table
-- This table stores variants for spare parts, similar to product variants

CREATE TABLE IF NOT EXISTS lats_spare_part_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    spare_part_id UUID NOT NULL REFERENCES lats_spare_parts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_quantity INTEGER NOT NULL DEFAULT 0,
    attributes JSONB DEFAULT '{}',
    image_url TEXT,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_spare_part_variants_spare_part_id ON lats_spare_part_variants(spare_part_id);
CREATE INDEX IF NOT EXISTS idx_spare_part_variants_sku ON lats_spare_part_variants(sku);
CREATE INDEX IF NOT EXISTS idx_spare_part_variants_created_at ON lats_spare_part_variants(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE lats_spare_part_variants ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read variants
CREATE POLICY "Users can read spare part variants" ON lats_spare_part_variants
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for authenticated users to insert variants
CREATE POLICY "Users can insert spare part variants" ON lats_spare_part_variants
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update variants
CREATE POLICY "Users can update spare part variants" ON lats_spare_part_variants
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for authenticated users to delete variants
CREATE POLICY "Users can delete spare part variants" ON lats_spare_part_variants
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_spare_part_variants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_spare_part_variants_updated_at
    BEFORE UPDATE ON lats_spare_part_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_spare_part_variants_updated_at();

-- Add metadata column to lats_spare_parts table if it doesn't exist
ALTER TABLE lats_spare_parts 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create index on metadata column for better performance
CREATE INDEX IF NOT EXISTS idx_spare_parts_metadata ON lats_spare_parts USING GIN(metadata);

-- Add comments for documentation
COMMENT ON TABLE lats_spare_part_variants IS 'Stores variants for spare parts with individual pricing and stock levels';
COMMENT ON COLUMN lats_spare_part_variants.spare_part_id IS 'Reference to the parent spare part';
COMMENT ON COLUMN lats_spare_part_variants.name IS 'Display name for the variant';
COMMENT ON COLUMN lats_spare_part_variants.sku IS 'Unique SKU for the variant';
COMMENT ON COLUMN lats_spare_part_variants.cost_price IS 'Cost price for this variant';
COMMENT ON COLUMN lats_spare_part_variants.selling_price IS 'Selling price for this variant';
COMMENT ON COLUMN lats_spare_part_variants.quantity IS 'Current stock quantity for this variant';
COMMENT ON COLUMN lats_spare_part_variants.min_quantity IS 'Minimum stock level for this variant';
COMMENT ON COLUMN lats_spare_part_variants.attributes IS 'JSON object storing variant-specific attributes and specifications';
COMMENT ON COLUMN lats_spare_parts.metadata IS 'JSON object storing additional metadata about the spare part including variant information';
