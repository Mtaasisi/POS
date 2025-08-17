#!/bin/bash

# Netlify Deployment Script
echo "🚀 Starting Netlify deployment..."

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "📦 Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Deploy to Netlify
    echo "🚀 Deploying to Netlify..."
    netlify deploy --prod --dir=dist
    
    echo "🎉 Deployment completed!"
else
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi
