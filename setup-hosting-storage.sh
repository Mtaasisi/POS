#!/bin/bash

# Hosting Storage Setup Script for LATS
# Run this script on your hosting server to set up local image storage

echo "🖼️ Setting up Hosting Storage for LATS..."

# Create base directories
echo "📁 Creating upload directories..."
mkdir -p /public_html/uploads/brands
mkdir -p /public_html/uploads/products
mkdir -p /public_html/uploads/thumbnails

# Set proper permissions
echo "🔐 Setting permissions..."
chmod 755 /public_html/uploads
chmod 755 /public_html/uploads/brands
chmod 755 /public_html/uploads/products
chmod 755 /public_html/uploads/thumbnails

# Create .htaccess for security
echo "🔒 Creating .htaccess for security..."
cat > /public_html/uploads/.htaccess << 'EOF'
# Allow access to image files only
<FilesMatch "\.(jpg|jpeg|png|gif|webp)$">
    Order Allow,Deny
    Allow from all
</FilesMatch>

# Deny access to all other files
<FilesMatch "^(?!\.(jpg|jpeg|png|gif|webp)$)">
    Order Deny,Allow
    Deny from all
</FilesMatch>

# Prevent script execution
<FilesMatch "\.(php|pl|py|jsp|asp|sh|cgi)$">
    Order Deny,Allow
    Deny from all
</FilesMatch>

# Set cache headers for images
<FilesMatch "\.(jpg|jpeg|png|gif|webp)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 month"
    Header set Cache-Control "public, max-age=2592000"
</FilesMatch>
EOF

# Create a test file to verify setup
echo "🧪 Creating test file..."
echo "Hosting storage setup complete!" > /public_html/uploads/test.txt

echo "✅ Hosting storage setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Upload server-brand-upload-handler.php to your public_html directory"
echo "2. Update the database credentials in server-brand-upload-handler.php"
echo "3. Test the upload functionality"
echo ""
echo "📁 Directory structure created:"
echo "   /public_html/uploads/"
echo "   ├── brands/          (for brand logos)"
echo "   ├── products/        (for product images)"
echo "   └── thumbnails/      (for image thumbnails)"
echo ""
echo "🔗 Your images will be accessible at:"
echo "   https://yourdomain.com/uploads/brands/filename.jpg"
echo "   https://yourdomain.com/uploads/products/filename.jpg"
echo ""
echo "📞 For support, call: 0712378850"
