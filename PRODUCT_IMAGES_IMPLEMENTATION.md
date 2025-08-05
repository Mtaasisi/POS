# Product Images Implementation

This implementation adds product images to the inventory system and POS, with database storage for thumbnails.

## 🚀 Features Added

### 1. Database Structure
- **product_images table**: Stores image metadata and URLs
- **Supabase Storage**: Stores actual image files
- **Thumbnail support**: Optimized images for faster loading
- **Primary image system**: One image per product marked as primary

### 2. Inventory Enhancements
- **Product cards**: Now display product images in grid view
- **Image fallback**: Shows package icon when no image is available
- **Error handling**: Graceful fallback for broken image links

### 3. POS Integration
- **AdvancedInventory component**: Shows product images in POS inventory
- **Database-driven**: Uses the same image system as inventory
- **Thumbnail optimization**: Fast loading for POS operations

### 4. Image Upload Component
- **Drag & drop**: Easy image upload interface
- **Multiple images**: Support for up to 5 images per product
- **Primary image selection**: Set which image appears first
- **Image preview**: See uploaded images immediately

## 📋 Setup Instructions

### 1. Database Setup
```bash
# Run the setup script
./run_product_images_setup.sh
```

### 2. Supabase Storage Setup
1. Go to your Supabase dashboard
2. Navigate to Storage
3. Create a new bucket named `product-images`
4. Set the bucket to public
5. Configure RLS policies if needed

### 3. SQL Script
Run the following SQL in your Supabase SQL Editor:

```sql
-- Setup Product Images Table
-- This script creates the product_images table for storing product images and thumbnails

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create product_images table
CREATE TABLE IF NOT EXISTS product_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    uploaded_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_is_primary ON product_images(is_primary);
CREATE INDEX IF NOT EXISTS idx_product_images_created_at ON product_images(created_at);

-- Create a unique constraint to ensure only one primary image per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_images_primary_unique 
ON product_images(product_id) WHERE is_primary = true;

-- Create RLS policies for product_images table
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view product images
CREATE POLICY "Users can view product images" ON product_images
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for authenticated users to insert product images
CREATE POLICY "Users can insert product images" ON product_images
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update their own product images
CREATE POLICY "Users can update product images" ON product_images
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for authenticated users to delete their own product images
CREATE POLICY "Users can delete product images" ON product_images
    FOR DELETE USING (auth.role() = 'authenticated');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_product_images_updated_at
    BEFORE UPDATE ON product_images
    FOR EACH ROW
    EXECUTE FUNCTION update_product_images_updated_at();

-- Add images column to products table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'images'
    ) THEN
        ALTER TABLE products ADD COLUMN images TEXT[];
    END IF;
END $$;
```

## 🔧 API Functions

### Product Images API (`src/lib/productImagesApi.ts`)

```typescript
// Upload a product image
uploadProductImage(productId: string, file: File, userId: string, isPrimary: boolean)

// Get all images for a product
getProductImages(productId: string)

// Set primary image
setPrimaryImage(productId: string, imageId: string)

// Delete an image
deleteProductImage(imageId: string, imageUrl: string)

// Get primary image
getPrimaryImage(productId: string)
```

### Updated Inventory API

The `getProducts()` function now includes product images:

```typescript
// Returns products with images array
const products = await getProducts();
// products[0].images = ['https://...', 'https://...']
```

## 🎨 UI Components

### ImageUpload Component (`src/components/ui/ImageUpload.tsx`)

Features:
- Drag & drop interface
- Multiple image support
- Primary image selection
- Image preview grid
- Error handling

Usage:
```tsx
<ImageUpload
  images={productImages}
  onImagesChange={setProductImages}
  maxImages={5}
  disabled={false}
/>
```

## 📱 Updated Pages

### Inventory Page (`src/pages/InventoryPage.tsx`)
- Grid view now shows product images
- Fallback to package icon when no image
- Error handling for broken images

### POS AdvancedInventory (`src/components/pos/AdvancedInventory.tsx`)
- Product cards display images
- Same fallback system as inventory
- Optimized for POS workflow

## 🗄️ Database Schema

### product_images Table
```sql
CREATE TABLE product_images (
    id UUID PRIMARY KEY,
    product_id UUID REFERENCES products(id),
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    uploaded_by UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

### products Table (Updated)
- Added `images TEXT[]` column for backward compatibility

## 🔒 Security

- **RLS Policies**: Proper access control for product images
- **Storage Security**: Images stored in Supabase Storage with proper permissions
- **File Validation**: Only image files allowed
- **Size Limits**: Configurable file size limits

## 🚀 Performance Optimizations

1. **Thumbnail System**: Smaller images for faster loading
2. **Lazy Loading**: Images load as needed
3. **Error Fallbacks**: Graceful handling of missing images
4. **Caching**: Browser caching for repeated images

## 🔄 Migration Path

For existing products:
1. Run the SQL setup script
2. Existing products will work without images
3. Add images through the product edit interface
4. Images will appear in both inventory and POS

## 🐛 Troubleshooting

### Common Issues

1. **Images not showing**: Check Supabase Storage bucket permissions
2. **Upload errors**: Verify RLS policies are correct
3. **Performance issues**: Ensure thumbnails are being generated
4. **Missing images**: Check if product_images table exists

### Debug Steps

1. Check browser console for errors
2. Verify Supabase Storage bucket exists
3. Test RLS policies in Supabase dashboard
4. Check network tab for failed image requests

## 📈 Future Enhancements

1. **Image Compression**: Automatic image optimization
2. **CDN Integration**: Faster image delivery
3. **Bulk Upload**: Upload multiple images at once
4. **Image Editing**: Crop and resize functionality
5. **AI Tagging**: Automatic product categorization

## 🎯 Usage Examples

### Adding Images to a Product
```typescript
import { uploadProductImage } from '../lib/productImagesApi';

// Upload a product image
const image = await uploadProductImage(
  productId,
  file,
  userId,
  true // Set as primary
);
```

### Displaying Product Images
```tsx
// In a product card
{product.images && product.images.length > 0 ? (
  <img src={product.images[0]} alt={product.name} />
) : (
  <PackageIcon />
)}
```

This implementation provides a complete product image system that integrates seamlessly with both inventory management and POS operations, using database storage for reliable and scalable image management. 