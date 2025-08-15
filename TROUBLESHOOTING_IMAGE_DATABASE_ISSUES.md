# Troubleshooting: Images Not Appearing in Database

## 🔍 Issue Identified

The main issue is that your server handlers are configured for **MySQL** but your system uses **Supabase (PostgreSQL)**. This mismatch prevents images from being saved to the database.

## 🚨 Root Cause

In `server-product-upload-handler.php`, the database configuration is:

```php
// WRONG - MySQL configuration
$dbConfig = [
    'host' => 'localhost',
    'dbname' => 'your_database_name',
    'username' => 'your_username',
    'password' => 'your_password'
];

// MySQL connection
$pdo = new PDO(
    "mysql:host={$dbConfig['host']};dbname={$dbConfig['dbname']};charset=utf8mb4",
    $dbConfig['username'],
    $dbConfig['password']
);
```

But you need **PostgreSQL** connection for Supabase:

```php
// CORRECT - PostgreSQL configuration for Supabase
$supabaseConfig = [
    'db_host' => 'db.your-project.supabase.co',
    'db_name' => 'postgres',
    'db_user' => 'postgres',
    'db_password' => 'your-db-password',
    'db_port' => '5432'
];

// PostgreSQL connection
$pdo = new PDO(
    "pgsql:host={$supabaseConfig['db_host']};port={$supabaseConfig['db_port']};dbname={$supabaseConfig['db_name']};sslmode=require",
    $supabaseConfig['db_user'],
    $supabaseConfig['db_password']
);
```

## 🔧 Solutions

### Option 1: Use the Fixed Server Handler (Recommended)

1. **Replace the existing handler**:
   ```bash
   cp server-product-upload-handler-fixed.php server-product-upload-handler.php
   ```

2. **Update the Supabase configuration** in the new file:
   ```php
   $supabaseConfig = [
       'url' => 'https://your-project.supabase.co',
       'key' => 'your-anon-key',
       'db_host' => 'db.your-project.supabase.co',
       'db_name' => 'postgres',
       'db_user' => 'postgres',
       'db_password' => 'your-db-password', // Get this from Supabase dashboard
       'db_port' => '5432'
   ];
   ```

3. **Get your database password** from Supabase:
   - Go to your Supabase project dashboard
   - Navigate to Settings → Database
   - Copy the database password

### Option 2: Use Supabase Storage Instead (Alternative)

If you prefer to use Supabase storage instead of local storage:

1. **Update the ImageUpload component** to use Supabase storage
2. **Remove the server handlers** entirely
3. **Use the existing `imageUpload.ts` service**

## 📋 Step-by-Step Fix

### Step 1: Check Database Setup

Run this diagnostic script in your Supabase SQL Editor:

```sql
-- Run diagnose-database-issue.sql
-- This will check if the product_images table exists and has proper structure
```

### Step 2: Update Server Handler

1. **Backup your current handler**:
   ```bash
   cp server-product-upload-handler.php server-product-upload-handler-backup.php
   ```

2. **Use the fixed version**:
   ```bash
   cp server-product-upload-handler-fixed.php server-product-upload-handler.php
   ```

3. **Update the configuration** with your actual Supabase details

### Step 3: Test the Fix

1. **Upload a test image** through your application
2. **Check the database** for new records:
   ```sql
   SELECT * FROM product_images ORDER BY created_at DESC LIMIT 5;
   ```

3. **Check the uploads directory**:
   ```bash
   ls -la public/uploads/products/
   ```

## 🔍 Diagnostic Commands

### Check if Database Table Exists

```sql
-- Run in Supabase SQL Editor
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_images') 
        THEN '✅ product_images table EXISTS' 
        ELSE '❌ product_images table DOES NOT EXIST' 
    END as table_status;
```

### Check for Existing Images

```sql
-- Check if any images exist
SELECT COUNT(*) as total_images FROM product_images;

-- Show recent images
SELECT 
    id, 
    product_id, 
    file_name, 
    file_size, 
    is_primary, 
    created_at 
FROM product_images 
ORDER BY created_at DESC 
LIMIT 5;
```

### Check Products Table

```sql
-- Check if products exist
SELECT COUNT(*) as total_products FROM lats_products;

-- Show sample products
SELECT id, name, created_at FROM lats_products LIMIT 5;
```

## 🐛 Common Issues and Solutions

### Issue 1: "Table product_images does not exist"

**Solution**: Run the migration script:
```sql
-- Run setup-image-system.sql in Supabase SQL Editor
```

### Issue 2: "Connection failed"

**Solution**: Check your Supabase database credentials:
1. Go to Supabase Dashboard → Settings → Database
2. Copy the correct connection details
3. Update the server handler configuration

### Issue 3: "Permission denied"

**Solution**: Check RLS policies:
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'product_images';
```

### Issue 4: "Foreign key constraint failed"

**Solution**: Ensure the product exists first:
```sql
-- Check if the product exists
SELECT * FROM lats_products WHERE id = 'your-product-id';
```

## 🧪 Testing the Fix

### Test 1: Manual Database Insert

```sql
-- Test inserting a record manually
INSERT INTO product_images (
    product_id, 
    image_url, 
    file_name, 
    file_size, 
    is_primary
) VALUES (
    'your-product-id',
    '/uploads/products/test.jpg',
    'test.jpg',
    1024,
    true
);
```

### Test 2: Check File Upload

1. **Upload an image** through your application
2. **Check the response** in browser developer tools
3. **Verify the file** exists in `public/uploads/products/`
4. **Check the database** for the new record

### Test 3: Check Image Display

1. **Refresh your product page**
2. **Check if images appear**
3. **Verify image URLs** are correct

## 📊 Expected Results

After fixing the database connection:

1. **Images should be saved** to `public/uploads/products/`
2. **Database records should be created** in `product_images` table
3. **Images should display** in your application
4. **Thumbnails should be generated** in `public/uploads/thumbnails/`

## 🔄 Alternative: Use Supabase Storage

If you prefer to use Supabase storage instead of local storage:

1. **Update your environment variables**:
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Use the existing Supabase storage service** in `src/lib/imageUpload.ts`

3. **Remove the server handlers** entirely

4. **Update components** to use Supabase storage

## 📞 Need Help?

If you're still having issues:

1. **Run the diagnostic script** and share the results
2. **Check browser console** for JavaScript errors
3. **Check server logs** for PHP errors
4. **Verify your Supabase credentials** are correct

The main issue is the database connection mismatch - once you fix that, images should start appearing in your database!
