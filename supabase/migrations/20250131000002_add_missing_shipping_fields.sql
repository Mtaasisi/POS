-- Migration: Add Missing Shipping Fields
-- This migration adds all the missing fields to the lats_shipping_info table
-- to support complete sea and air shipping data storage

-- =====================================================
-- ADD MISSING FIELDS TO SHIPPING INFO TABLE
-- =====================================================

-- Add shipping method field
ALTER TABLE lats_shipping_info ADD COLUMN IF NOT EXISTS shipping_method TEXT CHECK (shipping_method IN ('air', 'sea', 'standard'));

-- Add sea shipping specific fields
ALTER TABLE lats_shipping_info ADD COLUMN IF NOT EXISTS port_of_loading TEXT;
ALTER TABLE lats_shipping_info ADD COLUMN IF NOT EXISTS port_of_discharge TEXT;
ALTER TABLE lats_shipping_info ADD COLUMN IF NOT EXISTS departure_date DATE;
ALTER TABLE lats_shipping_info ADD COLUMN IF NOT EXISTS arrival_date DATE;
ALTER TABLE lats_shipping_info ADD COLUMN IF NOT EXISTS vessel_name TEXT;
ALTER TABLE lats_shipping_info ADD COLUMN IF NOT EXISTS container_number TEXT;

-- Add air shipping specific fields
ALTER TABLE lats_shipping_info ADD COLUMN IF NOT EXISTS flight_number TEXT;
ALTER TABLE lats_shipping_info ADD COLUMN IF NOT EXISTS departure_airport TEXT;
ALTER TABLE lats_shipping_info ADD COLUMN IF NOT EXISTS arrival_airport TEXT;
ALTER TABLE lats_shipping_info ADD COLUMN IF NOT EXISTS departure_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE lats_shipping_info ADD COLUMN IF NOT EXISTS arrival_time TIMESTAMP WITH TIME ZONE;

-- Add cargo and pricing fields
ALTER TABLE lats_shipping_info ADD COLUMN IF NOT EXISTS cargo_boxes JSONB DEFAULT '[]';
ALTER TABLE lats_shipping_info ADD COLUMN IF NOT EXISTS price_per_cbm DECIMAL(10,2) DEFAULT 0;
ALTER TABLE lats_shipping_info ADD COLUMN IF NOT EXISTS total_cbm DECIMAL(10,3) DEFAULT 0;

-- Add additional tracking fields
ALTER TABLE lats_shipping_info ADD COLUMN IF NOT EXISTS shipping_origin TEXT;
ALTER TABLE lats_shipping_info ADD COLUMN IF NOT EXISTS shipping_destination TEXT;

-- Add comments for documentation
COMMENT ON COLUMN lats_shipping_info.shipping_method IS 'Shipping method: air, sea, or standard';
COMMENT ON COLUMN lats_shipping_info.port_of_loading IS 'Port where cargo is loaded (sea shipping)';
COMMENT ON COLUMN lats_shipping_info.port_of_discharge IS 'Port where cargo is discharged (sea shipping)';
COMMENT ON COLUMN lats_shipping_info.departure_date IS 'Date when vessel departs (sea shipping)';
COMMENT ON COLUMN lats_shipping_info.arrival_date IS 'Date when vessel arrives (sea shipping)';
COMMENT ON COLUMN lats_shipping_info.vessel_name IS 'Name of the vessel (sea shipping)';
COMMENT ON COLUMN lats_shipping_info.container_number IS 'Container number (sea shipping)';
COMMENT ON COLUMN lats_shipping_info.flight_number IS 'Flight number (air shipping)';
COMMENT ON COLUMN lats_shipping_info.departure_airport IS 'Departure airport code (air shipping)';
COMMENT ON COLUMN lats_shipping_info.arrival_airport IS 'Arrival airport code (air shipping)';
COMMENT ON COLUMN lats_shipping_info.departure_time IS 'Departure time (air shipping)';
COMMENT ON COLUMN lats_shipping_info.arrival_time IS 'Arrival time (air shipping)';
COMMENT ON COLUMN lats_shipping_info.cargo_boxes IS 'JSON array of cargo box dimensions and details';
COMMENT ON COLUMN lats_shipping_info.price_per_cbm IS 'Price per cubic meter in USD (sea shipping)';
COMMENT ON COLUMN lats_shipping_info.total_cbm IS 'Total cubic meters calculated from cargo boxes';
COMMENT ON COLUMN lats_shipping_info.shipping_origin IS 'Shipping origin location';
COMMENT ON COLUMN lats_shipping_info.shipping_destination IS 'Shipping destination location';

-- Update the updated_at timestamp
UPDATE lats_shipping_info SET updated_at = NOW() WHERE updated_at IS NULL;
