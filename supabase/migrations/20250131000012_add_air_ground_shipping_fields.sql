-- Add air and ground shipping specific fields to lats_shipping_info table
-- These fields are needed for comprehensive air and ground shipping tracking

-- Add air shipping specific fields
ALTER TABLE lats_shipping_info 
ADD COLUMN IF NOT EXISTS departure_airport TEXT,
ADD COLUMN IF NOT EXISTS arrival_airport TEXT,
ADD COLUMN IF NOT EXISTS departure_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS arrival_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS air_waybill TEXT,
ADD COLUMN IF NOT EXISTS cargo_manifest TEXT,
ADD COLUMN IF NOT EXISTS customs_clearance TEXT;

-- Add ground shipping specific fields
ALTER TABLE lats_shipping_info 
ADD COLUMN IF NOT EXISTS departure_terminal TEXT,
ADD COLUMN IF NOT EXISTS arrival_terminal TEXT,
ADD COLUMN IF NOT EXISTS route_number TEXT,
ADD COLUMN IF NOT EXISTS driver_license TEXT,
ADD COLUMN IF NOT EXISTS vehicle_registration TEXT;

-- Add indexes for better performance on new fields
CREATE INDEX IF NOT EXISTS idx_lats_shipping_info_departure_airport ON lats_shipping_info(departure_airport);
CREATE INDEX IF NOT EXISTS idx_lats_shipping_info_arrival_airport ON lats_shipping_info(arrival_airport);
CREATE INDEX IF NOT EXISTS idx_lats_shipping_info_air_waybill ON lats_shipping_info(air_waybill);
CREATE INDEX IF NOT EXISTS idx_lats_shipping_info_departure_time ON lats_shipping_info(departure_time);
CREATE INDEX IF NOT EXISTS idx_lats_shipping_info_arrival_time ON lats_shipping_info(arrival_time);
CREATE INDEX IF NOT EXISTS idx_lats_shipping_info_departure_terminal ON lats_shipping_info(departure_terminal);
CREATE INDEX IF NOT EXISTS idx_lats_shipping_info_arrival_terminal ON lats_shipping_info(arrival_terminal);
CREATE INDEX IF NOT EXISTS idx_lats_shipping_info_route_number ON lats_shipping_info(route_number);
CREATE INDEX IF NOT EXISTS idx_lats_shipping_info_driver_license ON lats_shipping_info(driver_license);
CREATE INDEX IF NOT EXISTS idx_lats_shipping_info_vehicle_registration ON lats_shipping_info(vehicle_registration);

-- Add comments for documentation
COMMENT ON COLUMN lats_shipping_info.departure_airport IS 'Airport where the shipment departed from';
COMMENT ON COLUMN lats_shipping_info.arrival_airport IS 'Airport where the shipment arrived at';
COMMENT ON COLUMN lats_shipping_info.departure_time IS 'Date and time when the aircraft departed';
COMMENT ON COLUMN lats_shipping_info.arrival_time IS 'Date and time when the aircraft arrived';
COMMENT ON COLUMN lats_shipping_info.air_waybill IS 'Air waybill number for air shipping';
COMMENT ON COLUMN lats_shipping_info.cargo_manifest IS 'Cargo manifest number';
COMMENT ON COLUMN lats_shipping_info.customs_clearance IS 'Customs clearance number for air shipping';
COMMENT ON COLUMN lats_shipping_info.departure_terminal IS 'Terminal where ground shipment departed from';
COMMENT ON COLUMN lats_shipping_info.arrival_terminal IS 'Terminal where ground shipment arrived at';
COMMENT ON COLUMN lats_shipping_info.route_number IS 'Route number for ground shipping';
COMMENT ON COLUMN lats_shipping_info.driver_license IS 'Driver license number for ground shipping';
COMMENT ON COLUMN lats_shipping_info.vehicle_registration IS 'Vehicle registration number for ground shipping';
