# Database Schema Fix Instructions

## 🎯 **Goal**
Fix the 400 Bad Request errors by creating the missing database tables and columns.

## 📋 **Steps to Execute**

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `aggressive-lats-sales-fix.sql`
4. Paste it into the SQL editor
5. Click **Run** to execute

### Option 2: Command Line (if you have database access)
```bash
# If you have psql installed and database credentials
psql "your-database-connection-string" -f aggressive-lats-sales-fix.sql
```

## 🔍 **What This Script Does**

1. **Backs up existing data** to `lats_sales_backup`
2. **Drops and recreates** the `lats_sales` table with all required columns
3. **Creates missing tables**:
   - `lats_sale_items`
   - `lats_products` (with missing columns)
   - `lats_product_variants` (with missing columns)
4. **Sets up RLS policies** for security
5. **Creates indexes** for performance
6. **Tests the queries** to ensure they work

## ✅ **Expected Results**

After running this script:
- ✅ No more 400 Bad Request errors
- ✅ All complex queries with joins will work
- ✅ Full functionality restored
- ✅ Better performance with proper indexes

## 🚨 **Important Notes**

- The script backs up existing data before making changes
- It's safe to run multiple times
- If something goes wrong, you can restore from the backup table
- The script includes test queries to verify everything works

## 📊 **Verification**

After running the script, you should see:
- Success messages in the SQL editor
- No more 400 errors in your application console
- All features working with full data joins
