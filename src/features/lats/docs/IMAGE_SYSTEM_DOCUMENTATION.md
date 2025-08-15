# LATS Product Image System Documentation

## Overview
This document describes the current working image system for LATS products. The system is designed to handle product image uploads, storage, and management with proper validation and database integration.

## System Architecture

### Components
1. **ImageUpload Component** (`src/components/ImageUpload.tsx`)
   - Handles file selection and validation
   - Supports drag and drop functionality
   - Shows upload progress
   - Validates file types and sizes

2. **ImageGallery Component** (`src/components/ImageGallery.tsx`)
   - Displays uploaded images
   - Allows image deletion
   - Supports setting primary images
   - Shows image management interface

3. **ImageUploadService** (`src/lib/imageUpload.ts`)
   - Handles backend upload logic
   - Manages database records
   - Provides image retrieval functions
   - Handles temporary storage for new products

4. **LocalProductImageStorageService** (`src/lib/localProductImageStorage.ts`)
   - Manages local file storage
   - Handles file path generation
   - Provides development mode support

5. **Database Schema** (`supabase/migrations/20241201000002_create_product_images_table.sql`)
   - `product_images` table with proper structure
   - Row Level Security (RLS) policies
   - Indexes for performance
   - Triggers for data integrity

## Current Working Configuration

### File Upload Settings
- **Maximum file size**: 10MB
- **Allowed file types**: JPEG, JPG, PNG, WebP, GIF
- **Maximum files per product**: 5
- **Validation**: File type and size validation enabled

### Storage Settings
- **Base upload path**: `/public/uploads/products`
- **Base thumbnail path**: `/public/uploads/thumbnails`
- **Base URL path**: `/uploads/products`
- **Base thumbnail URL path**: `/uploads/thumbnails`

### Database Settings
- **Table name**: `product_images`
- **Primary key**: `id` (UUID)
- **Product ID field**: `product_id` (UUID, foreign key to `lats_products`)
- **Image URL field**: `image_url` (TEXT)
- **Thumbnail URL field**: `thumbnail_url` (TEXT)
- **File name field**: `file_name` (TEXT)
- **File size field**: `file_size` (INTEGER)
- **Primary image field**: `is_primary` (BOOLEAN)
- **Uploaded by field**: `uploaded_by` (UUID)
- **Created at field**: `created_at` (TIMESTAMP)
- **Updated at field**: `updated_at` (TIMESTAMP)

### UI Settings
- **Upload progress**: Enabled
- **File validation**: Enabled
- **Drag and drop**: Enabled
- **Image preview**: Enabled
- **Image reordering**: Disabled (not implemented)
- **Delete confirmation**: Enabled

### Development Settings
- **Local storage**: Enabled
- **Temporary storage**: Enabled
- **Debug logging**: Enabled
- **Mock upload delay**: 0ms

## Database Schema Details

### Table Structure
```sql
CREATE TABLE IF NOT EXISTS product_images (
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

### Indexes
- `idx_product_images_product_id` on `product_id`
- `idx_product_images_is_primary` on `is_primary`
- `idx_product_images_created_at` on `created_at`

### Triggers
- `update_product_images_updated_at` - Updates `updated_at` on row update
- `ensure_single_primary_image_trigger` - Ensures only one primary image per product

### RLS Policies
- **View**: Allow authenticated users to view product images
- **Insert**: Allow authenticated users to insert product images
- **Update**: Allow authenticated users to update product images
- **Delete**: Allow authenticated users to delete product images

## Usage Examples

### Adding Images to a Product
```typescript
import { ImageUpload } from '../../../../components/ImageUpload';

<ImageUpload
  productId={productId}
  userId={userId}
  onUploadComplete={(images) => {
    console.log('Uploaded images:', images);
  }}
  onUploadError={(error) => {
    console.error('Upload error:', error);
  }}
  maxFiles={5}
/>
```

### Displaying Product Images
```typescript
import { ImageGallery } from '../../../../components/ImageGallery';

