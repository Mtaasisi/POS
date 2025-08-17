#!/bin/bash

# PHP Development Server for ZenoPay USSD Testing
# This script starts a PHP server to handle USSD popup requests

echo "🚀 Starting PHP Development Server for ZenoPay USSD"
echo "=================================================="

# Check if PHP is installed
if ! command -v php &> /dev/null; then
    echo "❌ PHP is not installed. Please install PHP first."
    exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "📁 Project root: $PROJECT_ROOT"
echo "📁 Scripts directory: $SCRIPT_DIR"

# Create a simple index.php in the scripts directory to handle routing
cat > "$SCRIPT_DIR/index.php" << 'EOF'
<?php
/**
 * ZenoPay USSD PHP Server Router
 * Routes requests to the appropriate handler
 */

// Set CORS headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get the request path
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

// Route to the appropriate handler
if (strpos($path, 'zenopay-trigger-ussd.php') !== false) {
    include 'zenopay-ussd-test.php';
} elseif (strpos($path, 'zenopay-ussd-popup.php') !== false) {
    include 'zenopay-ussd-test.php';
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Endpoint not found',
        'available_endpoints' => [
            '/zenopay-trigger-ussd.php',
            '/zenopay-ussd-popup.php'
        ],
        'requested_path' => $path
    ]);
}
EOF

echo "✅ Created PHP router at $SCRIPT_DIR/index.php"

# Function to kill existing PHP server
kill_php_server() {
    echo "🛑 Stopping existing PHP server..."
    pkill -f "php -S localhost:8000" 2>/dev/null || true
    sleep 2
}

# Function to start PHP server
start_php_server() {
    echo "▶️  Starting PHP server on http://localhost:8000"
    echo "📁 Serving from: $SCRIPT_DIR"
    echo "🔗 Available endpoints:"
    echo "   - http://localhost:8000/zenopay-trigger-ussd.php"
    echo "   - http://localhost:8000/zenopay-ussd-popup.php"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    cd "$SCRIPT_DIR"
    php -S localhost:8000
}

# Function to check server status
check_status() {
    echo "🔍 Checking PHP server status..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000 | grep -q "200"; then
        echo "✅ PHP server is running on http://localhost:8000"
    else
        echo "❌ PHP server is not responding"
    fi
}

# Main script logic
case "${1:-start}" in
    "start")
        kill_php_server
        start_php_server
        ;;
    "restart")
        kill_php_server
        start_php_server
        ;;
    "stop")
        kill_php_server
        echo "✅ PHP server stopped"
        ;;
    "status")
        check_status
        ;;
    *)
        echo "Usage: $0 {start|restart|stop|status}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the PHP development server"
        echo "  restart - Restart the PHP server"
        echo "  stop    - Stop the PHP server"
        echo "  status  - Check if server is running"
        exit 1
        ;;
esac
