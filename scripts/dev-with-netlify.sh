#!/bin/bash

# Development script to run with Netlify functions
echo "🚀 Starting LATS CHANCE development with Netlify functions..."
echo ""

# Check if netlify-cli is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

echo "✅ Netlify CLI found"
echo ""

# Build the functions first
echo "🔧 Building Netlify functions..."
netlify build --context dev

echo ""
echo "🌐 Starting development server with Netlify functions..."
echo "📱 WhatsApp proxy will be available at: http://localhost:8888/.netlify/functions/whatsapp-proxy"
echo "🔗 Main app will be available at: http://localhost:8888"
echo ""
echo "💡 This enables:"
echo "   ✅ WhatsApp Testing Ground"
echo "   ✅ Auto-reply functionality"
echo "   ✅ Webhook testing"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start netlify dev
netlify dev
