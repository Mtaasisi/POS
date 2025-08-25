#!/bin/bash

# Fix AddProduct 400 Error Script
# This script applies the database migration to fix the AddProduct page

echo "🔧 Fixing AddProduct 400 Error..."
echo "This will add missing fields to the lats_products table"

# Check if we have the database URL
if [ -z "$SUPABASE_DB_URL" ]; then
    echo "❌ Error: SUPABASE_DB_URL environment variable not set"
    echo "Please set it to your Supabase database URL"
    echo "Example: export SUPABASE_DB_URL='postgresql://postgres:[password]@[host]:5432/postgres'"
    exit 1
fi

# Run the SQL script
echo "📝 Applying database changes..."
psql "$SUPABASE_DB_URL" -f apply-addproduct-fix.sql

if [ $? -eq 0 ]; then
    echo "✅ Database migration completed successfully!"
    echo "🎉 The AddProduct page should now work without 400 errors"
else
    echo "❌ Error: Database migration failed"
    echo "Please check your database connection and try again"
    exit 1
fi
