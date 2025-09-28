-- Create device_price_history table for tracking price changes
-- Migration: 20250131000017_create_device_price_history_table.sql

-- Create device_price_history table
CREATE TABLE IF NOT EXISTS device_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    old_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    new_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    price_change NUMERIC(12,2) GENERATED ALWAYS AS (new_price - old_price) STORED,
    change_percentage NUMERIC(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN old_price > 0 THEN ROUND(((new_price - old_price) / old_price) * 100, 2)
            ELSE 0
        END
    ) STORED,
    reason TEXT NOT NULL DEFAULT 'Price adjustment',
    change_type TEXT NOT NULL DEFAULT 'manual' CHECK (change_type IN ('manual', 'bulk_update', 'supplier_change', 'market_adjustment', 'promotion', 'cost_update')),
    source TEXT DEFAULT 'system' CHECK (source IN ('system', 'admin', 'api', 'import')),
    metadata JSONB DEFAULT '{}',
    updated_by UUID REFERENCES auth_users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_device_price_history_device_id ON device_price_history(device_id);
CREATE INDEX IF NOT EXISTS idx_device_price_history_updated_at ON device_price_history(updated_at);
CREATE INDEX IF NOT EXISTS idx_device_price_history_updated_by ON device_price_history(updated_by);
CREATE INDEX IF NOT EXISTS idx_device_price_history_change_type ON device_price_history(change_type);
CREATE INDEX IF NOT EXISTS idx_device_price_history_source ON device_price_history(source);
CREATE INDEX IF NOT EXISTS idx_device_price_history_created_at ON device_price_history(created_at);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_device_price_history_device_created ON device_price_history(device_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE device_price_history ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for authenticated users
CREATE POLICY "Enable all access for authenticated users" ON device_price_history
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions to authenticated users
GRANT ALL ON device_price_history TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE device_price_history IS 'Tracks all changes to device repair prices for audit purposes';
COMMENT ON COLUMN device_price_history.price_change IS 'Calculated difference between new and old price';
COMMENT ON COLUMN device_price_history.change_percentage IS 'Percentage change from old to new price';
COMMENT ON COLUMN device_price_history.change_type IS 'Type of price change: manual, bulk_update, supplier_change, market_adjustment, promotion, cost_update';
COMMENT ON COLUMN device_price_history.source IS 'Source of the change: system, admin, api, import';
COMMENT ON COLUMN device_price_history.metadata IS 'Additional data about the price change (JSON format)';

-- Create a function to automatically log price changes
CREATE OR REPLACE FUNCTION log_device_price_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if repair_price actually changed
    IF OLD.repair_price IS DISTINCT FROM NEW.repair_price THEN
        INSERT INTO device_price_history (
            device_id,
            old_price,
            new_price,
            reason,
            change_type,
            source,
            updated_by,
            metadata
        ) VALUES (
            NEW.id,
            COALESCE(OLD.repair_price, 0),
            COALESCE(NEW.repair_price, 0),
            'Price updated via system',
            'manual'::TEXT,
            'system'::TEXT,
            auth.uid(),
            jsonb_build_object(
                'device_name', COALESCE(NEW.brand, 'Unknown Brand') || ' ' || COALESCE(NEW.model, 'Unknown Model'),
                'device_brand', COALESCE(NEW.brand, 'Unknown Brand'),
                'device_model', COALESCE(NEW.model, 'Unknown Model'),
                'device_serial', COALESCE(NEW.serial_number, 'N/A'),
                'previous_update', OLD.updated_at,
                'change_timestamp', NOW()
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically log price changes
-- Note: This trigger requires the repair_price column to exist in the devices table
-- Make sure to run migration 20250131000016_add_repair_price_to_devices.sql first
DROP TRIGGER IF EXISTS device_price_change_trigger ON devices;
CREATE TRIGGER device_price_change_trigger
    AFTER UPDATE ON devices
    FOR EACH ROW
    EXECUTE FUNCTION log_device_price_change();