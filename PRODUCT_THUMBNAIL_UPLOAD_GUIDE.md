# Product Thumbnail Upload Implementation Guide

## Overview

This implementation adds comprehensive thumbnail upload functionality to the LATS product management system. Users can now upload product images with automatic thumbnail generation, optimization, and management.

## Features

### ✅ Implemented Features

1. **Automatic Thumbnail Generation**
   - Creates optimized thumbnails (300x300px) from uploaded images
   - Maintains aspect ratio while resizing
   - Converts to WebP format for better compression

2. **Image Optimization**
   - Automatically optimizes images for web display
   - Reduces file sizes while maintaining quality
   - Supports multiple formats (JPG, PNG, WebP, GIF)

3. **Drag & Drop Upload**
   - Intuitive drag and drop interface
   - Multiple file selection support
   - Real-time upload progress

4. **Primary Image Management**
   - First uploaded image automatically becomes primary
   - Users can change primary image
   - Only one primary image per product

5. **Image Management**
   - Delete individual images
   - View image details (file size, dimensions)
   - Reorder images

## Database Schema

### New Table: `product_images`

```sql
CREATE TABLE product_images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES lats_products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    uploaded_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Storage Bucket: `product-images`

- Public bucket for storing product images
- Organized by product ID: `{product_id}/originals/` and `{product_id}/thumbnails/`
- Automatic cleanup when products are deleted

## Setup Instructions

### 1. Apply Database Migration

**Important**: If you encounter trigger errors, use the fixed migration script.

Run the following SQL in your Supabase SQL editor:

```sql
-- Use the fixed migration script to avoid duplicate trigger errors
-- File: apply-product-images-migration-fixed.sql
```

**If you get trigger errors**, run this command first to clean up:

```sql
-- Clean up existing triggers and policies (if needed)
DROP TRIGGER IF EXISTS update_product_images_updated_at ON product_images;
DROP TRIGGER IF EXISTS ensure_single_primary_image_trigger ON product_images;
DROP POLICY IF EXISTS "Allow authenticated users to view product images" ON product_images;
DROP POLICY IF EXISTS "Allow authenticated users to insert product images" ON product_images;
DROP POLICY IF EXISTS "Allow authenticated users to update product images" ON product_images;
DROP POLICY IF EXISTS "Allow authenticated users to delete product images" ON product_images;
```

### 2. Verify Storage Bucket

Ensure the `product-images` storage bucket exists in your Supabase project:
- Go to Storage in Supabase dashboard
- Verify `product-images` bucket exists and is public
- Check that RLS policies are applied

### 3. Test the Implementation

Use the test page to verify functionality:

```typescript
// Navigate to the test page
// This allows you to test image uploads with any product ID
```

## Usage

### Adding Images to Products

1. **Navigate to Add Product Page**
   - Go to `/lats/products/add`
   - Fill in basic product information

2. **Upload Images**
   - Click on the "Media" tab
   - Drag and drop images or click to select files
   - Images are automatically processed and thumbnails generated

3. **Manage Images**
   - First image becomes primary automatically
   - Click star icon to change primary image
   - Click trash icon to delete images
   - View image details on hover

### Image Requirements

- **Supported Formats**: JPG, PNG, WebP, GIF
- **Maximum File Size**: 5MB per image
- **Maximum Images**: 10 per product
- **Recommended Dimensions**: 1200x1200px or larger

### API Usage

```typescript
// Upload a single image
const uploadedImage = await uploadProductImage(
  productId,
  file,
  userId,
  isPrimary
);

// Get all images for a product
const images = await getProductImages(productId);

// Delete an image
await deleteProductImage(imageId, imageUrl, thumbnailUrl);

// Set primary image
await setPrimaryImage(productId, imageId);
```

## Components

### EnhancedImageUpload

The main component for image upload functionality:

```typescript
<EnhancedImageUpload
  images={images}
  onImagesChange={handleImagesChange}
  maxImages={10}
  productId={productId}
  userId={userId}
  showOptimization={true}
