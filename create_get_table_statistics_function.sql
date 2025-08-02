-- Create function to get table statistics
CREATE OR REPLACE FUNCTION get_table_statistics()
RETURNS TABLE (
    name VARCHAR,
    row_count BIGINT,
    size TEXT,
    last_updated TIMESTAMP,
    schema TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::VARCHAR,
        COALESCE(c.reltuples::BIGINT, 0) as row_count,
        pg_size_pretty(pg_total_relation_size(c.oid))::TEXT as size,
        COALESCE(MAX(a.updated_at), NOW()) as last_updated,
        t.table_schema::TEXT
    FROM information_schema.tables t
    LEFT JOIN pg_class c ON c.relname = t.table_name
    LEFT JOIN (
        SELECT 
            table_name,
            MAX(updated_at) as updated_at
        FROM (
            SELECT 'customers' as table_name, MAX(updated_at) as updated_at FROM customers
            UNION ALL
            SELECT 'devices' as table_name, MAX(updated_at) as updated_at FROM devices
            UNION ALL
            SELECT 'payments' as table_name, MAX(updated_at) as updated_at FROM payments
            UNION ALL
            SELECT 'audit_logs' as table_name, MAX(created_at) as updated_at FROM audit_logs
            UNION ALL
            SELECT 'settings' as table_name, MAX(updated_at) as updated_at FROM settings
        ) sub
        GROUP BY table_name
    ) a ON a.table_name = t.table_name
    WHERE t.table_schema = 'public'
    AND t.table_name IN ('customers', 'devices', 'payments', 'audit_logs', 'settings')
    GROUP BY t.table_name, t.table_schema, c.reltuples, c.oid;
END;
$$ LANGUAGE plpgsql;

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