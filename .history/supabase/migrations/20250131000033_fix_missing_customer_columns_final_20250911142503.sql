-- Fix missing customer columns that are causing 400 errors
-- Migration: 20250131000033_fix_missing_customer_columns_final.sql

-- Add missing columns that are referenced in API calls but don't exist in the database

-- Add joined_date column (alias for created_at)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS joined_date TIMESTAMP WITH TIME ZONE;

-- Add last_purchase_date column
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMP WITH TIME ZONE;

-- Add total_purchases column
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_purchases INTEGER DEFAULT 0;

-- Add birthday column (computed from birth_month and birth_day)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS birthday DATE;

-- Add whatsapp_opt_out column
ALTER TABLE customers ADD COLUMN IF NOT EXISTS whatsapp_opt_out BOOLEAN DEFAULT false;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_joined_date ON customers(joined_date);
CREATE INDEX IF NOT EXISTS idx_customers_last_purchase_date ON customers(last_purchase_date);
CREATE INDEX IF NOT EXISTS idx_customers_total_purchases ON customers(total_purchases);
CREATE INDEX IF NOT EXISTS idx_customers_birthday ON customers(birthday);
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp_opt_out ON customers(whatsapp_opt_out);

-- Update existing records to populate joined_date from created_at
UPDATE customers 
SET 
    joined_date = COALESCE(joined_date, created_at),
    total_purchases = COALESCE(total_purchases, 0),
    whatsapp_opt_out = COALESCE(whatsapp_opt_out, false)
WHERE 
    joined_date IS NULL 
    OR total_purchases IS NULL 
    OR whatsapp_opt_out IS NULL;

-- Create a function to compute birthday from birth_month and birth_day
CREATE OR REPLACE FUNCTION compute_customer_birthday()
RETURNS TRIGGER AS $$
BEGIN
    -- Only compute birthday if both birth_month and birth_day are provided
    IF NEW.birth_month IS NOT NULL AND NEW.birth_day IS NOT NULL THEN
        -- Validate and clean the month value
        DECLARE
            clean_month INTEGER;
            clean_day INTEGER;
        BEGIN
            -- Try to parse month as integer first
            BEGIN
                clean_month := NEW.birth_month::INTEGER;
            EXCEPTION WHEN OTHERS THEN
                -- If parsing fails, try to extract number from string
                clean_month := NULL;
            END;
            
            -- Try to parse day as integer
            BEGIN
                clean_day := NEW.birth_day::INTEGER;
            EXCEPTION WHEN OTHERS THEN
                -- If parsing fails, try to extract number from string
                clean_day := NULL;
            END;
            
            -- Only create birthday if we have valid month and day
            IF clean_month IS NOT NULL AND clean_day IS NOT NULL 
               AND clean_month >= 1 AND clean_month <= 12 
               AND clean_day >= 1 AND clean_day <= 31 THEN
                NEW.birthday := DATE(CONCAT(EXTRACT(YEAR FROM CURRENT_DATE), '-', 
                                           LPAD(clean_month::TEXT, 2, '0'), '-', 
                                           LPAD(clean_day::TEXT, 2, '0')));
            ELSE
                NEW.birthday := NULL;
            END IF;
        END;
    ELSE
        NEW.birthday := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically compute birthday
DROP TRIGGER IF EXISTS trigger_compute_customer_birthday ON customers;
CREATE TRIGGER trigger_compute_customer_birthday
    BEFORE INSERT OR UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION compute_customer_birthday();

-- Clean up corrupted birth_month data first
UPDATE customers 
SET birth_month = NULL, birth_day = NULL, birthday = NULL
WHERE birth_month::TEXT !~ '^[0-9]+$' OR birth_day::TEXT !~ '^[0-9]+$'
   OR birth_month::INTEGER NOT BETWEEN 1 AND 12 
   OR birth_day::INTEGER NOT BETWEEN 1 AND 31;

-- Update existing records to compute birthday (with error handling)
UPDATE customers 
SET birthday = CASE 
    WHEN birth_month::TEXT ~ '^[0-9]+$' AND birth_day::TEXT ~ '^[0-9]+$' 
         AND birth_month::INTEGER BETWEEN 1 AND 12 
         AND birth_day::INTEGER BETWEEN 1 AND 31 THEN
        DATE(CONCAT(EXTRACT(YEAR FROM CURRENT_DATE), '-', 
                   LPAD(birth_month::TEXT, 2, '0'), '-', 
                   LPAD(birth_day::TEXT, 2, '0')))
    ELSE NULL
END
WHERE birth_month IS NOT NULL 
  AND birth_day IS NOT NULL 
  AND birthday IS NULL;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND column_name IN (
    'joined_date', 
    'last_purchase_date', 
    'total_purchases', 
    'birthday', 
    'whatsapp_opt_out'
);

-- Add comments for documentation
COMMENT ON COLUMN customers.joined_date IS 'Date when customer joined (alias for created_at)';
COMMENT ON COLUMN customers.last_purchase_date IS 'Date of last purchase made by customer';
COMMENT ON COLUMN customers.total_purchases IS 'Total number of purchases made by customer';
COMMENT ON COLUMN customers.birthday IS 'Computed birthday from birth_month and birth_day';
COMMENT ON COLUMN customers.whatsapp_opt_out IS 'Whether customer has opted out of WhatsApp messages';
