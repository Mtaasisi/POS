#!/bin/bash

# SMS Development Environment Setup
# This script starts both the PHP backend server and Vite frontend server

echo "🚀 Starting SMS Development Environment..."

# Function to cleanup background processes on exit
cleanup() {
    echo "🛑 Shutting down development servers..."
    kill $VITE_PID $PHP_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if PHP is available
if ! command -v php &> /dev/null; then
    echo "❌ PHP is not installed. Please install PHP to run the backend server."
    exit 1
fi

# Start PHP server in background
echo "📡 Starting PHP server on port 8000..."
cd "$(dirname "$0")"
php -S localhost:8000 -t public &
PHP_PID=$!

# Wait a moment for PHP server to start
sleep 3

# Test PHP server
echo "🧪 Testing PHP server..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/sms-proxy.php | grep -q "200\|405"; then
    echo "✅ PHP server is running correctly on http://localhost:8000"
else
    echo "❌ PHP server failed to start or SMS proxy not accessible"
    echo "💡 Make sure you're in the project root directory"
    cleanup
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js and npm to run the frontend server."
    cleanup
fi

# Start Vite development server
echo "⚡ Starting Vite development server..."
npm run dev &
VITE_PID=$!

echo ""
echo "🎉 SMS Development environment is ready!"
echo "📱 Frontend (Vite): http://localhost:5173"
echo "📡 Backend (PHP): http://localhost:8000"
echo "🔗 SMS Proxy: http://localhost:8000/api/sms-proxy.php"
echo ""
echo "📋 Test SMS functionality:"
echo "   1. Go to http://localhost:5173"
echo "   2. Navigate to SMS Control Center"
echo "   3. Try sending SMS to 255700000000 (test mode)"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for background processes
wait
