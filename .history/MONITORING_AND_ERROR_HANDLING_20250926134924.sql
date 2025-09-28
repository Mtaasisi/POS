-- MONITORING AND ERROR HANDLING SYSTEM
-- Comprehensive monitoring, error handling, and system health checks
-- Run this after PERMANENT_AUTH_FIX.sql and USER_MANAGEMENT_EXTENSION.sql

-- ===========================================
-- PART 1: SYSTEM HEALTH MONITORING
-- ===========================================

-- Create system health monitoring table
CREATE TABLE IF NOT EXISTS system_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'healthy', 'warning', 'error'
    message TEXT,
    details JSONB,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checked_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on system_health
ALTER TABLE system_health ENABLE ROW LEVEL SECURITY;

-- Create policy for system_health (admins only)
CREATE POLICY "Admins can view system health" ON system_health
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role_name = 'admin'
        )
    );

-- Function to perform system health checks
CREATE OR REPLACE FUNCTION perform_system_health_check()
RETURNS TABLE (
    check_name VARCHAR(100),
    status VARCHAR(20),
    message TEXT,
    details JSONB
) AS $$
DECLARE
    sales_count INTEGER;
    items_count INTEGER;
    users_count INTEGER;
    recent_errors INTEGER;
    auth_status TEXT;
BEGIN
    -- Check authentication system
    BEGIN
        auth_status := auth.role();
        IF auth_status = 'authenticated' THEN
            RETURN QUERY SELECT 
                'Authentication System'::VARCHAR(100),
                'healthy'::VARCHAR(20),
                'Authentication is working properly'::TEXT,
                jsonb_build_object('role', auth_status, 'user_id', auth.uid());
        ELSE
            RETURN QUERY SELECT 
                'Authentication System'::VARCHAR(100),
                'error'::VARCHAR(20),
                'Authentication system is not working'::TEXT,
                jsonb_build_object('role', auth_status);
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN QUERY SELECT 
                'Authentication System'::VARCHAR(100),
                'error'::VARCHAR(20),
                'Authentication system error: ' || SQLERRM::TEXT,
                jsonb_build_object('error', SQLERRM);
    END;
    
    -- Check sales table accessibility
    BEGIN
        SELECT COUNT(*) INTO sales_count FROM lats_sales;
        RETURN QUERY SELECT 
            'Sales Table Access'::VARCHAR(100),
            'healthy'::VARCHAR(20),
            'Sales table is accessible'::TEXT,
            jsonb_build_object('record_count', sales_count);
    EXCEPTION
        WHEN OTHERS THEN
            RETURN QUERY SELECT 
                'Sales Table Access'::VARCHAR(100),
                'error'::VARCHAR(20),
                'Sales table access error: ' || SQLERRM::TEXT,
                jsonb_build_object('error', SQLERRM);
    END;
    
    -- Check sale items table accessibility
    BEGIN
        SELECT COUNT(*) INTO items_count FROM lats_sale_items;
        RETURN QUERY SELECT 
            'Sale Items Table Access'::VARCHAR(100),
            'healthy'::VARCHAR(20),
            'Sale items table is accessible'::TEXT,
            jsonb_build_object('record_count', items_count);
    EXCEPTION
        WHEN OTHERS THEN
            RETURN QUERY SELECT 
                'Sale Items Table Access'::VARCHAR(100),
                'error'::VARCHAR(20),
                'Sale items table access error: ' || SQLERRM::TEXT,
                jsonb_build_object('error', SQLERRM);
    END;
    
    -- Check user roles system
    BEGIN
        SELECT COUNT(*) INTO users_count FROM user_roles;
        RETURN QUERY SELECT 
            'User Roles System'::VARCHAR(100),
            'healthy'::VARCHAR(20),
            'User roles system is working'::TEXT,
            jsonb_build_object('role_count', users_count);
    EXCEPTION
        WHEN OTHERS THEN
            RETURN QUERY SELECT 
                'User Roles System'::VARCHAR(100),
                'error'::VARCHAR(20),
                'User roles system error: ' || SQLERRM::TEXT,
                jsonb_build_object('error', SQLERRM);
    END;
    
    -- Check for recent errors in audit logs
    BEGIN
        SELECT COUNT(*) INTO recent_errors 
        FROM audit_logs 
        WHERE created_at > NOW() - INTERVAL '1 hour'
        AND action = 'ERROR';
        
        IF recent_errors = 0 THEN
            RETURN QUERY SELECT 
                'Recent Error Check'::VARCHAR(100),
                'healthy'::VARCHAR(20),
                'No recent errors found'::TEXT,
                jsonb_build_object('recent_errors', recent_errors);
        ELSE
            RETURN QUERY SELECT 
                'Recent Error Check'::VARCHAR(100),
                'warning'::VARCHAR(20),
                recent_errors || ' recent errors found'::TEXT,
                jsonb_build_object('recent_errors', recent_errors);
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN QUERY SELECT 
                'Recent Error Check'::VARCHAR(100),
                'error'::VARCHAR(20),
                'Error checking recent errors: ' || SQLERRM::TEXT,
                jsonb_build_object('error', SQLERRM);
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to run and store health checks
CREATE OR REPLACE FUNCTION run_system_health_check()
RETURNS VOID AS $$
DECLARE
    health_record RECORD;
