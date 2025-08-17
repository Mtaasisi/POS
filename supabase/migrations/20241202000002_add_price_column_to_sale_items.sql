-- Migration: Add price column to lats_sale_items table
-- This fixes the missing price column that was causing the 400 error

-- Add the price column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lats_sale_items' 
        AND column_name = 'price'
    ) THEN
        ALTER TABLE lats_sale_items 
        ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0;
        
        -- Update existing records to calculate price from total_price / quantity
        UPDATE lats_sale_items 
        SET price = CASE 
            WHEN quantity > 0 THEN total_price / quantity 
            ELSE 0 
        END;
        
        -- Remove the default after updating existing records
        ALTER TABLE lats_sale_items 
        ALTER COLUMN price DROP DEFAULT;
    END IF;
END $$;

-- Add a comment to document the change
COMMENT ON COLUMN lats_sale_items.price IS 'Unit price for the sale item';
