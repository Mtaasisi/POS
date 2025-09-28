#!/bin/bash

echo "🔍 Checking Socket Connections..."
echo "=================================="
echo ""

# Check network connectivity
echo "🌐 Network Status:"
if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
    echo "  ✅ Internet connection: OK"
else
    echo "  ❌ Internet connection: FAILED"
fi

# Check if we can reach common services
echo ""
echo "📡 Service Connectivity:"
services=("google.com:443" "github.com:443" "supabase.com:443")
for service in "${services[@]}"; do
    host=$(echo $service | cut -d: -f1)
    port=$(echo $service | cut -d: -f2)
    if timeout 5 bash -c "</dev/tcp/$host/$port" 2>/dev/null; then
        echo "  ✅ $host:$port: OK"
    else
        echo "  ❌ $host:$port: FAILED"
    fi
done

# Check for running processes that might indicate socket connections
echo ""
echo "🔌 Active Network Connections:"
if command -v netstat > /dev/null 2>&1; then
    echo "  Active TCP connections:"
    netstat -an | grep ESTABLISHED | head -5 | while read line; do
        echo "    $line"
    done
elif command -v ss > /dev/null 2>&1; then
    echo "  Active TCP connections:"
    ss -tuln | head -5 | while read line; do
        echo "    $line"
    done
else
    echo "  ⚠️ netstat/ss not available"
fi

# Check for WebSocket-related processes
echo ""
echo "📱 WebSocket/Real-time Services:"
if pgrep -f "node.*websocket" > /dev/null; then
    echo "  ✅ WebSocket processes found"
else
    echo "  ⚠️ No WebSocket processes detected"
fi

# Check for development server
echo ""
echo "🛠️ Development Server:"
if pgrep -f "vite\|webpack\|next" > /dev/null; then
    echo "  ✅ Development server running"
    pgrep -f "vite\|webpack\|next" | while read pid; do
        echo "    PID: $pid"
    done
else
    echo "  ⚠️ No development server detected"
fi

# Check for database connections
echo ""
echo "🗄️ Database Connections:"
if pgrep -f "postgres\|mysql\|mongodb" > /dev/null; then
    echo "  ✅ Database processes found"
else
    echo "  ⚠️ No local database processes detected (using cloud database)"
fi

# Check environment variables
echo ""
echo "🔧 Environment Check:"
if [ -f ".env" ] || [ -f ".env.local" ]; then
    echo "  ✅ Environment file found"
    if grep -q "VITE_SUPABASE" .env* 2>/dev/null; then
        echo "  ✅ Supabase configuration found"
    else
        echo "  ⚠️ Supabase configuration not found in env files"
    fi
else
    echo "  ⚠️ No environment file found"
fi

echo ""
echo "📊 Summary:"
echo "  - Run this script to check basic connectivity"
echo "  - Open connection-status-checker.html in browser for detailed status"
echo "  - Check browser console for real-time connection logs"
echo "  - Use the app's built-in status indicators for live monitoring"
echo ""
echo "✅ Connection check complete!"
