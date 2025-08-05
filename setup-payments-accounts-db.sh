#!/bin/bash

echo "🚀 Payments Accounts Database Setup"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if the SQL file exists
if [ ! -f "setup_payments_accounts_database.sql" ]; then
    echo "❌ SQL file not found: setup_payments_accounts_database.sql"
    exit 1
fi

# Check if the Node.js script exists
if [ ! -f "apply_payments_accounts_database.mjs" ]; then
    echo "❌ Node.js script not found: apply_payments_accounts_database.mjs"
    exit 1
fi

echo "📋 Prerequisites check passed!"
echo ""

echo "🔧 Running database setup..."
echo ""

# Run the Node.js script
node apply_payments_accounts_database.mjs

echo ""
echo "✅ Setup script completed!"
echo ""
echo "📝 Next steps:"
echo "1. Check your Supabase dashboard to verify the tables were created"
echo "2. Test the Payments Accounts feature in your POS system"
echo "3. Access the feature via: Navigation Menu > Payments Accounts"
echo "   or from POS > Quick Actions > Payments Accounts"
echo "" 