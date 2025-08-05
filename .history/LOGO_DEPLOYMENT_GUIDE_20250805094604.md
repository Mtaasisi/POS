# Logo Deployment Guide

This guide explains how to handle brand logos when deploying your application to hosting.

## 🏗️ Current Setup

### Development Mode (Local)
- Logos are stored as base64 data in the database
- Immediate preview and functionality
- No external file hosting required

### Production Mode (Hosted)
- Logos are uploaded to Supabase Storage bucket: `brand-assets`
- Public URLs are stored in the database
- Optimized for hosting performance

## 📁 File Structure

```
src/lib/fileUploadService.ts    # File upload service
migrate-logos-to-hosting.mjs   # Migration script
create-brand-storage-bucket.mjs # Storage bucket setup
```

## 🚀 Deployment Steps

### 1. Prepare Storage Bucket
```bash
# Run the storage bucket setup
node create-brand-storage-bucket.mjs
```

### 2. Deploy Your Application
Deploy your application to your hosting platform (Vercel, Netlify, etc.)

### 3. Migrate Existing Logos (Optional)
If you have existing base64 logos that you want to convert to hosted URLs:

```bash
# Run the migration script
node migrate-logos-to-hosting.mjs
```

## 🔧 How It Works

### Development Mode Detection
The system automatically detects if you're in development mode:
- `localhost` or `127.0.0.1` → Development mode (base64)
- Any other domain → Production mode (hosted URLs)

### File Upload Process
1. **Development**: File → Base64 → Database
2. **Production**: File → Supabase Storage → Public URL → Database

### File Management
- **File Size Limit**: 2MB (optimized for hosting)
- **Supported Formats**: JPEG, PNG, SVG, WebP
- **Storage Path**: `brand-assets/brand-logos/`
- **File Naming**: `{timestamp}-{brand-name}.{extension}`

## 📊 Benefits

### Development
- ✅ Fast local development
- ✅ No external dependencies
- ✅ Immediate preview
- ✅ No upload delays

### Production
- ✅ Optimized file sizes
- ✅ CDN delivery
- ✅ Better performance
- ✅ Reduced database size
- ✅ Automatic cleanup of old files

## 🛠️ Configuration

### Environment Variables
Make sure your Supabase configuration is set up in your hosting environment:

```env
VITE_SUPABASE_URL=https://jxhzveborezjhsmzsgbc.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Storage Bucket Settings
- **Bucket Name**: `brand-assets`
- **Public Access**: ✅ Enabled
- **File Size Limit**: 2MB
- **Allowed Types**: image/jpeg, image/png, image/svg+xml, image/webp

## 🔄 Migration Process

### Automatic Migration
The migration script will:
1. Find all brands with base64 logos
2. Convert base64 to files
3. Upload to Supabase Storage
4. Update database with new URLs
5. Clean up old base64 data

### Manual Migration
If you prefer manual migration:

1. Export your brands data
2. Convert base64 logos to files
3. Upload files to Supabase Storage
4. Update database URLs
5. Deploy updated application

## 🧪 Testing

### Local Testing
```bash
# Test file upload service
npm run dev
# Upload a logo in development mode
```

### Production Testing
```bash
# Deploy to staging
# Test logo uploads in production mode
# Verify hosted URLs work correctly
```

## 🚨 Troubleshooting

### Common Issues

1. **Upload Fails**
   - Check Supabase storage bucket exists
   - Verify file size < 2MB
   - Check file format is supported

2. **Migration Fails**
   - Ensure Supabase credentials are correct
   - Check storage bucket permissions
   - Verify network connectivity

3. **Logos Not Displaying**
   - Check if URLs are accessible
   - Verify CORS settings
   - Check browser console for errors

### Debug Commands
```bash
# Check storage bucket
node create-brand-storage-bucket.mjs

# Test migration
node migrate-logos-to-hosting.mjs

# Check Supabase connection
# Test in browser console
```

## 📈 Performance Optimization

### File Optimization
- Compress images before upload
- Use appropriate formats (PNG for logos, JPEG for photos)
- Keep file sizes under 2MB

### CDN Benefits
- Global content delivery
- Automatic caching
- Reduced load times
- Better user experience

## 🔒 Security

### Storage Security
- Public read access for logos
- No sensitive data in logos
- File type validation
- Size limits enforced

### URL Security
- Supabase handles URL generation
- No direct file access
- Automatic cleanup on deletion

## 📝 Maintenance

### Regular Tasks
- Monitor storage usage
- Clean up unused files
- Update file size limits if needed
- Backup important logos

### Monitoring
- Check upload success rates
- Monitor file access patterns
- Track storage costs
- Review performance metrics

---

**Note**: This system automatically handles the transition between development and production modes, ensuring a smooth deployment experience. 