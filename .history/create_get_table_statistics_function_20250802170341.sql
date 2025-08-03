-- Create get_table_statistics function
CREATE OR REPLACE FUNCTION get_table_statistics()
RETURNS TABLE (
  name text,
  row_count bigint,
  size text,
  last_updated timestamp with time zone,
  schema text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::text as name,
    COALESCE(c.reltuples, 0)::bigint as row_count,
    pg_size_pretty(pg_total_relation_size(c.oid))::text as size,
    COALESCE(
      (SELECT MAX(updated_at) FROM customers LIMIT 1),
      NOW()
    ) as last_updated,
    'public'::text as schema
  FROM information_schema.tables t
  LEFT JOIN pg_class c ON c.relname = t.table_name
  WHERE t.table_schema = 'public' 
    AND t.table_name IN ('customers', 'devices', 'spare_parts', 'products', 'sale_orders')
  ORDER BY t.table_name;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_table_statistics() TO authenticated;

-- Create function for database optimization
CREATE OR REPLACE FUNCTION optimize_database()
RETURNS VOID AS $$
BEGIN
    -- Analyze tables for better query planning
    ANALYZE customers;
    ANALYZE devices;
    ANALYZE payments;
    ANALYZE audit_logs;
    ANALYZE settings;
    
    -- Vacuum tables to reclaim storage
    VACUUM ANALYZE customers;
    VACUUM ANALYZE devices;
    VACUUM ANALYZE payments;
    VACUUM ANALYZE audit_logs;
    VACUUM ANALYZE settings;
END;
$$ LANGUAGE plpgsql; 