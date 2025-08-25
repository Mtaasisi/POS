#!/bin/bash

echo "🚀 WhatsApp Hub Asset Upload Helper"
echo "====================================="

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "❌ dist/ directory not found. Building project first..."
    npm run build
fi

# Check if assets directory exists
if [ ! -d "dist/assets" ]; then
    echo "❌ dist/assets/ directory not found!"
    echo "Please run 'npm run build' first."
    exit 1
fi

echo "✅ Assets found in dist/assets/"
echo "📁 Files to upload:"
ls -la dist/assets/

echo ""
echo "📋 Manual Upload Instructions:"
echo "1. Log into your Hostinger File Manager"
echo "2. Navigate to your website root directory"
echo "3. Upload the entire 'dist/assets/' folder"
echo "4. Upload 'dist/.htaccess' file"
echo "5. Ensure file permissions are correct (755 for folders, 644 for files)"
echo ""
echo "🔧 Alternative: Use FTP/SFTP to upload:"
echo "   - Upload dist/assets/ to your server root"
echo "   - Upload dist/.htaccess to your server root"
echo ""
echo "🧪 Test after upload:"
echo "   curl -I https://inauzwa.store/assets/index-i252VRQH.js"
echo ""
echo "📞 If you need help, check ASSET_404_FIX_GUIDE.md"
