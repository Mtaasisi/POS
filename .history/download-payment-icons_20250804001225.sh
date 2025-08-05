#!/bin/bash

echo "📥 Payment Icon Downloader"
echo "=========================="

# Check if icons directory exists
if [ ! -d "public/icons/payment-methods" ]; then
    echo "📁 Creating icons directory..."
    mkdir -p public/icons/payment-methods
fi

echo ""
echo "💡 How to use:"
echo "1. Provide the icon URLs you want to download"
echo "2. I'll help you save them with proper names"
echo "3. The icons will be available locally in your app"
echo ""

# Function to download icon
download_icon() {
    local url=$1
    local filename=$2
    
    echo "📥 Downloading: $filename"
    echo "🔗 From: $url"
    
    # Download the file
    if curl -L -o "public/icons/payment-methods/$filename" "$url" 2>/dev/null; then
        echo "✅ Successfully downloaded: $filename"
        echo "📁 Saved to: public/icons/payment-methods/$filename"
        echo ""
    else
        echo "❌ Failed to download: $filename"
        echo "🔍 Please check the URL and try again"
        echo ""
    fi
}

# Function to suggest filename from URL
suggest_filename() {
    local url=$1
    local filename=$(basename "$url")
    
    # Remove query parameters
    filename=$(echo "$filename" | cut -d'?' -f1)
    
    # If no extension, add .png
    if [[ ! "$filename" =~ \.(png|jpg|jpeg|svg|gif)$ ]]; then
        filename="${filename}.png"
    fi
    
    echo "$filename"
}

echo "🎯 Ready to download icons!"
echo "📝 Provide the URLs and I'll help you save them locally."
echo ""
echo "Example usage:"
echo "  URL: https://example.com/visa-logo.png"
echo "  Filename: visa.png"
echo ""
echo "Just share the URLs and I'll help you download them! 🚀" 