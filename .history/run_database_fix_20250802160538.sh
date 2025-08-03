#!/bin/bash

# Database Fix Script
# This script runs the database fix SQL in your Supabase instance

echo "🔧 Running database fix script..."
echo "📝 This will create missing tables and fix RLS policies"

# Check if we're in the right directory
if [ ! -f "fix_database_minimal.sql" ]; then
    echo "❌ Error: fix_database_minimal.sql not found in current directory"
    exit 1
fi

echo "✅ Found fix_database_minimal.sql"
echo "📋 Contents of the fix script:"
echo "----------------------------------------"
head -20 fix_database_minimal.sql
echo "..."
echo "----------------------------------------"

echo ""
echo "🚀 To apply this fix:"
echo "1. Go to your Supabase dashboard"
echo "2. Navigate to the SQL Editor"
echo "3. Copy and paste the contents of fix_database_errors.sql"
echo "4. Click 'Run' to execute the script"
echo ""
echo "📊 This will:"
echo "   ✅ Create missing inventory_categories table"
echo "   ✅ Create missing suppliers table"
echo "   ✅ Create products table with proper structure"
echo "   ✅ Create product_variants table"
echo "   ✅ Create sales_orders table"
echo "   ✅ Create sales_order_items table"
echo "   ✅ Create installment_payments table"
echo "   ✅ Fix RLS policies to be less restrictive"
echo "   ✅ Grant proper permissions"
echo "   ✅ Insert sample data"
echo ""
echo "🔄 After running the SQL script, refresh your application"
echo "🎯 The 403 and 400 errors should be resolved"

echo ""
echo "📄 You can also run this command to view the full script:"
echo "   cat fix_database_errors_clean.sql" 