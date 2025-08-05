#!/bin/bash

echo "🔧 Fixing customer_id NULL issue..."
echo ""

echo "📋 Running database fix script..."
echo "Please run the following SQL in your Supabase SQL Editor:"
echo ""
echo "=== COPY THE SQL BELOW ==="
cat fix_customer_id_null.sql
echo "=== END SQL ==="
echo ""

echo "✅ After running the SQL script:"
echo "1. customer_id will be made nullable in sales_orders table"
echo "2. The frontend code has been updated to handle undefined customer_id"
echo "3. Sales orders can be created without selecting a customer"
echo ""

echo "🔄 The POS system should now work without the 400 error!"
echo "Try creating a sale order again (with or without a customer)." 