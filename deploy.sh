#!/bin/bash

# 🚀 LATS Application Deployment Script
# This script helps you deploy your LATS application to various platforms

echo "🚀 LATS Application Deployment Script"
echo "======================================"

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo "❌ Error: dist folder not found. Please run 'npm run build' first."
    exit 1
fi

echo "✅ Build folder found: dist/"
echo "📊 Build size: $(du -sh dist | cut -f1)"

# Function to deploy to Netlify
deploy_netlify() {
    echo "🌐 Deploying to Netlify..."
    if command -v netlify &> /dev/null; then
        netlify deploy --dir=dist --prod
    else
        echo "❌ Netlify CLI not found. Install with: npm install -g netlify-cli"
        echo "📦 Or download from: https://app.netlify.com/drop"
    fi
}

# Function to deploy to Vercel
deploy_vercel() {
    echo "▲ Deploying to Vercel..."
    if command -v vercel &> /dev/null; then
        vercel --prod
    else
        echo "❌ Vercel CLI not found. Install with: npm install -g vercel"
    fi
}

# Function to deploy to Firebase
deploy_firebase() {
    echo "🔥 Deploying to Firebase..."
    if command -v firebase &> /dev/null; then
        firebase deploy
    else
        echo "❌ Firebase CLI not found. Install with: npm install -g firebase-tools"
    fi
}

# Function to create deployment package
create_package() {
    echo "📦 Creating deployment package..."
    tar -czf lats-deployment-$(date +%Y%m%d-%H%M%S).tar.gz dist/
    echo "✅ Deployment package created: lats-deployment-*.tar.gz"
}

# Main menu
echo ""
echo "Choose deployment option:"
echo "1) Deploy to Netlify"
echo "2) Deploy to Vercel"
echo "3) Deploy to Firebase"
echo "4) Create deployment package"
echo "5) Show deployment info"
echo "6) Exit"

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        deploy_netlify
        ;;
    2)
        deploy_vercel
        ;;
    3)
        deploy_firebase
        ;;
    4)
        create_package
        ;;
    5)
        echo ""
        echo "📋 Deployment Information:"
        echo "=========================="
        echo "Build folder: dist/"
        echo "Main bundle: $(ls -lh dist/assets/index-*.js | head -1 | awk '{print $5}')"
        echo "CSS bundle: $(ls -lh dist/assets/index-*.css | head -1 | awk '{print $5}')"
        echo "Total files: $(find dist -type f | wc -l)"
        echo ""
        echo "🌐 Preview URL: http://localhost:4173"
        echo "📱 PWA enabled: Yes"
        echo "🔒 HTTPS ready: Yes"
        echo ""
        echo "📁 Key files:"
        echo "- index.html (main entry point)"
        echo "- assets/ (bundled JavaScript/CSS)"
        echo "- sw.js (service worker)"
        echo "- manifest.webmanifest (PWA manifest)"
        ;;
    6)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment process completed!"
echo "📖 Check DEPLOYMENT_GUIDE.md for more details."
