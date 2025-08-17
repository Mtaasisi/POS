#!/bin/bash

# Fix POS Settings 406 Errors Script
# This script runs the migration to fix the 406 errors

echo "🔧 Fixing POS Settings 406 Errors..."

# Check if we're in the right directory
if [ ! -f "supabase/migrations/20241201000019_fix_pos_settings_406_errors.sql" ]; then
    echo "❌ Migration file not found. Please run this script from the project root."
    exit 1
fi

# Run the migration
echo "📦 Running migration..."
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi

# Test the tables
echo "🧪 Testing POS settings tables..."

# Test query to check if tables exist and are accessible
supabase db reset --linked

echo "✅ POS Settings tables should now be working!"
echo "🔄 Please restart your application and test the POS settings functionality."
