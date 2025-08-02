#!/bin/bash

# Apply SMS Tables Fix Script
# This script applies the missing SMS tables to fix the 404 errors

echo "🔧 Applying SMS tables fix..."

# Check if we're in the right directory
if [ ! -f "fix_sms_tables.sql" ]; then
    echo "❌ Error: fix_sms_tables.sql not found in current directory"
    exit 1
fi

echo "📋 Options to apply the fix:"
echo ""
echo "1. Using Supabase CLI (if Docker is running):"
echo "   supabase db reset --linked"
echo ""
echo "2. Using direct database connection:"
echo "   psql -h localhost -p 54322 -U postgres -d postgres -f fix_sms_tables.sql"
echo ""
echo "3. Using Supabase Studio (web interface):"
echo "   - Open http://localhost:54323"
echo "   - Go to SQL Editor"
echo "   - Copy and paste the contents of fix_sms_tables.sql"
echo "   - Click Run"
echo ""

echo "🚀 Recommended approach:"
echo "========================"
echo "Since Docker doesn't seem to be running, I recommend using option 3:"
echo ""
echo "1. Start your Supabase instance:"
echo "   supabase start"
echo ""
echo "2. Open Supabase Studio at: http://localhost:54323"
echo ""
echo "3. Go to the SQL Editor tab"
echo ""
echo "4. Copy the contents of fix_sms_tables.sql and paste it into the editor"
echo ""
echo "5. Click 'Run' to execute the script"
echo ""

echo "📁 The fix_sms_tables.sql file contains:"
echo "========================================"
echo "✅ sms_triggers table"
echo "✅ scheduled_sms table" 
echo "✅ sms_trigger_logs table"
echo "✅ communication_templates table"
echo "✅ Sample data and RLS policies"
echo ""

echo "🎯 After applying this fix, the 404 errors should be resolved!"
echo ""
echo "💡 Alternative: If you want to start fresh with Docker:"
echo "   docker start"
echo "   supabase start"
echo "   supabase db reset --linked" 