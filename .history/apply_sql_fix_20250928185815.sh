#!/bin/bash

# Script to apply the SQL fix for purchase order functions
# This script will help you apply the SQL to your Supabase database

echo "🔧 Applying Purchase Order RPC Functions Fix..."
echo "=============================================="
echo ""
echo "📋 Instructions:"
echo "1. Open your Supabase Dashboard"
echo "2. Go to SQL Editor"
echo "3. Copy the contents of FIX_PURCHASE_ORDER_FUNCTIONS_CORRECTED.sql"
echo "4. Paste and run the SQL script"
echo ""
echo "📁 SQL file location:"
echo "$(pwd)/FIX_PURCHASE_ORDER_FUNCTIONS_CORRECTED.sql"
echo ""
echo "✅ After running the SQL script, your PurchaseOrderDetailPage should work without 400 errors!"
echo ""
echo "🔍 The script will:"
echo "   - Drop existing conflicting functions"
echo "   - Create get_purchase_order_items_with_products function"
echo "   - Create get_received_items_for_po function"
echo "   - Grant proper permissions"
echo "   - Verify functions are created"
echo ""
echo "Press any key to continue..."
read -n 1 -s
echo ""
echo "🚀 Ready to apply the fix!"
