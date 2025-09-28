-- Create repair parts tracking table
-- This table tracks which spare parts are needed/used for specific device repairs

CREATE TABLE IF NOT EXISTS repair_parts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    spare_part_id UUID NOT NULL REFERENCES lats_spare_parts(id) ON DELETE CASCADE,
    quantity_needed INTEGER NOT NULL DEFAULT 1,
    quantity_used INTEGER DEFAULT 0,
    cost_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'needed' CHECK (status IN ('needed', 'ordered', 'received', 'used')),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_repair_parts_device_id ON repair_parts(device_id);
CREATE INDEX IF NOT EXISTS idx_repair_parts_spare_part_id ON repair_parts(spare_part_id);
CREATE INDEX IF NOT EXISTS idx_repair_parts_status ON repair_parts(status);
CREATE INDEX IF NOT EXISTS idx_repair_parts_created_at ON repair_parts(created_at);

-- Add RLS policies
ALTER TABLE repair_parts ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view repair parts
CREATE POLICY "Users can view repair parts" ON repair_parts
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for technicians and admins to manage repair parts
CREATE POLICY "Technicians and admins can manage repair parts" ON repair_parts
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM auth_users 
                WHERE auth_users.id = auth.uid() 
                AND auth_users.role IN ('technician', 'admin')
            )
        )
    );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_repair_parts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_repair_parts_updated_at
    BEFORE UPDATE ON repair_parts
    FOR EACH ROW
    EXECUTE FUNCTION update_repair_parts_updated_at();

-- Add trigger to calculate total_cost
CREATE OR REPLACE FUNCTION calculate_repair_part_total_cost()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_cost = NEW.quantity_needed * NEW.cost_per_unit;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_repair_part_total_cost
    BEFORE INSERT OR UPDATE ON repair_parts
    FOR EACH ROW
    EXECUTE FUNCTION calculate_repair_part_total_cost();

-- Add comments
COMMENT ON TABLE repair_parts IS 'Tracks spare parts needed and used for specific device repairs';
COMMENT ON COLUMN repair_parts.device_id IS 'Reference to the device being repaired';
COMMENT ON COLUMN repair_parts.spare_part_id IS 'Reference to the spare part from inventory';
COMMENT ON COLUMN repair_parts.quantity_needed IS 'Number of parts needed for this repair';
COMMENT ON COLUMN repair_parts.quantity_used IS 'Number of parts actually used in this repair';
COMMENT ON COLUMN repair_parts.cost_per_unit IS 'Cost per unit of the spare part';
COMMENT ON COLUMN repair_parts.total_cost IS 'Total cost (quantity_needed * cost_per_unit)';
COMMENT ON COLUMN repair_parts.status IS 'Status: needed, ordered, received, used';
COMMENT ON COLUMN repair_parts.notes IS 'Additional notes about this part usage';
