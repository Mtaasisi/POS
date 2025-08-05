#!/bin/bash

echo "🔄 Running Finance Accounts Migration..."
echo "This will add payment method columns to the finance_accounts table"

# Check if we have the migration file
if [ ! -f "migrate_finance_accounts_to_payment_methods.sql" ]; then
    echo "❌ Migration file not found: migrate_finance_accounts_to_payment_methods.sql"
    exit 1
fi

echo "📋 Migration file found. Please run this SQL in your Supabase SQL Editor:"
echo ""
echo "=== MIGRATION SQL ==="
cat migrate_finance_accounts_to_payment_methods.sql
echo "=== END MIGRATION SQL ==="
echo ""
echo "✅ Copy the SQL above and paste it into your Supabase SQL Editor"
echo "🔗 Go to: https://supabase.com/dashboard/project/[YOUR-PROJECT]/sql/editor"
echo ""
echo "After running the migration, the custom payment icons feature will work!" 