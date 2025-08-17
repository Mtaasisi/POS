#!/bin/bash

# Product Image Storage Setup Script for LATS
# This script creates the necessary directories and files for product image storage

echo "🚀 Setting up Product Image Storage for LATS..."

# Create upload directories
echo "📁 Creating upload directories..."

# Create main uploads directory
mkdir -p public/uploads
chmod 755 public/uploads

# Create product images directory
mkdir -p public/uploads/products
chmod 755 public/uploads/products

# Create thumbnails directory
mkdir -p public/uploads/thumbnails
chmod 755 public/uploads/thumbnails

# Create brands directory (if not exists)
mkdir -p public/uploads/brands
chmod 755 public/uploads/brands

echo "✅ Upload directories created"

# Create .htaccess file for security
echo "🔒 Creating security .htaccess file..."

cat > public/uploads/.htaccess << 'EOF'
# Security rules for uploads directory
Options -Indexes
Options -ExecCGI

# Allow only image files
<FilesMatch "\.(jpg|jpeg|png|gif|webp|svg)$">
    Order Allow,Deny
    Allow from all
</FilesMatch>

# Deny access to all other files
<FilesMatch "^(?!\.(jpg|jpeg|png|gif|webp|svg)$)">
    Order Deny,Allow
    Deny from all
</FilesMatch>

# Prevent script execution
<FilesMatch "\.(php|php3|php4|php5|phtml|pl|py|jsp|asp|sh|cgi)$">
    Order Deny,Allow
    Deny from all
</FilesMatch>

# Set cache headers for images
<FilesMatch "\.(jpg|jpeg|png|gif|webp|svg)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 month"
    Header set Cache-Control "public, max-age=2592000"
</FilesMatch>
EOF

echo "✅ Security .htaccess file created"

# Create test file to verify setup
echo "🧪 Creating test file..."

cat > public/uploads/test.txt << 'EOF'
Product Image Storage Setup Complete!
This file can be deleted after verification.
EOF

chmod 644 public/uploads/test.txt

echo "✅ Test file created"

# Set proper permissions
echo "🔐 Setting proper permissions..."

find public/uploads -type d -exec chmod 755 {} \;
find public/uploads -type f -exec chmod 644 {} \;

echo "✅ Permissions set"

# Display setup summary
echo ""
echo "🎉 Product Image Storage Setup Complete!"
echo ""
echo "📁 Directory Structure:"
echo "  public/uploads/"
echo "  ├── products/          # Product images"
echo "  ├── thumbnails/        # Image thumbnails"
echo "  ├── brands/           # Brand logos"
echo "  └── .htaccess         # Security rules"
echo ""
echo "🔧 Next Steps:"
echo "  1. Upload server-product-upload-handler.php to your hosting server"
echo "  2. Update database credentials in the PHP handler"
echo "  3. Test the setup by visiting: https://yourdomain.com/uploads/test.txt"
echo "  4. Delete the test.txt file after verification"
echo ""
echo "📋 Configuration Required:"
echo "  - Update database credentials in server-product-upload-handler.php"
echo "  - Ensure PHP has write permissions to the uploads directory"
echo "  - Verify your hosting server supports PHP file uploads"
echo ""
echo "🔗 Image URLs will be:"
echo "  - Product Images: https://yourdomain.com/uploads/products/filename.jpg"
echo "  - Thumbnails: https://yourdomain.com/uploads/thumbnails/filename.jpg"
echo ""
echo "✅ Setup complete! Your product images will now be stored on your hosting server."
