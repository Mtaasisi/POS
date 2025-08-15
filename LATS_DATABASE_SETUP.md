# LATS Database Setup Instructions

This document provides instructions for setting up the LATS (Inventory Management) database in Supabase.

## Prerequisites

1. Access to your Supabase project dashboard
2. Admin privileges on the Supabase project

## Setup Steps

### 1. Access Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `jxhzveborezjhsmzsgbc`
3. Navigate to the **SQL Editor** section

### 2. Run the Database Schema

1. In the SQL Editor, copy and paste the entire contents of the file:
   ```
   supabase/migrations/20241201000000_create_lats_schema.sql
   ```

2. Click **Run** to execute the schema

3. Verify that all tables were created successfully by checking the **Table Editor** section

### 3. Verify Setup

After running the schema, you should see the following tables in your database:

#### Core Tables:
- `lats_categories` - Product categories
- `lats_brands` - Product brands
- `lats_suppliers` - Product suppliers
- `lats_products` - Main products
- `lats_product_variants` - Product variants with stock

#### Inventory Management:
- `lats_stock_movements` - Stock movement tracking
- `lats_purchase_orders` - Purchase orders
- `lats_purchase_order_items` - Purchase order items
- `lats_spare_parts` - Spare parts inventory
- `lats_spare_part_usage` - Spare parts usage tracking

#### POS System:
- `lats_cart` - Shopping cart
- `lats_cart_items` - Cart items
- `lats_sales` - Sales transactions
- `lats_sale_items` - Sale items
- `lats_pos_settings` - POS configuration

### 4. Test the Setup

You can test the setup by running these queries in the SQL Editor:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'lats_%'
ORDER BY table_name;

-- Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'get_%'
ORDER BY routine_name;

-- Test analytics functions
SELECT get_inventory_stats();
SELECT get_sales_stats();
```

### 5. Insert Sample Data (Optional)

If you want to add some sample data to test the system, you can run these commands:

```sql
-- Insert sample categories
INSERT INTO lats_categories (name, description, color) VALUES
('Smartphones', 'Mobile phones and accessories', '#3B82F6'),
('Laptops', 'Portable computers', '#10B981'),
('Tablets', 'Tablet computers', '#F59E0B'),
('Accessories', 'Phone and computer accessories', '#EF4444');

-- Insert sample brands
INSERT INTO lats_brands (name, description) VALUES
('Apple', 'Apple Inc. products'),
('Samsung', 'Samsung Electronics'),
('Dell', 'Dell Technologies'),
('HP', 'Hewlett-Packard');

-- Insert sample suppliers
INSERT INTO lats_suppliers (name, contact_person, email, phone) VALUES
('Tech Supplies Ltd', 'John Doe', 'john@techsupplies.com', '+254700000000'),
('Mobile World', 'Jane Smith', 'jane@mobileworld.com', '+254700000001'),
('Computer Hub', 'Mike Johnson', 'mike@computerhub.com', '+254700000002');
```

## Configuration

### Environment Variables

Make sure your application has the correct environment variables set:

```env
VITE_SUPABASE_URL=https://jxhzveborezjhsmzsgbc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw
VITE_LATS_DATA_MODE=supabase
```

### Application Configuration

The application is now configured to use the Supabase provider by default. The data provider will automatically switch from demo data to real database data.

## Troubleshooting

### Common Issues

1. **Permission Denied**: Make sure you have admin access to the Supabase project
2. **Function Not Found**: The `exec_sql` function doesn't exist in your Supabase instance - use the SQL Editor instead
3. **RLS Policies**: Row Level Security is enabled - make sure users are authenticated

### Verification Commands

```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename LIKE 'lats_%';

-- Check triggers
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table LIKE 'lats_%';

-- Check functions
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%lats%' OR routine_name LIKE 'get_%' OR routine_name LIKE 'update_%';
```

## Next Steps

After setting up the database:

1. **Test the POS System**: Navigate to the POS page and verify it loads without errors
2. **Add Real Data**: Start adding your actual products, categories, and suppliers
3. **Configure Settings**: Update POS settings according to your business needs
4. **Train Users**: Ensure your team knows how to use the new inventory system

## Support

If you encounter any issues during setup, please:

1. Check the Supabase logs in the dashboard
2. Verify all SQL commands executed successfully
3. Ensure your environment variables are correctly configured
4. Test the connection using the NetworkDiagnostic component

---

**Note**: This setup replaces all demo data with a real database. The POS system will now show actual inventory data instead of sample data.
