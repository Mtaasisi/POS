-- Add foreign key constraint to points_transactions.device_id
-- Migration: 20250131000062_add_device_foreign_key_to_points.sql
-- This migration adds the foreign key constraint after devices table is confirmed to exist

-- Add foreign key constraint to device_id column if devices table exists
DO $$
BEGIN
    -- Check if devices table exists and has id column
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'devices' 
        AND table_schema = 'public'
    ) AND EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'devices' 
        AND column_name = 'id' 
        AND table_schema = 'public'
    ) THEN
        -- Add foreign key constraint
        ALTER TABLE points_transactions 
        ADD CONSTRAINT fk_points_transactions_device_id 
        FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Foreign key constraint added to points_transactions.device_id';
    ELSE
        RAISE NOTICE 'Devices table or id column not found, skipping foreign key constraint';
    END IF;
END $$;
