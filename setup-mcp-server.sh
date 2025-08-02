#!/bin/bash

echo "🚀 Setting up MCP Supabase Server..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install --prefix . -f mcp-supabase-package.json

# Make the server executable
echo "🔧 Making server executable..."
chmod +x mcp-supabase-server.js

# Create environment file
echo "🔐 Creating environment file..."
cat > .env << EOF
SUPABASE_URL=https://jxhzveborezjhsmzsgbc.supabase.co
SUPABASE_ANON_KEY=sbp_3b13a253d717d94e0659d9bdf53d3907d092383d
EOF

echo "✅ MCP Supabase server setup complete!"
echo ""
echo "📋 Usage Instructions:"
echo "1. Add the mcp-supabase-config.json to your MCP client configuration"
echo "2. The server provides these resources:"
echo "   - supabase://customers - Customer data"
echo "   - supabase://devices - Device repair records"
echo "   - supabase://returns - Return/refund records"
echo "   - supabase://payments - Payment transactions"
echo "   - supabase://audit-logs - System audit logs"
echo "   - supabase://points - Loyalty points data"
echo ""
echo "🔧 Available tools:"
echo "   - get_customer_by_id - Get customer details"
echo "   - get_device_by_id - Get device details"
echo "   - get_customer_devices - Get customer's devices"
echo "   - get_customer_payments - Get payment history"
echo "   - get_devices_by_status - Filter devices by status"
echo "   - get_returns_by_status - Filter returns by status"
echo "   - get_customer_points - Get points balance & history"
echo "   - get_audit_logs_by_entity - Get audit logs for entity"
echo ""
echo "🎯 Features:"
echo "   ✓ Displays names instead of IDs"
echo "   ✓ Formats currency with commas"
echo "   ✓ Handles relationships between tables"
echo "   ✓ Secure connection to your Supabase host" 