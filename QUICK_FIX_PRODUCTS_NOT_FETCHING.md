# Quick Fix: Products Not Fetching

## Problem
Products are not showing up in the application because of authentication issues with the Supabase database.

## Root Cause
- System is using `supabase` mode (real database)
- No user is authenticated
- RLS policies block data access without authentication
- Database tables are empty

## Quick Fix Options

### Option 1: Switch to Demo Mode (Immediate Fix)

**Edit your `.env` file:**
```bash
# Change this line:
VITE_LATS_DATA_MODE=supabase

# To this:
VITE_LATS_DATA_MODE=demo
```

**Then restart your development server:**
```bash
npm run dev
```

**Result:** ✅ Products will show up immediately with demo data

### Option 2: Fix Authentication (Permanent Fix)

**Create a test user in Supabase Dashboard:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `jxhzveborezjhsmzsgbc`
3. Navigate to **Authentication > Users**
4. Click **"Add User"**
5. Enter:
   - Email: `test@example.com`
   - Password: `password123`
6. Click **"Create User"**

**Then log in to your application:**
1. Open your app
2. Go to login page
3. Use the test credentials above
4. Navigate to LATS features

**Result:** ✅ Products will load from real database

### Option 3: Add Sample Data to Database

**Via Supabase Dashboard:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `jxhzveborezjhsmzsgbc`
3. Navigate to **SQL Editor**
4. Run the sample data script:

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

## Recommended Approach

**For immediate testing:** Use Option 1 (Demo Mode)
**For production:** Use Option 2 (Fix Authentication)

## Test Commands

```bash
# Test current data mode
node scripts/test-pos-products.js

# Test authentication
node scripts/quick-auth-fix.js

# Test price functionality
node scripts/test-price-save-retrieve.js
```

## Expected Results

After applying any of the fixes:
- ✅ Products will show in the product catalog
- ✅ POS system will have products to sell
- ✅ Inventory management will work
- ✅ All LATS features will be functional
