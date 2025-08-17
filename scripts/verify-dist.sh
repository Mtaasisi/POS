#!/bin/bash

# Dist Folder Verification Script
echo "🔍 Verifying dist folder for deployment..."

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo "❌ Dist folder not found! Run 'npm run build' first."
    exit 1
fi

echo "✅ Dist folder found"

# Check essential files
ESSENTIAL_FILES=(
    "index.html"
    "manifest.json"
    "sw.js"
    "offline.html"
    "_redirects"
    ".htaccess"
)

for file in "${ESSENTIAL_FILES[@]}"; do
    if [ -f "dist/$file" ]; then
        echo "✅ $file found"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

# Check assets folder
if [ -d "dist/assets" ]; then
    echo "✅ Assets folder found"
    ASSET_COUNT=$(find dist/assets -name "*.js" -o -name "*.css" | wc -l)
    echo "📦 Found $ASSET_COUNT asset files"
else
    echo "❌ Assets folder missing"
    exit 1
fi

# Check total size
TOTAL_SIZE=$(du -sh dist/ | cut -f1)
echo "📊 Total size: $TOTAL_SIZE"

# Check file count
FILE_COUNT=$(find dist/ -type f | wc -l)
echo "📁 Total files: $FILE_COUNT"

# Test preview server if running
if curl -s http://localhost:4173 > /dev/null 2>&1; then
    echo "✅ Preview server is running (http://localhost:4173)"
else
    echo "⚠️  Preview server not running. Start with: npm run preview"
fi

echo ""
echo "🎉 Dist folder verification complete!"
echo "🚀 Ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Choose your hosting platform"
echo "2. Set environment variables"
echo "3. Deploy using platform-specific method"
echo "4. Test thoroughly"
