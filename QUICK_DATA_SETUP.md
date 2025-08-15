# Quick Data Setup Guide

## Why You Don't See Products and Customers in POS

The POS system is connected to real data, but there's no data in the database yet. Here's how to add sample data quickly:

## Option 1: Manual Database Entry (Quickest)

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `jxhzveborezjhsmzsgbc`
3. Navigate to **Table Editor**

### Step 2: Add Categories
1. Click on `lats_categories` table
2. Click **Insert row**
3. Add these categories one by one:

```
Name: Smartphones
Description: Mobile phones and accessories
Color: #3B82F6
```

```
Name: Laptops
Description: Portable computers
Color: #10B981
```

```
Name: Accessories
Description: Phone and computer accessories
Color: #EF4444
```

### Step 3: Add Brands
1. Click on `lats_brands` table
2. Click **Insert row**
3. Add these brands:

```
Name: Apple
Description: Apple Inc. products
Website: https://apple.com
```

```
Name: Samsung
Description: Samsung Electronics
Website: https://samsung.com
```

```
Name: Dell
Description: Dell Technologies
Website: https://dell.com
```

### Step 4: Add Suppliers
1. Click on `lats_suppliers` table
2. Click **Insert row**
3. Add at least one supplier:

```
Name: Tech Supplies Ltd
Contact Person: John Doe
Email: john@techsupplies.com
Phone: +254700000000
Address: Nairobi, Kenya
```

### Step 5: Add Products
1. Click on `lats_products` table
2. Click **Insert row**
3. Add these products (use the IDs from categories and brands):

```
Name: iPhone 14 Pro
Description: Latest iPhone with advanced camera system
Category ID: [Select Smartphones from dropdown]
Brand ID: [Select Apple from dropdown]
Supplier ID: [Select Tech Supplies Ltd from dropdown]
Images: []
Tags: ["smartphone", "apple", "5g"]
Is Active: true
```

```
Name: Samsung Galaxy S23
Description: Premium Android smartphone
Category ID: [Select Smartphones from dropdown]
Brand ID: [Select Samsung from dropdown]
Supplier ID: [Select Tech Supplies Ltd from dropdown]
Images: []
Tags: ["smartphone", "samsung", "5g"]
Is Active: true
```

### Step 6: Add Product Variants (with Stock)
1. Click on `lats_product_variants` table
2. Click **Insert row**
3. Add these variants:

```
Product ID: [Select iPhone 14 Pro from dropdown]
SKU: IPH14P-128-BLK
Name: 128GB Black
Attributes: {"storage": "128GB", "color": "Black"}
Cost Price: 120000
Selling Price: 159999
Quantity: 25
Min Quantity: 5
Barcode: 1234567890123
```

```
Product ID: [Select iPhone 14 Pro from dropdown]
SKU: IPH14P-256-BLK
Name: 256GB Black
Attributes: {"storage": "256GB", "color": "Black"}
Cost Price: 135000
Selling Price: 179999
Quantity: 15
Min Quantity: 3
Barcode: 1234567890124
```

```
Product ID: [Select Samsung Galaxy S23 from dropdown]
SKU: SAMS23-256-BLK
Name: 256GB Black
Attributes: {"storage": "256GB", "color": "Black"}
Cost Price: 95000
Selling Price: 129999
Quantity: 30
Min Quantity: 8
Barcode: 1234567890125
```

## Option 2: Use Application UI (Alternative)

1. **Open your application** in the browser (should be running on localhost:5173)
2. **Navigate to LATS/Inventory Management** section
3. **Add data through the UI:**
   - Categories
   - Brands
   - Suppliers
   - Products
   - Product Variants

## Test the POS System

After adding the data:

1. **Refresh your application**
2. **Navigate to the POS section**
3. **Search for products** like "iPhone" or "Samsung"
4. **You should now see products with stock quantities**
5. **Test adding items to cart and processing sales**

## Expected Results

Once you add the sample data, you should see:

- ✅ **Products in the POS search**
- ✅ **Stock quantities displayed**
- ✅ **Prices shown correctly**
- ✅ **Ability to add items to cart**
- ✅ **Real-time stock updates**

## Troubleshooting

If you still don't see products:

1. **Check the browser console** for any errors
2. **Verify data was added** in Supabase Table Editor
3. **Refresh the application** completely
4. **Check network tab** for API calls to Supabase

## Quick SQL Commands (Advanced)

If you're comfortable with SQL, you can also run these commands in the Supabase SQL Editor:

```sql
-- Add categories
INSERT INTO lats_categories (name, description, color) VALUES
('Smartphones', 'Mobile phones and accessories', '#3B82F6'),
('Laptops', 'Portable computers', '#10B981'),
('Accessories', 'Phone and computer accessories', '#EF4444');

-- Add brands
INSERT INTO lats_brands (name, description) VALUES
('Apple', 'Apple Inc. products'),
('Samsung', 'Samsung Electronics'),
('Dell', 'Dell Technologies');

-- Add suppliers
INSERT INTO lats_suppliers (name, contact_person, email, phone) VALUES
('Tech Supplies Ltd', 'John Doe', 'john@techsupplies.com', '+254700000000');
```

---

**Note**: Once you add this sample data, your POS system will show real products with actual stock quantities, and you can test the complete sales workflow!
