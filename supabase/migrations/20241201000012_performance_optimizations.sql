-- Migration: 20241201000012_performance_optimizations.sql
-- Add performance-optimizing indexes for faster POS operations

-- Full-text search index for product search
CREATE INDEX IF NOT EXISTS idx_products_pos_search ON lats_products 
USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Composite index for fast product filtering
CREATE INDEX IF NOT EXISTS idx_products_category_brand_active ON lats_products(category_id, brand_id, is_active);

-- Optimized variant search indexes
CREATE INDEX IF NOT EXISTS idx_variants_sku_barcode ON lats_product_variants(sku, barcode);
CREATE INDEX IF NOT EXISTS idx_variants_product_active ON lats_product_variants(product_id, quantity) WHERE quantity > 0;

-- Sales performance indexes
CREATE INDEX IF NOT EXISTS idx_sales_daily ON lats_sales(created_at) WHERE status = 'completed';
CREATE INDEX IF NOT EXISTS idx_sales_customer_date ON lats_sales(customer_id, created_at);

-- Stock movements optimization
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_date ON lats_stock_movements(product_id, created_at);

-- External products search
CREATE INDEX IF NOT EXISTS idx_external_products_search ON lats_external_products 
USING gin(to_tsvector('english', name || ' ' || COALESCE(supplier_name, '')));

-- Sale items optimization
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_product ON lats_sale_items(sale_id, product_id);

-- Materialized view for daily sales summary
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_sales_summary AS
SELECT 
    DATE(created_at) as sale_date,
    COUNT(*) as total_sales,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_sale,
    COUNT(DISTINCT customer_id) as unique_customers
FROM lats_sales 
WHERE status = 'completed'
GROUP BY DATE(created_at);

-- Index on materialized view
CREATE INDEX IF NOT EXISTS idx_daily_sales_summary_date ON daily_sales_summary(sale_date);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_daily_sales_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW daily_sales_summary;
END;
$$ LANGUAGE plpgsql;

-- Trigger to refresh materialized view when sales are updated
CREATE OR REPLACE FUNCTION trigger_refresh_daily_sales()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM refresh_daily_sales_summary();
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_daily_sales_trigger
    AFTER INSERT OR UPDATE OR DELETE ON lats_sales
    FOR EACH ROW EXECUTE FUNCTION trigger_refresh_daily_sales();

-- Function to get low stock products
CREATE OR REPLACE FUNCTION get_low_stock_products(threshold INTEGER DEFAULT 10)
RETURNS TABLE(
    product_id UUID,
    product_name TEXT,
    variant_id UUID,
    variant_name TEXT,
    current_stock INTEGER,
    min_quantity INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as product_id,
        p.name as product_name,
        pv.id as variant_id,
        pv.name as variant_name,
        pv.quantity as current_stock,
        pv.min_quantity as min_quantity
    FROM lats_products p
    JOIN lats_product_variants pv ON p.id = pv.product_id
    WHERE pv.quantity <= threshold
    AND p.is_active = true
    ORDER BY pv.quantity ASC;
END;
$$ LANGUAGE plpgsql;
