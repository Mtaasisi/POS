# Migration Order for Device Price History

## Required Migration Sequence

To set up the device price history functionality, run these migrations in the following order:

### 1. First: Add repair_price column to devices table
```bash
supabase db push --file supabase/migrations/20250131000016_add_repair_price_to_devices.sql
```

### 2. Second: Create device_price_history table and trigger
```bash
supabase db push --file supabase/migrations/20250131000017_create_device_price_history_table.sql
```

## Alternative: Simple Version (without trigger)

If you want to test without the automatic trigger first:

### 1. Add repair_price column
```bash
supabase db push --file supabase/migrations/20250131000016_add_repair_price_to_devices.sql
```

### 2. Create table only (no trigger)
```bash
supabase db push --file supabase/migrations/20250131000018_create_device_price_history_table_simple.sql
```

## What Each Migration Does

### 20250131000016_add_repair_price_to_devices.sql
- Adds `repair_price NUMERIC(12,2)` column to the `devices` table
- Creates index for better performance
- Adds documentation comment

### 20250131000017_create_device_price_history_table.sql
- Creates `device_price_history` table with computed columns
- Creates indexes for performance
- Sets up Row Level Security
- Creates trigger function to automatically log price changes
- Creates trigger on devices table

### 20250131000018_create_device_price_history_table_simple.sql
- Same as above but without the trigger
- Good for testing the table structure first

## Troubleshooting

If you get errors about missing columns:
1. Make sure you've run the repair_price migration first
2. Check that the devices table has the repair_price column
3. Use the simple version first to test the table structure

## Verification

After running the migrations, you can verify they worked:

```sql
-- Check if repair_price column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'devices' AND column_name = 'repair_price';

-- Check if device_price_history table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'device_price_history';

-- Check if trigger exists
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'device_price_change_trigger';
```
