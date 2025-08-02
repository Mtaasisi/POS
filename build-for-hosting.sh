#!/bin/bash

# Clean App - Hostinger Deployment Script
echo "🚀 Building Clean App for Hostinger..."

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist/

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Create deployment directory
echo "📁 Creating deployment directory..."
mkdir -p "Deploy clean"

# Copy built files to deployment directory
echo "📋 Copying files to deployment directory..."
cp -r dist/* "Deploy clean/"
cp public/.htaccess "Deploy clean/"
cp public/config.js "Deploy clean/"
cp public/sw.js "Deploy clean/"
cp public/manifest.webmanifest "Deploy clean/"
cp public/bg-blue-glass.svg "Deploy clean/"
cp -r public/logos "Deploy clean/"

# Update index.html to include config.js
echo "🔧 Updating index.html to include config.js..."
sed -i '' 's|<title>|<script src="/config.js"></script>\n    <title>|' "Deploy clean/index.html"

# Create deployment info file
echo "📝 Creating deployment info..."
cat > "Deploy clean/DEPLOYMENT_INFO.txt" << EOF
Clean App - Hostinger Deployment
Build Date: $(date)
Version: $(node -p "require('./package.json').version")
Environment: Production

Deployment Instructions:
1. Upload all files from this directory to your Hostinger public_html folder
2. Ensure .htaccess file is uploaded (important for routing)
3. Configure your domain to point to the public_html directory
4. Test the application at your domain

Files included:
- index.html (main entry point)
- assets/ (compiled JavaScript and CSS)
- config.js (environment configuration)
- .htaccess (server configuration)
- sw.js (service worker for PWA)
- manifest.webmanifest (PWA manifest)
- bg-blue-glass.svg (background image)
- logos/ (app icons)

Note: Make sure your Hostinger hosting supports:
- PHP (for .htaccess processing)
- mod_rewrite (for SPA routing)
- HTTPS (recommended for PWA features)
EOF

# Create zip file for easy upload
echo "📦 Creating deployment zip..."
cd "Deploy clean"
zip -r "../clean-app-deploy-$(date +%Y%m%d_%H%M%S).zip" .
cd ..

echo "✅ Build complete!"
echo "📁 Deployment files ready in: Deploy clean/"
echo "📦 Zip file created for easy upload"
echo ""
echo "Next steps:"
echo "1. Upload files to Hostinger public_html directory"
echo "2. Configure your domain"
echo "3. Test the application" 