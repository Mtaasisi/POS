# 🔧 Fix for 400 Error: "File type not supported" on Image Upload

## 🎯 **Problem Identified**

Your image upload is failing with a **400 Bad Request** error saying "File type not supported. Please use JPEG, PNG, or WebP." This happens even though PNG files should be supported.

## 🔍 **Root Cause**

The issue is likely one of these:

1. **Missing Storage Bucket**: The `product-images` bucket doesn't exist in Supabase
2. **Incorrect MIME Type Configuration**: The bucket doesn't allow PNG files
3. **Storage Policies**: Missing or incorrect RLS policies
4. **Authentication Issues**: User not properly authenticated

## ✅ **Solution Steps**

### Step 1: Fix Storage Bucket Configuration

**Run this SQL in your Supabase Dashboard SQL Editor:**

```sql
-- Go to: https://supabase.com/dashboard/project/jxhzveborezjhsmzsgbc/sql
-- Copy and paste the entire content of check-and-fix-storage-bucket.sql
```

This script will:
- ✅ Create the `product-images` bucket if it doesn't exist
- ✅ Configure it to allow PNG, JPEG, WebP, and other image types
- ✅ Set up proper storage policies
- ✅ Make the bucket publicly readable

### Step 2: Test the Configuration

**In your browser console, run:**

```javascript
// Import and test the storage configuration
import { testStorageBucket } from './src/lib/storageTest.js';
testStorageBucket().then(result => console.log('Storage test result:', result));
```

### Step 3: Try Uploading Again

1. **Go to your application**
2. **Add or edit a product**
3. **Upload a PNG image**
4. **Check the browser console** for detailed error messages

## 🔧 **Alternative: Manual Bucket Setup**

If the SQL script doesn't work, manually create the bucket:

1. **Go to Supabase Dashboard**
2. **Navigate to Storage**
3. **Click "Create a new bucket"**
4. **Set bucket name:** `product-images`
5. **Check "Public bucket"**
6. **Set file size limit:** 50MB
7. **Add allowed MIME types:**
   - `image/jpeg`
   - `image/jpg`
   - `image/png`
   - `image/webp`
   - `image/gif`

## 🧪 **Debugging Steps**

### Check 1: Verify Bucket Exists
```sql
SELECT * FROM storage.buckets WHERE id = 'product-images';
```

### Check 2: Verify MIME Types
```sql
SELECT allowed_mime_types FROM storage.buckets WHERE id = 'product-images';
```

### Check 3: Check Storage Policies
```sql
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%product_images%';
```

## 🚨 **Common Issues & Solutions**

### Issue 1: "Bucket not found"
**Solution:** Run the SQL script to create the bucket

### Issue 2: "Permission denied"
**Solution:** Check that storage policies are created correctly

### Issue 3: "Authentication failed"
**Solution:** Make sure user is logged in and authenticated

### Issue 4: "File type not supported"
**Solution:** Verify MIME types are configured in the bucket

## 📊 **Expected Results**

After running the fix:

1. ✅ **Storage bucket exists** with correct configuration
2. ✅ **MIME types include PNG** and other image formats
3. ✅ **Storage policies allow** authenticated uploads
4. ✅ **Image uploads work** without 400 errors
5. ✅ **Images appear** in the database and UI

## 🔄 **If Still Not Working**

1. **Check browser console** for detailed error messages
2. **Verify Supabase credentials** are correct
3. **Test with a different image** (JPEG instead of PNG)
4. **Check network tab** for the actual HTTP request/response
5. **Contact support** with the detailed error logs

## 📝 **Files Modified**

- ✅ `check-and-fix-storage-bucket.sql` - Storage bucket configuration
- ✅ `src/lib/imageUpload.ts` - Improved error handling
- ✅ `src/lib/storageTest.ts` - Enhanced debugging

---

**Need help?** Check the browser console for detailed error messages and share them for further assistance.
