# 🚨 URGENT: Fix Sales Database Error

## Problem
You're getting a **400 Bad Request** error when trying to create sales because the database table structure doesn't match what the application is trying to insert.

## Solution
Run the database fix script in your Supabase dashboard.

## Steps to Fix

### 1. Open Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**

### 2. Run the Fix Script
1. Copy the contents of `fix-both-sales-tables-complete.sql`
2. Paste it into the SQL Editor
3. Click **Run** to execute the script

### 3. Verify the Fix
The script will:
- ✅ Add all missing columns to `lats_sales` table
- ✅ Fix column naming issues in `lats_sale_items` table  
- ✅ Add proper constraints and indexes
- ✅ Set up Row Level Security policies
- ✅ Create update triggers
- ✅ Test the complete sales insertion process

### 4. Test in Application
After running the script:
1. Try creating a new sale in your POS application
2. The 400 error should be resolved
3. Sales should be created successfully

## What Was Wrong

The application was trying to insert data with these columns:
- `sale_number`, `subtotal`, `discount_amount`, `discount_type`, `discount_value`
- `customer_name`, `customer_phone`, `tax`, `created_by`

But the database table was missing these columns, causing the 400 Bad Request error.

## Files Modified

1. **`src/lib/saleProcessingService.ts`** - Updated to send correct column names and handle missing values
2. **Database structure** - Added all missing columns and proper constraints

## If You Still Have Issues

1. Check the Supabase logs for any remaining errors
2. Verify that the script ran completely without errors
3. Check that all columns were added successfully
4. Test with a simple sale first before trying complex ones

---

**This fix should resolve your sales creation issue immediately!** 🎉
