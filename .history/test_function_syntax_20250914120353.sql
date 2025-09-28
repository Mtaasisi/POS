-- Test function syntax
CREATE OR REPLACE FUNCTION test_function()
RETURNS BOOLEAN AS $$
DECLARE
    order_record RECORD;
    account_record RECORD;
    current_paid DECIMAL(15,2);
    new_paid DECIMAL(15,2);
    new_payment_status VARCHAR(20);
    converted_amount DECIMAL(15,2);
    exchange_rate DECIMAL(15,4);
BEGIN
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