<ImageGallery
  productId={productId}
  onImagesChange={(images) => {
    console.log('Images changed:', images);
  }}
/>
```

### Using the Configuration
```typescript
import { IMAGE_SYSTEM_CONFIG, ImageSystemValidator } from '../config/imageSystemConfig';

// Validate a file
const validation = ImageSystemValidator.validateFile(file);
if (!validation.valid) {
  console.error('File validation failed:', validation.error);
}

// Check configuration
console.log('Max file size:', IMAGE_SYSTEM_CONFIG.maxFileSize);
console.log('Allowed types:', IMAGE_SYSTEM_CONFIG.allowedFileTypes);
```

## File Upload Process

1. **File Selection**: User selects files through file input or drag and drop
2. **Validation**: Files are validated for type and size
3. **Temporary Storage**: For new products, images are stored temporarily
4. **Database Record**: Image metadata is stored in `product_images` table
5. **File Storage**: Images are stored in the configured storage paths
6. **URL Generation**: Public URLs are generated for image access

## Image Management Features

### Primary Image
- Only one image can be primary per product
- Primary image is automatically set for the first upload
- Users can change the primary image through the gallery interface

### Image Deletion
- Images can be deleted individually
- Deletion requires confirmation
- Deleted images are removed from storage and database

### Thumbnail Support
- Currently uses the same URL for thumbnails
- Thumbnail generation can be enabled in configuration
- Separate thumbnail paths are configured for future use

## Error Handling

### Common Errors
- **File too large**: Exceeds 10MB limit
- **Invalid file type**: Not in allowed types list
- **Upload failed**: Network or storage issues
- **Database error**: RLS policy or constraint violations

### Error Recovery
- Failed uploads are reported to the user
- Temporary files are cleaned up automatically
- Database transactions are rolled back on failure

## Performance Considerations

### File Size Limits
- 10MB maximum per file
- 5 files maximum per product
- Total storage per product: ~50MB

### Database Performance
- Indexes on frequently queried fields
- Cascade deletes for product removal
- Efficient primary image queries

### Storage Performance
- Local file storage for development
- Organized file structure by product ID
- Efficient URL generation

## Security Features

### Authentication
- All operations require authenticated users
- User ID is tracked for uploads
- RLS policies enforce access control

### File Validation
- File type validation prevents malicious uploads
- File size limits prevent abuse
- Safe filename generation

### Data Integrity
- Foreign key constraints
- Trigger-based data validation
- Automatic timestamp updates

## Development Mode Features

### Local Storage
- Files stored locally during development
- No external storage dependencies
- Easy debugging and testing

### Temporary Storage
- Support for temporary product IDs
- Images stored until product is saved
- Automatic cleanup of temporary files

### Debug Logging
- Detailed upload process logging
- Error tracking and reporting
- Performance monitoring

## Future Enhancements

### Planned Features
- Image reordering functionality
- Automatic thumbnail generation
- Image compression and optimization
- Bulk image operations
- Image search and filtering

### Configuration Options
- Configurable file size limits
- Custom storage providers
- Advanced validation rules
- UI customization options

## Troubleshooting

### Common Issues
1. **Upload fails**: Check file size and type
2. **Images not displaying**: Verify storage paths and permissions
3. **Database errors**: Check RLS policies and authentication
4. **Performance issues**: Review file sizes and database indexes

### Debug Tools
- Browser developer tools for network issues
- Database logs for RLS policy violations
- Storage logs for file access problems
- Console logs for JavaScript errors

## Maintenance

### Regular Tasks
- Monitor storage usage
- Clean up orphaned files
- Update database indexes
- Review and update RLS policies

### Backup Considerations
- Database backup includes image metadata
- File storage backup required separately
- Consider image compression for backups

## Conclusion

The current image system is working well and provides a solid foundation for product image management. The configuration is documented and can be easily maintained or extended as needed. All components are properly integrated and follow best practices for security, performance, and user experience.
