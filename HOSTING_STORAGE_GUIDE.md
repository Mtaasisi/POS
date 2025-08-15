# 🏠 Hosting Storage Guide for LATS

## 📋 Overview

This guide will help you set up local image storage on your hosting server for the LATS application. This approach stores images directly on your hosting server instead of using cloud storage services.

## 🎯 Benefits of Hosting Storage

✅ **Cost Effective** - No additional cloud storage costs  
✅ **Fast Access** - Images served directly from your server  
✅ **Full Control** - Complete control over your image files  
✅ **Simple Setup** - Works with any standard hosting provider  
✅ **No External Dependencies** - No reliance on third-party services  

## 🚀 Quick Setup

### Step 1: Run the Setup Script

On your hosting server, run:
```bash
chmod +x setup-hosting-storage.sh
./setup-hosting-storage.sh
```

### Step 2: Upload the PHP Handler

Upload `server-brand-upload-handler.php` to your `public_html` directory.

### Step 3: Configure Database

Edit `server-brand-upload-handler.php` and update the database credentials:
```php
$dbConfig = [
    'host' => 'your_database_host',
    'dbname' => 'your_database_name',
    'username' => 'your_database_username',
    'password' => 'your_database_password'
];
```

### Step 4: Test the Setup

Visit `https://yourdomain.com/uploads/test.txt` to verify the setup worked.

## 📁 Directory Structure

After setup, you'll have this structure:
```
/public_html/
├── uploads/
│   ├── brands/          # Brand logos
│   ├── products/        # Product images
│   ├── thumbnails/      # Image thumbnails
│   └── .htaccess        # Security rules
├── server-brand-upload-handler.php
└── your-app-files/
```

## 🔧 How It Works

### Development Mode
- Images are stored as base64 strings in the database
- No actual files are created
- Perfect for testing and development

### Production Mode
- Images are uploaded to your hosting server
- Files are stored in organized directories
- URLs are generated and stored in the database
- Images are served directly from your server

## 📤 Upload Process

1. **User selects an image** in the brand management interface
2. **File is validated** (type, size, etc.)
3. **Image is uploaded** to your hosting server via PHP handler
4. **Database is updated** with the image URL
5. **Image is displayed** in the interface

## 🔗 Image URLs

Your images will be accessible at:
- **Brand Logos:** `https://yourdomain.com/uploads/brands/brand-name_timestamp_random.jpg`
- **Product Images:** `https://yourdomain.com/uploads/products/product-id_timestamp_random.jpg`

## 🔒 Security Features

- **File Type Validation** - Only image files allowed
- **Size Limits** - Maximum 5MB per file
- **Safe Filenames** - Prevents path traversal attacks
- **Directory Protection** - .htaccess prevents script execution
- **Authentication** - Only authenticated users can upload

## 🛠️ Configuration Options

### Environment Variables

Add to your `.env` file:
```env
VITE_STORAGE_MODE=local
VITE_UPLOAD_BASE_URL=https://yourdomain.com/uploads
```

### File Size Limits

Edit the PHP handler to change limits:
```php
$maxFileSize = 10 * 1024 * 1024; // 10MB
```

### Allowed File Types

Modify the allowed types:
```php
$allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
```

## 📊 Database Schema

The system uses these database columns:
- `logo` - Stores the file path
- `logo_url` - Stores the public URL
- `local_path` - Stores the server file path (optional)

## 🔄 Migration from Cloud Storage

If you're migrating from Supabase storage:

1. **Export existing images** from Supabase
2. **Upload to hosting server** using the new system
3. **Update database records** with new URLs
4. **Test thoroughly** before switching

## 🚨 Troubleshooting

### Common Issues

**Upload fails with 500 error:**
- Check PHP file permissions
- Verify database credentials
- Check server error logs

**Images not displaying:**
- Verify .htaccess is working
- Check file permissions (644 for files, 755 for directories)
- Ensure URLs are correct

**Permission denied:**
- Run the setup script again
- Check server file permissions
- Contact hosting provider

### Debug Mode

Enable debug logging in the PHP handler:
```php
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

## 📞 Support

For assistance with hosting setup:
- **Phone:** 0712378850
- **Email:** support@yourdomain.com

## 🔄 Backup Strategy

### Regular Backups
- **Daily:** Database backup
- **Weekly:** Full uploads directory backup
- **Monthly:** Complete server backup

### Backup Commands
```bash
# Database backup
mysqldump -u username -p database_name > backup.sql

# Files backup
tar -czf uploads-backup.tar.gz /public_html/uploads/

# Full server backup
tar -czf server-backup.tar.gz /public_html/
```

## 🎉 Success!

Once setup is complete, your LATS application will:
- Store all images locally on your hosting server
- Serve images quickly and reliably
- Maintain full control over your data
- Reduce costs compared to cloud storage

Your images will be accessible, secure, and performant!
