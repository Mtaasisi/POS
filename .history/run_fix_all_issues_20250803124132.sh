#!/bin/bash

# Fix All Database Issues Script
# This script addresses the 400 Bad Request and 404 Not Found errors

echo "🔧 Fixing all database issues..."

# Check if we have the database URL
if [ -z "$SUPABASE_DB_URL" ]; then
    echo "❌ SUPABASE_DB_URL environment variable not set"
    echo "Please set your database URL:"
    echo "export SUPABASE_DB_URL='postgresql://username:password@host:port/database'"
    exit 1
fi

# Run the fix script
echo "📝 Running database fixes..."
psql "$SUPABASE_DB_URL" -f fix_all_issues.sql

if [ $? -eq 0 ]; then
    echo "✅ Database fixes completed successfully!"
    echo ""
    echo "🎉 Issues fixed:"
    echo "  • SMS logs table structure updated"
    echo "  • Diagnostic templates table created"
    echo "  • Communication templates table created"
    echo "  • RLS policies configured"
    echo "  • Indexes created for performance"
    echo ""
    echo "🔄 Please refresh your application to see the changes."
else
    echo "❌ Error running database fixes"
    exit 1
fi 