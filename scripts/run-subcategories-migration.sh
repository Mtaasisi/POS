#!/bin/bash

# Script to run subcategories migration using Supabase CLI

echo "🚀 Running subcategories migration..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "supabase/migrations/20241201000003_add_subcategories.sql" ]; then
    echo "❌ Migration file not found. Please run this script from the project root."
    exit 1
fi

# Run the migration
echo "📄 Applying migration: 20241201000003_add_subcategories.sql"
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully!"
    echo ""
    echo "📋 Changes applied:"
    echo "   ✅ Added parent_id column to lats_categories"
    echo "   ✅ Added is_active column"
    echo "   ✅ Added sort_order column"
    echo "   ✅ Added icon column"
    echo "   ✅ Added metadata column"
    echo "   ✅ Created index for parent_id"
    echo "   ✅ Updated unique constraint for name + parent_id"
    echo "   ✅ Added circular reference prevention trigger"
    echo ""
    echo "🎉 Subcategories feature is now ready to use!"
else
    echo "❌ Migration failed. Please check the error messages above."
    exit 1
fi