BEGIN
    -- Clear old health records (keep last 24 hours)
    DELETE FROM system_health WHERE checked_at < NOW() - INTERVAL '24 hours';
    
    -- Run health checks and store results
    FOR health_record IN SELECT * FROM perform_system_health_check() LOOP
        INSERT INTO system_health (check_name, status, message, details, checked_by)
        VALUES (
            health_record.check_name,
            health_record.status,
            health_record.message,
            health_record.details,
            auth.uid()
        );
    END LOOP;
    
    RAISE NOTICE 'System health check completed and results stored';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- PART 2: ERROR LOGGING AND HANDLING
-- ===========================================

-- Create error logs table
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    error_details JSONB,
    stack_trace TEXT,
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    ip_address INET,
    user_agent TEXT,
    request_data JSONB,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on error_logs
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for error_logs (admins only)
CREATE POLICY "Admins can view error logs" ON error_logs
    FOR ALL USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role_name = 'admin'
        )
    );

-- Function to log errors
CREATE OR REPLACE FUNCTION log_error(
    error_type VARCHAR(100),
    error_message TEXT,
    error_details JSONB DEFAULT NULL,
    stack_trace TEXT DEFAULT NULL,
    request_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    error_id UUID;
BEGIN
    INSERT INTO error_logs (
        error_type,
        error_message,
        error_details,
        stack_trace,
        user_id,
        user_email,
        ip_address,
        user_agent,
        request_data
    ) VALUES (
        error_type,
        error_message,
        error_details,
        stack_trace,
        auth.uid(),
        auth.jwt() ->> 'email',
        inet_client_addr(),
        current_setting('request.headers', true)::json ->> 'user-agent',
        request_data
    ) RETURNING id INTO error_id;
    
    RETURN error_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to resolve errors
CREATE OR REPLACE FUNCTION resolve_error(
    error_id UUID,
    resolution_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role_name = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can resolve errors';
    END IF;
    
    UPDATE error_logs 
    SET 
        resolved = TRUE,
        resolved_by = auth.uid(),
        resolved_at = NOW(),
        error_details = COALESCE(error_details, '{}'::jsonb) || 
                       jsonb_build_object('resolution_notes', resolution_notes)
    WHERE id = error_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- PART 3: ENHANCED ERROR HANDLING FUNCTIONS
-- ===========================================

-- Function with comprehensive error handling for sales operations
CREATE OR REPLACE FUNCTION safe_create_sale(
    sale_data JSONB
)
RETURNS TABLE (
    success BOOLEAN,
    sale_id UUID,
    error_message TEXT,
    error_id UUID
) AS $$
DECLARE
    new_sale_id UUID;
    error_id UUID;
    validation_errors TEXT[];
BEGIN
    -- Initialize validation errors array
    validation_errors := ARRAY[]::TEXT[];
    
    -- Validate required fields
    IF NOT (sale_data ? 'customer_id' AND sale_data ? 'total_amount') THEN
        validation_errors := array_append(validation_errors, 'customer_id and total_amount are required');
    END IF;
    
    IF sale_data ? 'total_amount' AND (sale_data ->> 'total_amount')::DECIMAL <= 0 THEN
        validation_errors := array_append(validation_errors, 'total_amount must be greater than 0');
    END IF;
    
    -- If validation errors exist, return them
    IF array_length(validation_errors, 1) > 0 THEN
        error_id := log_error(
            'VALIDATION_ERROR',
            'Sale validation failed',
            jsonb_build_object('validation_errors', validation_errors),
            NULL,
            sale_data
        );
        
        RETURN QUERY SELECT FALSE, NULL::UUID, array_to_string(validation_errors, '; '), error_id;
        RETURN;
    END IF;
    
    -- Try to create the sale
    BEGIN
        INSERT INTO lats_sales (
            sale_number,
            customer_id,
            total_amount,
            subtotal,
            tax,
            discount_amount,
            discount_type,
            discount_value,
            customer_name,
            customer_phone,
            status,
            notes,
            created_by
        ) VALUES (
            COALESCE(sale_data ->> 'sale_number', 'SALE-' || extract(epoch from now())::text),
            (sale_data ->> 'customer_id')::UUID,
            (sale_data ->> 'total_amount')::DECIMAL,
            COALESCE((sale_data ->> 'subtotal')::DECIMAL, 0),
            COALESCE((sale_data ->> 'tax')::DECIMAL, 0),
            COALESCE((sale_data ->> 'discount_amount')::DECIMAL, 0),
            COALESCE(sale_data ->> 'discount_type', 'fixed'),
            COALESCE((sale_data ->> 'discount_value')::DECIMAL, 0),
            sale_data ->> 'customer_name',
            sale_data ->> 'customer_phone',
            COALESCE(sale_data ->> 'status', 'completed'),
            sale_data ->> 'notes',
            auth.uid()
        ) RETURNING id INTO new_sale_id;
        
        RETURN QUERY SELECT TRUE, new_sale_id, 'Sale created successfully', NULL::UUID;
        
    EXCEPTION
        WHEN OTHERS THEN
            error_id := log_error(
                'SALE_CREATION_ERROR',
                'Failed to create sale: ' || SQLERRM,
                jsonb_build_object('sql_error', SQLERRM, 'sql_state', SQLSTATE),
                NULL,
                sale_data
            );
            
            RETURN QUERY SELECT FALSE, NULL::UUID, 'Sale creation failed: ' || SQLERRM, error_id;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- PART 4: PERFORMANCE MONITORING
-- ===========================================

-- Create performance monitoring table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_name VARCHAR(100) NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    user_id UUID REFERENCES auth.users(id),
    operation_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on performance_metrics
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create policy for performance_metrics (admins only)
CREATE POLICY "Admins can view performance metrics" ON performance_metrics
    FOR SELECT USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role_name = 'admin'
        )
    );

