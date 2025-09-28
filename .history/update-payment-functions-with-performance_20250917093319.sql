-- =====================================================
-- UPDATE PAYMENT FUNCTIONS TO RECORD PERFORMANCE METRICS
-- =====================================================

-- Update the process_customer_payment function to record performance metrics
CREATE OR REPLACE FUNCTION process_customer_payment(
    customer_id_param UUID,
    amount_param DECIMAL(15,2),
    currency_param VARCHAR(3),
    payment_method_param VARCHAR(100),
    payment_account_id_param UUID,
    user_id_param UUID,
    device_id_param UUID DEFAULT NULL,
    reference_param VARCHAR(255) DEFAULT NULL,
    notes_param TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    payment_id UUID;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    response_time_ms INTEGER;
    performance_status VARCHAR(20);
BEGIN
    start_time := NOW();
    
    BEGIN
        -- Insert payment record
        INSERT INTO customer_payments (
            customer_id,
            amount,
            currency,
            method,
            device_id,
            payment_date,
            payment_type,
            status,
            created_by,
            reference,
            notes,
            payment_account_id
        ) VALUES (
            customer_id_param,
            amount_param,
            currency_param,
            payment_method_param,
            device_id_param,
            NOW(),
            'payment',
            'completed',
            user_id_param,
            reference_param,
            notes_param,
            payment_account_id_param
        ) RETURNING id INTO payment_id;
        
        -- Record account transaction
        PERFORM record_account_transaction(
            payment_account_id_param,
            'payment_received',
            amount_param,
            'Customer payment received',
            payment_id,
            'customer_payments',
            user_id_param
        );
        
        end_time := NOW();
        response_time_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
        performance_status := 'success';
        
        -- Record performance metrics
        PERFORM record_payment_performance(
            payment_method_param,
            payment_id,
            'customer_payment',
            amount_param,
            currency_param,
            performance_status,
            response_time_ms,
            NULL
        );
        
        RETURN TRUE;
        
    EXCEPTION
        WHEN OTHERS THEN
            end_time := NOW();
            response_time_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
            performance_status := 'failed';
            
            -- Record failed performance metrics
            PERFORM record_payment_performance(
                payment_method_param,
                NULL,
                'customer_payment',
                amount_param,
                currency_param,
                performance_status,
                response_time_ms,
                SQLERRM
            );
            
            RAISE EXCEPTION 'Payment processing failed: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql;

-- Update the process_purchase_order_payment function to record performance metrics
CREATE OR REPLACE FUNCTION process_purchase_order_payment(
    purchase_order_id_param UUID,
    payment_account_id_param UUID,
    amount_param DECIMAL(15,2),
    currency_param VARCHAR(3),
    payment_method_param VARCHAR(100),
    payment_method_id_param UUID,
    user_id_param UUID,
    reference_param VARCHAR(255) DEFAULT NULL,
    notes_param TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    order_record RECORD;
    current_paid DECIMAL(15,2);
    new_paid DECIMAL(15,2);
    payment_status VARCHAR(20);
    converted_amount DECIMAL(15,2);
    payment_id UUID;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    response_time_ms INTEGER;
    performance_status VARCHAR(20);
BEGIN
    start_time := NOW();
    
    BEGIN
        -- Get purchase order details
        SELECT total_amount, total_paid, currency
        INTO order_record
        FROM lats_purchase_orders 
        WHERE id = purchase_order_id_param;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Purchase order % not found', purchase_order_id_param;
        END IF;
        
        -- Handle currency conversion if needed
        converted_amount := amount_param;
        IF currency_param != order_record.currency THEN
            converted_amount := amount_param;
        END IF;
        
        -- Get current paid amount
        current_paid := COALESCE(order_record.total_paid, 0);
        new_paid := current_paid + converted_amount;
        
        -- Determine payment status
        IF new_paid >= order_record.total_amount THEN
            payment_status := 'paid';
        ELSIF new_paid > 0 THEN
            payment_status := 'partial';
        ELSE
            payment_status := 'unpaid';
        END IF;
        
        -- Insert payment record
        INSERT INTO purchase_order_payments (
            purchase_order_id,
            payment_account_id,
            amount,
            currency,
            payment_method,
            payment_method_id,
            payment_date,
            reference,
            notes,
            created_by
        ) VALUES (
            purchase_order_id_param,
            payment_account_id_param,
            amount_param,
            currency_param,
            payment_method_param,
            payment_method_id_param,
            NOW(),
            reference_param,
            notes_param,
            user_id_param
        ) RETURNING id INTO payment_id;
        
        -- Update purchase order payment status
        UPDATE lats_purchase_orders 
        SET 
            total_paid = new_paid,
            payment_status = payment_status,
            updated_at = NOW()
        WHERE id = purchase_order_id_param;
        
        -- Record account transaction (deduct from account)
        PERFORM record_account_transaction(
            payment_account_id_param,
            'payment_made',
            amount_param,
            'Purchase order payment made',
            payment_id,
            'purchase_order_payments',
            user_id_param
        );
        
        end_time := NOW();
        response_time_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
        performance_status := 'success';
        
        -- Record performance metrics
        PERFORM record_payment_performance(
            payment_method_param,
            payment_id,
            'purchase_order_payment',
            amount_param,
            currency_param,
            performance_status,
            response_time_ms,
            NULL
        );
        
        RETURN TRUE;
        
    EXCEPTION
        WHEN OTHERS THEN
            end_time := NOW();
            response_time_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
            performance_status := 'failed';
            
            -- Record failed performance metrics
            PERFORM record_payment_performance(
                payment_method_param,
                NULL,
                'purchase_order_payment',
                amount_param,
                currency_param,
                performance_status,
                response_time_ms,
                SQLERRM
            );
            
            RAISE EXCEPTION 'Payment processing failed: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to backfill performance metrics for existing payments
CREATE OR REPLACE FUNCTION backfill_payment_performance_metrics() RETURNS INTEGER AS $$
DECLARE
    customer_payment RECORD;
    purchase_payment RECORD;
    metrics_count INTEGER := 0;
BEGIN
    -- Backfill customer payments
    FOR customer_payment IN 
        SELECT id, amount, currency, method, payment_date, status
        FROM customer_payments
        WHERE id NOT IN (
            SELECT transaction_id 
            FROM payment_performance_metrics 
            WHERE transaction_type = 'customer_payment'
        )
    LOOP
        PERFORM record_payment_performance(
            customer_payment.method,
            customer_payment.id,
            'customer_payment',
            customer_payment.amount,
            customer_payment.currency,
            CASE 
                WHEN customer_payment.status = 'completed' THEN 'success'
                WHEN customer_payment.status = 'pending' THEN 'pending'
                ELSE 'failed'
            END,
            NULL, -- No response time for historical data
            NULL
        );
        metrics_count := metrics_count + 1;
    END LOOP;
    
    -- Backfill purchase order payments
    FOR purchase_payment IN 
        SELECT id, amount, currency, payment_method, payment_date
        FROM purchase_order_payments
        WHERE id NOT IN (
            SELECT transaction_id 
            FROM payment_performance_metrics 
            WHERE transaction_type = 'purchase_order_payment'
        )
    LOOP
        PERFORM record_payment_performance(
            purchase_payment.payment_method,
            purchase_payment.id,
            'purchase_order_payment',
            purchase_payment.amount,
            purchase_payment.currency,
            'success', -- Assume success for existing payments
            NULL, -- No response time for historical data
            NULL
        );
        metrics_count := metrics_count + 1;
    END LOOP;
    
    RETURN metrics_count;
END;
$$ LANGUAGE plpgsql;
