#!/bin/bash

# Development Setup Script for LATS CHANCE
# This script starts both the Vite development server and PHP server

echo "🚀 Starting LATS CHANCE Development Environment..."

# Function to cleanup background processes on exit
cleanup() {
    echo "🛑 Shutting down development servers..."
    kill $VITE_PID $PHP_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start PHP server in background
echo "📡 Starting PHP server on port 8000..."
php -S localhost:8000 -t public &
PHP_PID=$!

# Wait a moment for PHP server to start
sleep 2

# Test PHP server
echo "🧪 Testing PHP server..."
if curl -s -X POST http://localhost:8000/api/whatsapp-proxy.php \
   -H "Content-Type: application/json" \
   -d '{"action":"health"}' | grep -q "healthy"; then
    echo "✅ PHP server is running correctly"
else
    echo "❌ PHP server failed to start"
    cleanup
fi

# Start Vite development server
echo "⚡ Starting Vite development server..."
npm run dev &
VITE_PID=$!

echo ""
echo "🎉 Development environment is ready!"
echo "📱 Vite server: http://localhost:5173"
echo "📡 PHP server: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for background processes
wait
