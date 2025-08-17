#!/bin/bash

# Local Image Storage Setup Script
# Run this script on your hosting server to set up the directory structure

echo "🖼️ Setting up Local Image Storage for LATS..."

# Create base directories
echo "📁 Creating upload directories..."
mkdir -p /public_html/uploads/products
mkdir -p /public_html/uploads/thumbnails

# Set proper permissions
echo "🔐 Setting permissions..."
chmod 755 /public_html/uploads
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
EOF

# Create a test file to verify setup
echo "🧪 Creating test file..."
echo "Local storage setup complete!" > /public_html/uploads/test.txt

echo "✅ Local storage setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update server-upload-handler.php with your database credentials"
echo "2. Run the SQL migration: add-local-path-to-product-images.sql"
echo "3. Test the upload functionality"
echo ""
echo "📞 For support, call: 0712378850"
