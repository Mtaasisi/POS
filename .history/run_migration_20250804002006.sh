#!/bin/bash

echo "🔧 Database Migration Helper"
echo "============================"
echo ""

echo "📋 Step 1: Check if migration is needed"
echo "Run this SQL in your Supabase SQL Editor:"
echo ""
echo "=== DIAGNOSTIC SQL ==="
cat check_database_columns.sql
echo "=== END DIAGNOSTIC SQL ==="
echo ""

echo "📋 Step 2: If columns are missing, run the migration"
echo "Run this SQL in your Supabase SQL Editor:"
echo ""
echo "=== MIGRATION SQL ==="
cat migrate_finance_accounts_to_payment_methods.sql
echo "=== END MIGRATION SQL ==="
echo ""

echo "🎯 Instructions:"
echo "1. Go to your Supabase Dashboard"
echo "2. Click 'SQL Editor' in the left sidebar"
echo "3. Click 'New Query'"
echo "4. Copy and paste the SQL above"
echo "5. Click 'Run'"
echo "6. Check the results"
echo ""

echo "✅ After running the migration, the 400 error will be fixed!" 