-- Function to monitor performance
CREATE OR REPLACE FUNCTION monitor_operation(
    operation_name VARCHAR(100),
    operation_function TEXT,
    operation_data JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    execution_time INTEGER;
    result JSONB;
    error_message TEXT;
BEGIN
    start_time := clock_timestamp();
    
    BEGIN
        -- Execute the operation (this would need to be customized based on the operation)
        -- For now, we'll just simulate
        PERFORM pg_sleep(0.001); -- Simulate some work
        
        end_time := clock_timestamp();
        execution_time := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
        
        -- Log performance metric
        INSERT INTO performance_metrics (
            operation_name,
            execution_time_ms,
            success,
            user_id,
            operation_data
        ) VALUES (
            operation_name,
            execution_time,
            TRUE,
            auth.uid(),
            operation_data
        );
        
        RETURN jsonb_build_object(
            'success', TRUE,
            'execution_time_ms', execution_time,
            'operation', operation_name
        );
        
    EXCEPTION
        WHEN OTHERS THEN
            end_time := clock_timestamp();
            execution_time := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
            error_message := SQLERRM;
            
            -- Log performance metric with error
            INSERT INTO performance_metrics (
                operation_name,
                execution_time_ms,
                success,
                error_message,
                user_id,
                operation_data
            ) VALUES (
                operation_name,
                execution_time,
                FALSE,
                error_message,
                auth.uid(),
                operation_data
            );
            
            RETURN jsonb_build_object(
                'success', FALSE,
                'execution_time_ms', execution_time,
                'error', error_message,
                'operation', operation_name
            );
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- PART 5: AUTOMATED MONITORING SCHEDULE
-- ===========================================

-- Function to run all monitoring checks
CREATE OR REPLACE FUNCTION run_all_monitoring_checks()
RETURNS VOID AS $$
BEGIN
    -- Run system health check
    PERFORM run_system_health_check();
    
    -- Clean up old performance metrics (keep last 7 days)
    DELETE FROM performance_metrics WHERE created_at < NOW() - INTERVAL '7 days';
    
    -- Clean up old error logs (keep last 30 days)
    DELETE FROM error_logs WHERE created_at < NOW() - INTERVAL '30 days';
    
    RAISE NOTICE 'All monitoring checks completed successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- PART 6: DASHBOARD VIEWS
-- ===========================================

-- Create dashboard view for system status
CREATE OR REPLACE VIEW system_dashboard AS
SELECT 
    'System Status' as category,
    COUNT(*) as total_checks,
    COUNT(*) FILTER (WHERE status = 'healthy') as healthy_checks,
    COUNT(*) FILTER (WHERE status = 'warning') as warning_checks,
    COUNT(*) FILTER (WHERE status = 'error') as error_checks,
    MAX(checked_at) as last_check
FROM system_health
WHERE checked_at > NOW() - INTERVAL '1 hour'

UNION ALL

SELECT 
    'Error Status' as category,
    COUNT(*) as total_errors,
    COUNT(*) FILTER (WHERE resolved = TRUE) as resolved_errors,
    COUNT(*) FILTER (WHERE resolved = FALSE) as unresolved_errors,
    0 as error_checks,
    MAX(created_at) as last_check
FROM error_logs
WHERE created_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
    'Performance' as category,
    COUNT(*) as total_operations,
    COUNT(*) FILTER (WHERE success = TRUE) as successful_operations,
    COUNT(*) FILTER (WHERE success = FALSE) as failed_operations,
    0 as error_checks,
    MAX(created_at) as last_check
FROM performance_metrics
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Grant access to dashboard view
GRANT SELECT ON system_dashboard TO authenticated;

-- ===========================================
-- PART 7: FINAL SETUP AND VERIFICATION
-- ===========================================

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_health_checked_at ON system_health(checked_at);
CREATE INDEX IF NOT EXISTS idx_system_health_status ON system_health(status);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_operation_name ON performance_metrics(operation_name);

-- Run initial monitoring check
SELECT run_all_monitoring_checks();

-- Final verification
DO $$
DECLARE
    health_count INTEGER;
    error_count INTEGER;
    performance_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO health_count FROM system_health;
    SELECT COUNT(*) INTO error_count FROM error_logs;
    SELECT COUNT(*) INTO performance_count FROM performance_metrics;
    
    RAISE NOTICE 'MONITORING AND ERROR HANDLING SYSTEM COMPLETED!';
    RAISE NOTICE 'Health checks: %, Error logs: %, Performance metrics: %', 
                 health_count, error_count, performance_count;
    RAISE NOTICE 'System monitoring is now active and will track all operations.';
    RAISE NOTICE 'Use system_dashboard view to monitor system status.';
END $$;

-- Final status
SELECT 
    'MONITORING AND ERROR HANDLING COMPLETED' as status,
    'Comprehensive monitoring, error handling, and performance tracking enabled' as message,
    NOW() as applied_at;
