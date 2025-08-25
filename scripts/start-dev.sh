#!/bin/bash

# Start Development Environment
# This script starts both the Vite dev server and Netlify functions

echo "🚀 Starting LATS CHANCE Development Environment..."

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

# Start Netlify functions in background
echo "📡 Starting Netlify functions on port 8889..."
netlify dev --port 8889 &
NETLIFY_PID=$!

# Wait a moment for Netlify to start
sleep 3

# Check if Netlify started successfully
if curl -s http://localhost:8889/.netlify/functions/health > /dev/null; then
    echo "✅ Netlify functions started successfully"
else
    echo "❌ Failed to start Netlify functions"
    exit 1
fi

# Start Vite dev server
echo "🌐 Starting Vite dev server..."
npm run dev &
VITE_PID=$!

echo "🎉 Development environment started!"
echo "📱 Vite dev server: http://localhost:5173"
echo "📡 Netlify functions: http://localhost:8889"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait
