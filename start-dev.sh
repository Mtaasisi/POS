#!/bin/bash

# LATS Chance Development Startup Script
# This script starts both the proxy server and the main application

echo "🚀 Starting LATS Chance Development Environment..."
echo

# Start the WhatsApp proxy server in background
echo "📱 Starting WhatsApp Proxy Server..."
node scripts/start-proxy-quick.js &
PROXY_PID=$!

# Wait a moment for proxy to start
sleep 2

# Check if proxy is running
if curl -s http://localhost:8888/health > /dev/null; then
    echo "✅ WhatsApp Proxy Server running at http://localhost:8888"
else
    echo "❌ Failed to start WhatsApp Proxy Server"
    exit 1
fi

echo "🌐 Starting main application..."
echo "   Use Ctrl+C to stop both servers"
echo

# Start the main application (this will run in foreground)
npm run dev

# When the main app stops, also stop the proxy
echo
echo "🛑 Stopping WhatsApp Proxy Server..."
kill $PROXY_PID 2>/dev/null
echo "✅ Development environment stopped"
