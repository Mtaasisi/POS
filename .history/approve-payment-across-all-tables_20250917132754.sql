-- Function to approve payment across all payment tables
-- This function updates the status to 'approved' in all relevant payment tables
-- when a payment is approved from any source

CREATE OR REPLACE FUNCTION approve_payment_across_all_tables(
    payment_id UUID,
    source_table VARCHAR(50),
    user_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    result JSONB := '{}';
    payment_record RECORD;
    updated_count INTEGER := 0;
    error_message TEXT;
BEGIN
    -- Log the approval attempt
    RAISE NOTICE 'Starting payment approval for ID: %, Source: %', payment_id, source_table;
    
    -- Get the payment record from the source table
    CASE source_table
        WHEN 'customer_payments' THEN
            SELECT * INTO payment_record FROM customer_payments WHERE id = payment_id;
        WHEN 'purchase_order_payments' THEN
            SELECT * INTO payment_record FROM purchase_order_payments WHERE id = payment_id;
        WHEN 'device_payments' THEN
            SELECT * INTO payment_record FROM device_payments WHERE id = payment_id;
        WHEN 'repair_payments' THEN
            SELECT * INTO payment_record FROM repair_payments WHERE id = payment_id;
        WHEN 'payment_transactions' THEN
            SELECT * INTO payment_record FROM payment_transactions WHERE id = payment_id;
        ELSE
            RAISE EXCEPTION 'Unknown source table: %', source_table;
    END CASE;
    
    -- Check if payment record exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment record not found with ID: %', payment_id;
    END IF;
    
    -- Update the source table first
    CASE source_table
        WHEN 'customer_payments' THEN
            UPDATE customer_payments 
            SET status = 'approved', 
                updated_at = NOW(),
                updated_by = user_id
            WHERE id = payment_id;
        WHEN 'purchase_order_payments' THEN
            UPDATE purchase_order_payments 
            SET status = 'approved', 
                updated_at = NOW()
            WHERE id = payment_id;
        WHEN 'device_payments' THEN
            UPDATE device_payments 
            SET status = 'approved', 
                updated_at = NOW()
            WHERE id = payment_id;
        WHEN 'repair_payments' THEN
            UPDATE repair_payments 
            SET status = 'approved', 
                updated_at = NOW()
            WHERE id = payment_id;
        WHEN 'payment_transactions' THEN
            UPDATE payment_transactions 
            SET status = 'approved', 
                updated_at = NOW(),
                completed_at = CASE WHEN completed_at IS NULL THEN NOW() ELSE completed_at END
            WHERE id = payment_id;
    END CASE;
    
    updated_count := updated_count + 1;
    
    -- If this is a customer payment, also update related device payments
    IF source_table = 'customer_payments' AND payment_record.device_id IS NOT NULL THEN
        UPDATE customer_payments 
        SET status = 'approved', 
            updated_at = NOW(),
            updated_by = user_id
        WHERE device_id = payment_record.device_id 
        AND customer_id = payment_record.customer_id
        AND id != payment_id
        AND status != 'approved';
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        updated_count := updated_count + 1;
    END IF;
    
    -- If this is a purchase order payment, update the purchase order status
    IF source_table = 'purchase_order_payments' THEN
        -- Update purchase order status to approved if all payments are approved
        UPDATE purchase_orders 
        SET status = 'approved',
            updated_at = NOW()
        WHERE id = payment_record.purchase_order_id
        AND NOT EXISTS (
            SELECT 1 FROM purchase_order_payments 
            WHERE purchase_order_id = payment_record.purchase_order_id 
            AND status NOT IN ('approved', 'completed')
        );
    END IF;
    
    -- Create audit log entry
    INSERT INTO payment_audit_log (
        payment_id,
        source_table,
        action,
        old_status,
        new_status,
        user_id,
        metadata
    ) VALUES (
        payment_id,
        source_table,
        'approve',
        payment_record.status,
        'approved',
        user_id,
        jsonb_build_object(
            'approval_timestamp', NOW(),
            'related_updates', updated_count
        )
    );
    
    -- Build success result
    result := jsonb_build_object(
        'success', true,
        'message', 'Payment approved successfully',
        'payment_id', payment_id,
        'source_table', source_table,
        'updated_count', updated_count,
        'timestamp', NOW()
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error
        error_message := SQLERRM;
        RAISE NOTICE 'Error approving payment: %', error_message;
        
        -- Return error result
        result := jsonb_build_object(
            'success', false,
            'error', error_message,
            'payment_id', payment_id,
            'source_table', source_table,
            'timestamp', NOW()
        );
        
        RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create payment audit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL,
    source_table VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'approve', 'reject', 'update', 'delete'
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    user_id UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for audit log
CREATE INDEX IF NOT EXISTS idx_payment_audit_log_payment_id ON payment_audit_log(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_audit_log_created_at ON payment_audit_log(created_at);

-- Enable RLS for audit log
ALTER TABLE payment_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policy for audit log
CREATE POLICY "Enable read access for authenticated users" ON payment_audit_log
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert access for authenticated users" ON payment_audit_log
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Grant permissions
GRANT EXECUTE ON FUNCTION approve_payment_across_all_tables TO authenticated;
GRANT SELECT, INSERT ON payment_audit_log TO authenticated;

-- Add approval status to existing payment tables if not exists
DO $$ 
BEGIN
    -- Add approval columns to customer_payments if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'customer_payments' AND column_name = 'approved_at') THEN
        ALTER TABLE customer_payments ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE customer_payments ADD COLUMN approved_by UUID REFERENCES auth.users(id);
    END IF;
    
    -- Add approval columns to purchase_order_payments if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'purchase_order_payments' AND column_name = 'approved_at') THEN
        ALTER TABLE purchase_order_payments ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE purchase_order_payments ADD COLUMN approved_by UUID REFERENCES auth.users(id);
    END IF;
    
    -- Add approval columns to payment_transactions if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payment_transactions' AND column_name = 'approved_at') THEN
        ALTER TABLE payment_transactions ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE payment_transactions ADD COLUMN approved_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Update the function to also set approval timestamps
CREATE OR REPLACE FUNCTION approve_payment_across_all_tables(
    payment_id UUID,
    source_table VARCHAR(50),
    user_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    result JSONB := '{}';
    payment_record RECORD;
    updated_count INTEGER := 0;
    error_message TEXT;
BEGIN
    -- Log the approval attempt
    RAISE NOTICE 'Starting payment approval for ID: %, Source: %', payment_id, source_table;
    
    -- Get the payment record from the source table
    CASE source_table
        WHEN 'customer_payments' THEN
            SELECT * INTO payment_record FROM customer_payments WHERE id = payment_id;
        WHEN 'purchase_order_payments' THEN
            SELECT * INTO payment_record FROM purchase_order_payments WHERE id = payment_id;
        WHEN 'device_payments' THEN
            SELECT * INTO payment_record FROM device_payments WHERE id = payment_id;
        WHEN 'repair_payments' THEN
            SELECT * INTO payment_record FROM repair_payments WHERE id = payment_id;
        WHEN 'payment_transactions' THEN
            SELECT * INTO payment_record FROM payment_transactions WHERE id = payment_id;
        ELSE
            RAISE EXCEPTION 'Unknown source table: %', source_table;
    END CASE;
    
    -- Check if payment record exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment record not found with ID: %', payment_id;
    END IF;
    
    -- Update the source table first with approval timestamp
    CASE source_table
        WHEN 'customer_payments' THEN
            UPDATE customer_payments 
            SET status = 'approved', 
                updated_at = NOW(),
                updated_by = user_id,
                approved_at = NOW(),
                approved_by = user_id
            WHERE id = payment_id;
        WHEN 'purchase_order_payments' THEN
            UPDATE purchase_order_payments 
            SET status = 'approved', 
                updated_at = NOW(),
                approved_at = NOW(),
                approved_by = user_id
            WHERE id = payment_id;
        WHEN 'device_payments' THEN
            UPDATE device_payments 
            SET status = 'approved', 
                updated_at = NOW()
            WHERE id = payment_id;
        WHEN 'repair_payments' THEN
            UPDATE repair_payments 
            SET status = 'approved', 
                updated_at = NOW()
            WHERE id = payment_id;
        WHEN 'payment_transactions' THEN
            UPDATE payment_transactions 
            SET status = 'approved', 
                updated_at = NOW(),
                completed_at = CASE WHEN completed_at IS NULL THEN NOW() ELSE completed_at END,
                approved_at = NOW(),
                approved_by = user_id
            WHERE id = payment_id;
    END CASE;
    
    updated_count := updated_count + 1;
    
    -- If this is a customer payment, also update related device payments
    IF source_table = 'customer_payments' AND payment_record.device_id IS NOT NULL THEN
        UPDATE customer_payments 
        SET status = 'approved', 
            updated_at = NOW(),
            updated_by = user_id,
            approved_at = NOW(),
            approved_by = user_id
        WHERE device_id = payment_record.device_id 
        AND customer_id = payment_record.customer_id
        AND id != payment_id
        AND status != 'approved';
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        updated_count := updated_count + 1;
    END IF;
    
    -- If this is a purchase order payment, update the purchase order status
    IF source_table = 'purchase_order_payments' THEN
        -- Update purchase order status to approved if all payments are approved
        UPDATE purchase_orders 
        SET status = 'approved',
            updated_at = NOW()
        WHERE id = payment_record.purchase_order_id
        AND NOT EXISTS (
            SELECT 1 FROM purchase_order_payments 
            WHERE purchase_order_id = payment_record.purchase_order_id 
            AND status NOT IN ('approved', 'completed')
        );
    END IF;
    
    -- Create audit log entry
    INSERT INTO payment_audit_log (
        payment_id,
        source_table,
        action,
        old_status,
        new_status,
        user_id,
        metadata
    ) VALUES (
        payment_id,
        source_table,
        'approve',
        payment_record.status,
        'approved',
        user_id,
        jsonb_build_object(
            'approval_timestamp', NOW(),
            'related_updates', updated_count
        )
    );
    
    -- Build success result
    result := jsonb_build_object(
        'success', true,
        'message', 'Payment approved successfully',
        'payment_id', payment_id,
        'source_table', source_table,
        'updated_count', updated_count,
        'timestamp', NOW()
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error
        error_message := SQLERRM;
        RAISE NOTICE 'Error approving payment: %', error_message;
        
        -- Return error result
        result := jsonb_build_object(
            'success', false,
            'error', error_message,
            'payment_id', payment_id,
            'source_table', source_table,
            'timestamp', NOW()
        );
        
        RETURN result;
END;
$$ LANGUAGE plpgsql;
