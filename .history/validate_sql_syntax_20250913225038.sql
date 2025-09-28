-- Simple validation script to test SQL syntax
-- This will help identify any syntax issues

-- Test the table creation syntax
CREATE TABLE IF NOT EXISTS test_device_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL,
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
    updated_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Test the function syntax
CREATE OR REPLACE FUNCTION test_log_device_price_change()
RETURNS TRIGGER AS $$
DECLARE
    old_price_val NUMERIC;
    new_price_val NUMERIC;
BEGIN
    -- Only log if repair_price actually changed
    IF OLD.repair_price IS DISTINCT FROM NEW.repair_price THEN
        -- Get the price values
        old_price_val := COALESCE(OLD.repair_price, 0);
        new_price_val := COALESCE(NEW.repair_price, 0);
        
        -- Insert into price history table
        INSERT INTO test_device_price_history (
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
            old_price_val,
            new_price_val,
            'Price updated via system',
            'manual',
            'system',
            NULL,
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

-- Clean up test objects
DROP FUNCTION IF EXISTS test_log_device_price_change();
DROP TABLE IF EXISTS test_device_price_history;
