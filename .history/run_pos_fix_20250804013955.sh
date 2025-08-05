#!/bin/bash

echo "🔧 Fixing POS Sales Order 400 Error..."
echo ""

echo "📋 Running database fix script..."
echo "Please run the following SQL in your Supabase SQL Editor:"
echo ""
echo "=== COPY THE SQL BELOW ==="
cat fix_pos_sales_order_error.sql
echo "=== END SQL ==="
echo ""

echo "✅ After running the SQL script:"
echo "1. The sales_orders table will be properly configured"
echo "2. A default location will be created with proper UUID"
echo "3. RLS policies will be set up correctly"
echo "4. The frontend will load the correct location ID"
echo ""

echo "🔄 The POS system should now work without the 400 error!"
echo "Try creating a sale order again." 