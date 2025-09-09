-- Add exchange rate tracking to purchase orders
-- This allows tracking the exchange rate used at the time of purchase
-- so you can understand the actual cost when exchange rates change

-- Add exchange rate columns to lats_purchase_orders table
ALTER TABLE lats_purchase_orders 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'TZS',
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,6) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS base_currency TEXT DEFAULT 'TZS',
ADD COLUMN IF NOT EXISTS exchange_rate_source TEXT, -- e.g., 'manual', 'api', 'bank'
ADD COLUMN IF NOT EXISTS exchange_rate_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS total_amount_base_currency DECIMAL(12,2) DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN lats_purchase_orders.currency IS 'Currency used for the purchase order (e.g., USD, EUR, AED)';
COMMENT ON COLUMN lats_purchase_orders.exchange_rate IS 'Exchange rate from purchase currency to base currency at time of purchase';
COMMENT ON COLUMN lats_purchase_orders.base_currency IS 'Base currency for the business (typically TZS)';
COMMENT ON COLUMN lats_purchase_orders.exchange_rate_source IS 'Source of the exchange rate (manual, api, bank, etc.)';
COMMENT ON COLUMN lats_purchase_orders.exchange_rate_date IS 'Date when the exchange rate was applied';
COMMENT ON COLUMN lats_purchase_orders.total_amount_base_currency IS 'Total amount converted to base currency using the exchange rate';

-- Update existing records to have default values
UPDATE lats_purchase_orders 
SET 
  currency = 'TZS',
  exchange_rate = 1.0,
  base_currency = 'TZS',
  exchange_rate_source = 'default',
  exchange_rate_date = created_at,
  total_amount_base_currency = total_amount
WHERE currency IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_purchase_orders_currency ON lats_purchase_orders(currency);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_exchange_rate_date ON lats_purchase_orders(exchange_rate_date);
