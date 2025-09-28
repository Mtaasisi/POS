-- PAYMENT METHODS ANALYSIS AND CLEANUP
-- This helps you understand and standardize your payment method data

-- ✅ 1. ANALYZE PAYMENT METHOD FORMATS
-- See all different payment method formats in your database
SELECT 
    payment_method,
    COUNT(*) as count,
    SUM(total_amount) as total_amount
FROM lats_sales 
WHERE payment_method IS NOT NULL
GROUP BY payment_method
ORDER BY count DESC;

-- ✅ 2. IDENTIFY JSON vs SIMPLE FORMATS
-- Separate JSON payment methods from simple ones
SELECT 
    CASE 
        WHEN payment_method LIKE '{%' THEN 'JSON Format'
        ELSE 'Simple Format'
    END as format_type,
    COUNT(*) as count,
    SUM(total_amount) as total_amount
FROM lats_sales 
WHERE payment_method IS NOT NULL
GROUP BY 
    CASE 
        WHEN payment_method LIKE '{%' THEN 'JSON Format'
        ELSE 'Simple Format'
    END
ORDER BY count DESC;

-- ✅ 3. EXTRACT PAYMENT TYPES FROM JSON
-- Parse JSON payment methods to see the actual payment types
SELECT 
    CASE 
        WHEN payment_method LIKE '%"type":"Cash"%' THEN 'Cash'
        WHEN payment_method LIKE '%"type":"CRDB Bank"%' THEN 'CRDB Bank'
        WHEN payment_method LIKE '%"type":"NMB Bank"%' THEN 'NMB Bank'
        WHEN payment_method LIKE '%"type":"Mobile Money"%' THEN 'Mobile Money'
        ELSE 'Other JSON'
    END as extracted_type,
    COUNT(*) as count,
    SUM(total_amount) as total_amount
FROM lats_sales 
WHERE payment_method LIKE '{%'
GROUP BY 
    CASE 
        WHEN payment_method LIKE '%"type":"Cash"%' THEN 'Cash'
        WHEN payment_method LIKE '%"type":"CRDB Bank"%' THEN 'CRDB Bank'
        WHEN payment_method LIKE '%"type":"NMB Bank"%' THEN 'NMB Bank'
        WHEN payment_method LIKE '%"type":"Mobile Money"%' THEN 'Mobile Money'
        ELSE 'Other JSON'
    END
ORDER BY count DESC;

-- ✅ 4. SIMPLE PAYMENT METHODS
-- Show simple payment methods (non-JSON)
SELECT 
    payment_method,
    COUNT(*) as count,
    SUM(total_amount) as total_amount,
    AVG(total_amount) as average_amount
FROM lats_sales 
WHERE payment_method IS NOT NULL 
  AND payment_method NOT LIKE '{%'
GROUP BY payment_method
ORDER BY count DESC;

-- ✅ 5. PAYMENT METHODS SUMMARY
-- Overall summary of all payment methods
SELECT 
    'Total Sales' as category,
    COUNT(*) as transaction_count,
    SUM(total_amount) as total_amount,
    AVG(total_amount) as average_amount
FROM lats_sales 
WHERE payment_method IS NOT NULL

UNION ALL

SELECT 
    'JSON Format Sales' as category,
    COUNT(*) as transaction_count,
    SUM(total_amount) as total_amount,
    AVG(total_amount) as average_amount
FROM lats_sales 
WHERE payment_method LIKE '{%'

UNION ALL

SELECT 
    'Simple Format Sales' as category,
    COUNT(*) as transaction_count,
    SUM(total_amount) as total_amount,
    AVG(total_amount) as average_amount
FROM lats_sales 
WHERE payment_method IS NOT NULL 
  AND payment_method NOT LIKE '{%';

-- ✅ 6. RECENT PAYMENT METHODS (Last 30 days)
-- See what payment methods are being used recently
SELECT 
    CASE 
        WHEN payment_method LIKE '%"type":"Cash"%' THEN 'Cash'
        WHEN payment_method LIKE '%"type":"CRDB Bank"%' THEN 'CRDB Bank'
        WHEN payment_method LIKE '%"type":"NMB Bank"%' THEN 'NMB Bank'
        WHEN payment_method LIKE '%"type":"Mobile Money"%' THEN 'Mobile Money'
        WHEN payment_method = 'cash' THEN 'Cash (Simple)'
        WHEN payment_method = 'card' THEN 'Card (Simple)'
        ELSE COALESCE(payment_method, 'Unknown')
    END as payment_type,
    COUNT(*) as count,
    SUM(total_amount) as total_amount,
    AVG(total_amount) as average_amount
FROM lats_sales 
WHERE payment_method IS NOT NULL
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY 
    CASE 
        WHEN payment_method LIKE '%"type":"Cash"%' THEN 'Cash'
        WHEN payment_method LIKE '%"type":"CRDB Bank"%' THEN 'CRDB Bank'
        WHEN payment_method LIKE '%"type":"NMB Bank"%' THEN 'NMB Bank'
        WHEN payment_method LIKE '%"type":"Mobile Money"%' THEN 'Mobile Money'
        WHEN payment_method = 'cash' THEN 'Cash (Simple)'
        WHEN payment_method = 'card' THEN 'Card (Simple)'
        ELSE COALESCE(payment_method, 'Unknown')
    END
ORDER BY count DESC;

-- ✅ 7. RECOMMENDATIONS
-- Based on your data, here are the recommendations:

/*
RECOMMENDATIONS FOR PAYMENT METHOD STANDARDIZATION:

1. CURRENT SITUATION:
   - You have both JSON and simple payment method formats
   - JSON format: {"type":"Cash","details":{...},"amount":700000}
   - Simple format: "cash", "card", etc.

2. RECOMMENDED ACTIONS:
   - Standardize on simple format for better performance
   - Use: "Cash", "CRDB Bank", "NMB Bank", "Mobile Money", "Card"
   - This will make queries faster and easier to analyze

3. MIGRATION STRATEGY:
   - Update your frontend to use simple payment method strings
   - Keep the JSON format for detailed payment tracking if needed
   - Use a separate field for payment details if required

4. BENEFITS:
   - Faster queries (no JSON parsing needed)
   - Easier reporting and analytics
   - Better performance for payment method filtering
   - Consistent data format across your application
*/
