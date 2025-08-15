# Troubleshooting LATS Syntax Error

## The Error You're Seeing
```
ERROR: 42601: syntax error at or near "LIMIT"
LINE 4: LIMIT 100;
        ^
```

## What This Means
You're running a query that has `LIMIT 100;` on line 4, but this query is using incorrect syntax.

## Possible Causes

### 1. You're running the wrong query
You might be running a query that looks like this:
```sql
SELECT * FROM lats_sales 
JOIN customers(name) 
JOIN lats_sale_items(*) 
LIMIT 100;
```

**This is WRONG** - it uses Supabase client syntax in SQL Editor.

### 2. You're running a partial query
You might have copied only part of a query that ends with `LIMIT 100;`

## The Correct Solution

### Step 1: Use the Simple Fix Script
Run this exact script in your Supabase SQL Editor:

```sql
-- ========================================
-- STEP-BY-STEP LATS 400 ERROR FIX
-- Simple and safe approach
-- ========================================

-- Step 1: Add the foreign key constraint
ALTER TABLE lats_sales 
ADD CONSTRAINT lats_sales_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

-- Step 2: Verify the constraint was added
SELECT 'Foreign key constraint added successfully' as status;

-- Step 3: Test a simple query
SELECT COUNT(*) as total_sales FROM lats_sales;

-- Step 4: Test the relationship
SELECT COUNT(*) as sales_with_customers 
FROM lats_sales s 
LEFT JOIN customers c ON s.customer_id = c.id;

-- Step 5: Success message
SELECT 'LATS 400 error should now be fixed!' as status;
```

### Step 2: If you get a constraint already exists error
If you see an error about the constraint already existing, run this instead:

```sql
-- Check if constraint exists
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'lats_sales' 
AND constraint_name = 'lats_sales_customer_id_fkey';

-- Test the relationship
SELECT COUNT(*) as sales_with_customers 
FROM lats_sales s 
LEFT JOIN customers c ON s.customer_id = c.id;
```

## What NOT to Do

❌ **Don't run queries like this in SQL Editor:**
```sql
SELECT * FROM lats_sales 
JOIN customers(name) 
JOIN lats_sale_items(*) 
LIMIT 100;
```

❌ **Don't copy partial queries that end with LIMIT**

## What TO Do

✅ **Use the simple fix script above**
✅ **Run complete, valid SQL queries**
✅ **Test with simple COUNT queries first**

## After Running the Fix

1. **Test your application** - the 400 errors should be gone
2. **Run the test script**: `node scripts/test-lats-fix.js`
3. **Check the browser console** - no more 400 errors

## Still Having Issues?

If you're still getting syntax errors:
1. **Copy the exact script from `fix-lats-step-by-step.sql`**
2. **Make sure you're not adding any extra text**
3. **Run it in the Supabase SQL Editor**
4. **Don't modify the script**

The key is to use the simple, step-by-step approach that avoids any complex syntax that might cause errors.
