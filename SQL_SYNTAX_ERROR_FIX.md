# SQL Syntax Error Fix Guide

## The Error You're Seeing
```
ERROR: 42601: syntax error at or near "lats_products"
LINE 1: lats_products(name, description)
        ^
```

## What This Means
You're trying to run **Supabase client syntax** in the **SQL Editor**, which doesn't work. The syntax `lats_products(name, description)` is JavaScript/TypeScript code, not SQL.

## The Problem
You might be copying code from:
- JavaScript files (`.js`, `.ts`, `.tsx`)
- React components
- Supabase client queries

And trying to run it in the Supabase SQL Editor.

## The Solution

### ❌ DON'T DO THIS (Wrong)
```sql
-- This is Supabase client syntax - DON'T run this in SQL Editor
lats_products(name, description)
```

### ✅ DO THIS (Correct)
```sql
-- This is proper SQL syntax - RUN this in SQL Editor
SELECT name, description FROM lats_products;
```

## How to Fix the LATS 400 Error

### Step 1: Run the Foreign Key Fix
Copy and paste this **SQL** (not JavaScript) into your Supabase SQL Editor:

```sql
-- ========================================
-- FIX LATS 400 ERROR - PROPER SQL SYNTAX
-- Run this in your Supabase Dashboard SQL Editor
-- ========================================

-- Add the missing foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'lats_sales_customer_id_fkey'
        AND table_name = 'lats_sales'
    ) THEN
        ALTER TABLE lats_sales 
        ADD CONSTRAINT lats_sales_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
        
        RAISE NOTICE '✅ Added foreign key constraint: lats_sales.customer_id -> customers.id';
    ELSE
        RAISE NOTICE 'ℹ️ Foreign key constraint lats_sales_customer_id_fkey already exists';
    END IF;
END $$;

-- Test the fix with proper SQL syntax
SELECT 
    'Testing the fix:' as test_description,
    COUNT(*) as sales_count
FROM lats_sales;

-- Test the relationship with proper SQL syntax
SELECT 
    'Testing relationships:' as test_description,
    COUNT(*) as sales_with_customers_count
FROM lats_sales s
LEFT JOIN customers c ON s.customer_id = c.id;

-- Success message
SELECT '🎉 SUCCESS: LATS 400 error should now be fixed!' as status;
```

### Step 2: Verify the Fix
After running the SQL above, you should see:
- ✅ Success messages
- 📊 Test results showing counts
- 🎉 Final success message

## Key Differences

### Supabase Client Syntax (JavaScript/TypeScript)
```javascript
// This goes in your .js/.ts/.tsx files
const { data } = await supabase
  .from('lats_sales')
  .select(`
    *,
    lats_sale_items(
      *,
      lats_products(name, description)
    )
  `);
```

### SQL Syntax (SQL Editor)
```sql
-- This goes in your Supabase SQL Editor
SELECT 
    s.*,
    si.*,
    p.name as product_name,
    p.description as product_description
FROM lats_sales s
LEFT JOIN lats_sale_items si ON s.id = si.sale_id
LEFT JOIN lats_products p ON si.product_id = p.id;
```

## Common Mistakes to Avoid

1. **Don't copy JavaScript code into SQL Editor**
2. **Don't use Supabase client syntax in SQL**
3. **Don't run partial queries**
4. **Always use proper SQL syntax in SQL Editor**

## Need Help?
If you're still having issues:
1. Make sure you're running the SQL code above (not JavaScript)
2. Check that you're in the Supabase SQL Editor (not a JavaScript file)
3. Run the complete SQL script, not just parts of it
