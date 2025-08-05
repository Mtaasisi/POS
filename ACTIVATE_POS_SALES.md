# 🚀 Activate POS Sales Page

## Step 1: Create Database Tables

### Option A: Using Supabase Dashboard (Recommended)
1. **Open your Supabase dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste this SQL script:**

```sql
-- POS Tables Creation Script
-- Copy and paste this into your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create sales_orders table
CREATE TABLE IF NOT EXISTS sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'on_hold', 'cancelled', 'partially_paid', 'delivered', 'payment_on_delivery')),
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  shipping_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
  final_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(15,2) NOT NULL DEFAULT 0,
  balance_due DECIMAL(15,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer', 'installment', 'payment_on_delivery')),
  created_by UUID REFERENCES auth.users(id),
  customer_type VARCHAR(20) NOT NULL DEFAULT 'retail' CHECK (customer_type IN ('retail', 'wholesale')),
  delivery_address TEXT,
  delivery_city VARCHAR(100),
  delivery_method VARCHAR(50) CHECK (delivery_method IN ('local_transport', 'air_cargo', 'bus_cargo', 'pickup')),
  delivery_notes TEXT,
  location_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create sales_order_items table
CREATE TABLE IF NOT EXISTS sales_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id UUID,
  variant_id UUID,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  unit_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
  item_total DECIMAL(15,2) NOT NULL DEFAULT 0,
  is_external_product BOOLEAN DEFAULT false,
  external_product_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
DROP POLICY IF EXISTS "Allow all access to sales orders" ON sales_orders;
CREATE POLICY "Allow all access to sales orders" ON sales_orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to sales order items" ON sales_order_items;
CREATE POLICY "Allow all access to sales order items" ON sales_order_items FOR ALL USING (true) WITH CHECK (true);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_id ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_created_at ON sales_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_order_id ON sales_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_product_id ON sales_order_items(product_id);

-- 6. Insert sample data
INSERT INTO sales_orders (customer_id, order_date, status, total_amount, final_amount, amount_paid, payment_method, customer_type)
SELECT 
  c.id,
  CURRENT_DATE,
  'completed',
  1500.00,
  1500.00,
  1500.00,
  'cash',
  'retail'
FROM customers c
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO sales_orders (customer_id, order_date, status, total_amount, final_amount, amount_paid, payment_method, customer_type)
SELECT 
  c.id,
  CURRENT_DATE - INTERVAL '1 day',
  'completed',
  2500.00,
  2500.00,
  2500.00,
  'card',
  'retail'
FROM customers c
LIMIT 1
ON CONFLICT DO NOTHING;

-- 7. Grant permissions
GRANT ALL ON sales_orders TO authenticated;
GRANT ALL ON sales_order_items TO authenticated;
GRANT ALL ON sales_orders TO anon;
GRANT ALL ON sales_order_items TO anon;
```

4. **Click "Run" to execute the script**

### Option B: Using Command Line
```bash
# If you have psql installed
psql -h localhost -p 54322 -U postgres -d postgres -f create_pos_tables_manual.sql
```

## Step 2: Start Development Server

```bash
npm run dev
```

## Step 3: Test the POS Sales Page

### Method 1: Direct Navigation
1. **Open your browser**
2. **Navigate to**: `http://localhost:5173/pos-sales`
3. **You should see**: POS Sales page with analytics and data

### Method 2: Navigation Menu
1. **Open your app**
2. **Click the sidebar menu**
3. **Find "POS Sales"** under Point of Sale section
4. **Click to navigate**

### Method 3: Payments Report Filter
1. **Go to**: `http://localhost:5173/payments-report`
2. **Use the "Source" filter dropdown**
3. **Select "POS Sales"** to see only POS transactions

## Step 4: Verify Functionality

### ✅ What You Should See:
- **POS Sales page** with summary cards
- **Sales analytics** and charts
- **Filtering options** (status, payment method, etc.)
- **Search functionality** by customer name
- **Export to CSV** button
- **Sample sales data** (if tables were created successfully)

### ✅ Test Features:
1. **Filter by Status**: Try "Completed", "Pending", etc.
2. **Filter by Payment Method**: Try "Cash", "Card", etc.
3. **Search Customers**: Type a customer name
4. **Export Data**: Click "Export CSV" button
5. **Refresh Data**: Click "Refresh" button

## Step 5: Troubleshooting

### If you see "No POS sales found":
1. **Check database tables**: Ensure `sales_orders` table exists
2. **Check sample data**: Verify sample sales were inserted
3. **Check console errors**: Look for any JavaScript errors

### If you see "relation does not exist":
1. **Run the SQL script** in Supabase dashboard
2. **Verify table creation**: Check if tables exist in database
3. **Restart development server**: `npm run dev`

### If navigation doesn't work:
1. **Check route configuration**: Ensure `/pos-sales` route is added
2. **Check role permissions**: Ensure you have admin/customer-care role
3. **Clear browser cache**: Hard refresh the page

## 🎉 Success Indicators

You'll know the POS Sales page is active when you see:

✅ **Navigation menu** shows "POS Sales" link
✅ **Direct URL** `/pos-sales` loads the page
✅ **Sample data** appears in the sales table
✅ **Analytics charts** display properly
✅ **Filters work** correctly
✅ **Export functionality** works
✅ **No console errors** in browser

## 🚀 Next Steps

Once the page is active, you can:

1. **Add real POS sales data** through your POS system
2. **Customize the analytics** and charts
3. **Add more filtering options** as needed
4. **Integrate with other parts** of your app
5. **Export data** for external analysis

---

**The POS Sales page is now ready to use!** 🎯 