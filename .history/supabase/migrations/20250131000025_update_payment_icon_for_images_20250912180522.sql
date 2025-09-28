-- Update payment_icon field to support image URLs
-- Migration: 20250131000025_update_payment_icon_for_images.sql

-- Extend payment_icon field to support longer URLs for images
ALTER TABLE finance_accounts 
ALTER COLUMN payment_icon TYPE VARCHAR(500);

-- Update payment_providers table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_providers') THEN
        -- Add payment_icon column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_providers' AND column_name = 'payment_icon') THEN
            ALTER TABLE payment_providers ADD COLUMN payment_icon VARCHAR(500);
        ELSE
            -- Alter existing column to support longer URLs
            ALTER TABLE payment_providers ALTER COLUMN payment_icon TYPE VARCHAR(500);
        END IF;
    END IF;
END $$;

-- Add comment to document the field usage
COMMENT ON COLUMN finance_accounts.payment_icon IS 'Payment icon can be emoji (💵), SVG path (/icons/payment-methods/cash.svg), or full image URL (https://example.com/logo.png)';

-- Add comment for payment_providers table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_providers') THEN
        COMMENT ON COLUMN payment_providers.payment_icon IS 'Payment icon can be emoji (💵), SVG path (/icons/payment-methods/cash.svg), or full image URL (https://example.com/logo.png)';
    END IF;
END $$;
