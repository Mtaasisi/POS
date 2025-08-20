-- Migration to add index on supplier name for better performance
-- This will significantly improve the ORDER BY name query performance

-- Add index on supplier name for faster sorting and searching
CREATE INDEX IF NOT EXISTS idx_lats_suppliers_name ON lats_suppliers(name);

-- Add composite index for common search patterns
CREATE INDEX IF NOT EXISTS idx_lats_suppliers_name_contact ON lats_suppliers(name, contact_person);

-- Add index on created_at for chronological ordering
CREATE INDEX IF NOT EXISTS idx_lats_suppliers_created_at ON lats_suppliers(created_at DESC);

-- Add index on email for email-based searches
CREATE INDEX IF NOT EXISTS idx_lats_suppliers_email ON lats_suppliers(email) WHERE email IS NOT NULL;

-- Add index on phone for phone-based searches  
CREATE INDEX IF NOT EXISTS idx_lats_suppliers_phone ON lats_suppliers(phone) WHERE phone IS NOT NULL;

-- Comments for documentation
COMMENT ON INDEX idx_lats_suppliers_name IS 'Index on supplier name for fast sorting and searching';
COMMENT ON INDEX idx_lats_suppliers_name_contact IS 'Composite index for name and contact person searches';
COMMENT ON INDEX idx_lats_suppliers_created_at IS 'Index for chronological ordering of suppliers';
COMMENT ON INDEX idx_lats_suppliers_email IS 'Partial index on email for email-based searches';
COMMENT ON INDEX idx_lats_suppliers_phone IS 'Partial index on phone for phone-based searches';
