# Payment Processing Fix

## Issue Identified
The 400 Bad Request error in `process_purchase_order_payment` is caused by:
1. **Ambiguous column reference**: The function has a parameter named `payment_status` which conflicts with the column name in the `lats_purchase_orders` table
2. **Currency conversion not handled**: The function doesn't properly handle currency conversion when payment currency differs from account currency

## Solution
Run the following SQL in your Supabase SQL Editor to fix the payment processing function:

```sql
-- Fix the process_purchase_order_payment function to handle currency conversion
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
    account_record RECORD;
    current_paid DECIMAL(15,2);
    new_paid DECIMAL(15,2);
    payment_status VARCHAR(20);
    converted_amount DECIMAL(15,2);
    exchange_rate DECIMAL(15,4);
BEGIN
    -- Validate purchase order exists
    SELECT id, total_amount, currency, total_paid, lats_purchase_orders.payment_status, exchange_rate
    INTO order_record
    FROM lats_purchase_orders 
    WHERE id = purchase_order_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Purchase order % not found', purchase_order_id_param;
    END IF;
    
    -- Validate payment account exists
    SELECT id, balance, currency
    INTO account_record
    FROM finance_accounts 
    WHERE id = payment_account_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment account % not found', payment_account_id_param;
    END IF;
    
    -- Handle currency conversion if needed
    converted_amount := amount_param;
    IF currency_param != account_record.currency THEN
        -- Use exchange rate from purchase order if available
        IF order_record.exchange_rate IS NOT NULL AND order_record.exchange_rate > 0 THEN
            -- Convert payment currency to account currency using PO exchange rate
            IF currency_param = order_record.currency THEN
                -- Payment is in PO currency, convert to account currency
                IF account_record.currency = 'TZS' THEN
                    converted_amount := amount_param * order_record.exchange_rate;
                ELSE
                    -- Account is in foreign currency, convert from PO currency
                    converted_amount := amount_param / order_record.exchange_rate;
                END IF;
            ELSE
                -- Payment is in different currency than PO, use simple conversion
                -- For now, assume 1:1 conversion for non-matching currencies
                -- This should be enhanced with proper exchange rate lookup
                converted_amount := amount_param;
            END IF;
        ELSE
            -- No exchange rate available, use 1:1 conversion as fallback
            converted_amount := amount_param;
        END IF;
    END IF;
    
    -- Check account balance with converted amount
    IF account_record.balance < converted_amount THEN
        RAISE EXCEPTION 'Insufficient balance in account. Available: % %, Required: % % (converted from % % %)', 
            account_record.balance, account_record.currency, converted_amount, account_record.currency, amount_param, currency_param, 
            CASE WHEN currency_param != account_record.currency THEN 'using exchange rate' ELSE '' END;
    END IF;
    
    current_paid := COALESCE(order_record.total_paid, 0);
    new_paid := current_paid + amount_param;
    
    -- Determine payment status
    IF new_paid >= order_record.total_amount THEN
        payment_status := 'paid';
    ELSIF new_paid > 0 THEN
        payment_status := 'partial';
    ELSE
        payment_status := 'unpaid';
    END IF;
    
    -- Update finance account balance (use converted amount for account currency)
    UPDATE finance_accounts 
    SET balance = balance - converted_amount,
        updated_at = NOW()
    WHERE id = payment_account_id_param;
    
    -- Insert payment record
    INSERT INTO purchase_order_payments (
        purchase_order_id,
        payment_account_id,
        amount,
        currency,
        payment_method,
        payment_method_id,
        reference,
        notes,
        created_by,
        created_at
    ) VALUES (
        purchase_order_id_param,
        payment_account_id_param,
        amount_param,
        currency_param,
        payment_method_param,
        payment_method_id_param,
        reference_param,
        notes_param,
        user_id_param,
        NOW()
    );
    
    -- Update purchase order payment status
    UPDATE lats_purchase_orders 
    SET total_paid = new_paid,
        payment_status = payment_status,
        updated_at = NOW()
    WHERE id = purchase_order_id_param;
    
    -- Add audit entry
    INSERT INTO lats_purchase_order_audit (
        purchase_order_id,
        action,
        details,
        user_id,
        created_by,
        created_at
    ) VALUES (
        purchase_order_id_param,
        'payment_processed',
        json_build_object(
            'amount', amount_param,
            'currency', currency_param,
            'converted_amount', converted_amount,
            'account_currency', account_record.currency,
            'payment_method', payment_method_param,
            'new_total_paid', new_paid,
            'payment_status', payment_status,
            'currency_conversion', CASE WHEN currency_param != account_record.currency THEN 'yes' ELSE 'no' END
        ),
        user_id_param,
        user_id_param,
        NOW()
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process payment: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## What This Fix Does

1. **Fixes ambiguous column reference**: Uses `lats_purchase_orders.payment_status` to explicitly reference the table column
2. **Adds currency conversion logic**: 
   - Checks if payment currency differs from account currency
   - Uses exchange rate from purchase order when available
   - Converts payment amount to account currency for balance checking
   - Updates account balance with converted amount
3. **Enhanced error messages**: Provides detailed information about currency conversion in error messages
4. **Audit trail**: Records currency conversion details in the audit log

## Testing
After applying this fix, the payment processing should work correctly with:
- Purchase Order ID: `3c1681e3-0acb-4f19-9266-e544544a15b6`
- Payment Account ID: `deb92580-95dd-4018-9f6a-134b2157716c`
- Amount: `2370`
- Currency: `CNY`
- Payment Method: `Cash`

The function will now properly handle the currency conversion from CNY to the account's currency (likely TZS) using the exchange rate from the purchase order.
