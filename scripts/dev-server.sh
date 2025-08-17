#!/bin/bash

# Development Server Management Script
# This script helps manage the Vite development server

echo "🚀 LATS Development Server Manager"
echo "=================================="

# Function to kill existing Vite processes
kill_vite() {
    echo "🛑 Stopping existing Vite processes..."
    pkill -f "vite" 2>/dev/null || true
    sleep 2
}

# Function to start the development server
start_dev() {
    echo "▶️  Starting development server..."
    npm run dev
}

# Function to restart the development server
restart_dev() {
    echo "🔄 Restarting development server..."
    kill_vite
    start_dev
}

# Function to check server status
check_status() {
    echo "🔍 Checking server status..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 | grep -q "200"; then
        echo "✅ Server is running on http://localhost:5173"
    else
        echo "❌ Server is not responding"
    fi
}

# Main script logic
case "${1:-start}" in
    "start")
        start_dev
        ;;
    "restart")
        restart_dev
        ;;
    "stop")
        kill_vite
        echo "✅ Vite processes stopped"
        ;;
    "status")
        check_status
        ;;
    "clean")
        echo "🧹 Cleaning node_modules and reinstalling..."
        rm -rf node_modules package-lock.json
        npm install
        start_dev
        ;;
    *)
        echo "Usage: $0 {start|restart|stop|status|clean}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the development server"
        echo "  restart - Restart the development server"
        echo "  stop    - Stop all Vite processes"
        echo "  status  - Check if server is running"
        echo "  clean   - Clean install and start server"
        exit 1
        ;;
esac