/>
```

### ProductForm Integration

The ProductForm now includes image upload in the Media tab:

```typescript
{activeTab === 'media' && (
  <div className="space-y-4">
    <h3>Product Images</h3>
    <Controller
      name="images"
      control={control}
      render={({ field }) => (
        <EnhancedImageUpload
          images={field.value || []}
          onImagesChange={field.onChange}
          // ... other props
        />
      )}
    />
  </div>
)}
```

## File Structure

```
src/
├── lib/
│   ├── productImagesApi.ts          # Image upload API functions
│   ├── thumbnailService.ts          # Thumbnail generation utilities
│   └── latsProductApi.ts            # Product CRUD operations
├── features/
│   ├── shared/components/ui/
│   │   ├── EnhancedImageUpload.tsx  # Main upload component
│   │   └── ImageDisplay.tsx         # Image display component
│   └── lats/
│       ├── components/inventory/
│       │   └── ProductForm.tsx      # Updated with image upload
│       └── pages/
│           ├── AddProductPage.tsx   # Updated with image handling
│           └── ProductImageTestPage.tsx # Test page
└── supabase/
    └── migrations/
        └── 20241201000002_create_product_images_table.sql
```

## Error Handling

The implementation includes comprehensive error handling:

- **File Validation**: Checks file type and size before upload
- **Upload Errors**: Graceful handling of upload failures
- **Network Errors**: Retry mechanisms and user feedback
- **Storage Errors**: Fallback options and cleanup

## Performance Optimizations

1. **Image Optimization**: Automatic compression and format conversion
2. **Thumbnail Generation**: Client-side processing reduces server load
3. **Lazy Loading**: Images load only when needed
4. **Caching**: Browser caching for uploaded images

## Security

- **File Type Validation**: Only allows image files
- **Size Limits**: Prevents large file uploads
- **RLS Policies**: Database-level security
- **Storage Policies**: Bucket-level access control

## Testing

### Manual Testing

1. **Upload Test**: Upload various image types and sizes
2. **Thumbnail Test**: Verify thumbnail generation works correctly
3. **Primary Image Test**: Test primary image selection
4. **Delete Test**: Verify image deletion works
5. **Error Test**: Test with invalid files and network errors

### Test Page

Use the `ProductImageTestPage` component to test functionality:

```typescript
// Navigate to the test page
// Enter a product ID
// Upload images and verify functionality
```

## Troubleshooting

### Common Issues

1. **Upload Fails**
   - Check file size (max 5MB)
   - Verify file type is supported
   - Check network connection

2. **Thumbnails Not Generated**
   - Verify browser supports Canvas API
   - Check console for JavaScript errors

3. **Images Not Displaying**
   - Verify storage bucket permissions
   - Check image URLs in database
   - Verify RLS policies

4. **Database Migration Errors**
   - **Trigger already exists error**: Use the fixed migration script
   - **Policy already exists error**: Run the cleanup commands first
   - **Table already exists**: The migration will skip existing objects

### Database Migration Issues

If you encounter trigger or policy errors during migration:

1. **Use the fixed migration script**: `apply-product-images-migration-fixed.sql`
2. **Clean up existing objects first**:
   ```sql
   DROP TRIGGER IF EXISTS update_product_images_updated_at ON product_images;
   DROP TRIGGER IF EXISTS ensure_single_primary_image_trigger ON product_images;
   DROP POLICY IF EXISTS "Allow authenticated users to view product images" ON product_images;
   DROP POLICY IF EXISTS "Allow authenticated users to insert product images" ON product_images;
   DROP POLICY IF EXISTS "Allow authenticated users to update product images" ON product_images;
   DROP POLICY IF EXISTS "Allow authenticated users to delete product images" ON product_images;
   ```

3. **Verify setup**: Run the verification script `verify-product-images-setup.sql`

### Debug Mode

Enable debug logging by checking browser console for detailed error messages and upload progress.

### Verification

After running the migration, verify everything is set up correctly:

```sql
-- Run the verification script
-- File: verify-product-images-setup.sql
```

This will check:
- Table existence and structure
- Indexes and triggers
- RLS policies
- Storage bucket and policies
- Functions

## Future Enhancements

1. **Bulk Upload**: Upload multiple images simultaneously
2. **Image Editing**: Basic image editing capabilities
3. **CDN Integration**: Use CDN for faster image delivery
4. **Advanced Optimization**: AI-powered image optimization
5. **Image Analytics**: Track image performance and usage

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify database migration was applied correctly
3. Test with the provided test page
4. Review storage bucket configuration
