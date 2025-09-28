-- Safe Repair Parts Setup
-- This migration safely creates the repair parts system without conflicts

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create repair parts table if it doesn't exist
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

-- Add indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_repair_parts_device_id ON repair_parts(device_id);
CREATE INDEX IF NOT EXISTS idx_repair_parts_spare_part_id ON repair_parts(spare_part_id);
CREATE INDEX IF NOT EXISTS idx_repair_parts_status ON repair_parts(status);
CREATE INDEX IF NOT EXISTS idx_repair_parts_created_at ON repair_parts(created_at);

-- Enable RLS (safe to run multiple times)
ALTER TABLE repair_parts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate them
DROP POLICY IF EXISTS "Users can view repair parts" ON repair_parts;
DROP POLICY IF EXISTS "Technicians and admins can manage repair parts" ON repair_parts;

-- Create policies
CREATE POLICY "Users can view repair parts" ON repair_parts
    FOR SELECT USING (auth.role() = 'authenticated');

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

-- Create or replace functions (safe to run multiple times)
CREATE OR REPLACE FUNCTION update_repair_parts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_repair_part_total_cost()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_cost = NEW.quantity_needed * NEW.cost_per_unit;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist, then recreate them
DROP TRIGGER IF EXISTS trigger_update_repair_parts_updated_at ON repair_parts;
DROP TRIGGER IF EXISTS trigger_calculate_repair_part_total_cost ON repair_parts;

-- Create triggers
CREATE TRIGGER trigger_update_repair_parts_updated_at
    BEFORE UPDATE ON repair_parts
    FOR EACH ROW
    EXECUTE FUNCTION update_repair_parts_updated_at();

CREATE TRIGGER trigger_calculate_repair_part_total_cost
    BEFORE INSERT OR UPDATE ON repair_parts
    FOR EACH ROW
    EXECUTE FUNCTION calculate_repair_part_total_cost();

-- Add comments (safe to run multiple times)
COMMENT ON TABLE repair_parts IS 'Tracks spare parts needed and used for specific device repairs';
COMMENT ON COLUMN repair_parts.device_id IS 'Reference to the device being repaired';
COMMENT ON COLUMN repair_parts.spare_part_id IS 'Reference to the spare part from inventory';
COMMENT ON COLUMN repair_parts.quantity_needed IS 'Number of parts needed for this repair';
COMMENT ON COLUMN repair_parts.quantity_used IS 'Number of parts actually used in this repair';
COMMENT ON COLUMN repair_parts.cost_per_unit IS 'Cost per unit of the spare part';
COMMENT ON COLUMN repair_parts.total_cost IS 'Total cost (quantity_needed * cost_per_unit)';
COMMENT ON COLUMN repair_parts.status IS 'Status: needed, ordered, received, used';
COMMENT ON COLUMN repair_parts.notes IS 'Additional notes about this part usage';
