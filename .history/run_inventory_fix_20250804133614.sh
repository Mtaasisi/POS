#!/bin/bash

echo "🔧 Fixing inventory tables in Supabase..."

# Check if we have the necessary environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required"
    echo "Please set them in your .env file or export them"
    exit 1
fi

# Run the SQL script
echo "📝 Applying inventory tables fix..."
psql "$SUPABASE_URL" -f fix_inventory_tables_complete.sql

if [ $? -eq 0 ]; then
    echo "✅ Inventory tables fixed successfully!"
    echo "🎉 Your app should now work without the 400 errors"
else
    echo "❌ Error applying the fix. Please check your database connection"
    exit 1
fi 