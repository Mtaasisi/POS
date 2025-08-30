#!/bin/bash

# Start Development Environment with Fixed Port Configuration
# This script starts both the Vite dev server and Netlify functions

echo "🚀 Starting LATS CHANCE Development Environment (Fixed Ports)..."

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down development environment..."
    kill $NETLIFY_PID $VITE_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start Netlify functions in background on port 8889
echo "📡 Starting Netlify functions on port 8889..."
netlify dev --port 8889 &
NETLIFY_PID=$!

# Wait a moment for Netlify to start
sleep 5

# Check if Netlify started successfully
if curl -s http://localhost:8889/.netlify/functions/health > /dev/null; then
    echo "✅ Netlify functions started successfully on port 8889"
    echo "🔗 Proxy available at: http://localhost:8889/green-api-proxy"
else
    echo "❌ Failed to start Netlify functions on port 8889"
    echo "🔄 Trying alternative port 8888..."
    
    # Kill the previous process
    kill $NETLIFY_PID 2>/dev/null
    
    # Try port 8888
    netlify dev --port 8888 &
    NETLIFY_PID=$!
    sleep 5
    
    if curl -s http://localhost:8888/.netlify/functions/health > /dev/null; then
        echo "✅ Netlify functions started successfully on port 8888"
        echo "🔗 Proxy available at: http://localhost:8888/green-api-proxy"
    else
        echo "❌ Failed to start Netlify functions on both ports"
        echo "💡 You can still use the app with direct API calls (no proxy)"
    fi
fi

# Start Vite dev server
echo "🌐 Starting Vite dev server..."
npm run dev &
VITE_PID=$!

echo ""
echo "🎉 Development environment started!"
echo "📱 Vite dev server: http://localhost:5173"
echo "📡 Netlify functions: http://localhost:8889 (or 8888)"
echo ""
echo "🔧 Fixed Issues:"
echo "   ✅ Proxy port configuration updated to match Netlify dev server"
echo "   📋 Quick replies table migration ready to run"
echo ""
echo "📝 Next Steps:"
echo "   1. Run the quick_replies migration in Supabase Dashboard"
echo "   2. Your WhatsApp messaging is already working via direct API calls"
echo "   3. Proxy will work once Netlify functions are running"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait
